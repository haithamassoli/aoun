import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin, authenticateUser, isNotDeleted, softDeleteFields } from "./helpers";
import { buildUniversitySearchToken, normalize } from "./searchUtils";

const universityDoc = v.object({
  _id: v.id("universities"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  logoUrl: v.optional(v.string()),
  order: v.number(),
  alias: v.optional(v.string()),
  searchToken: v.optional(v.string()),
});

export const list = query({
  args: {},
  returns: v.array(universityDoc),
  handler: async (ctx) => {
    const all = await ctx.db.query("universities").withIndex("by_order").collect();
    return all.filter(isNotDeleted);
  },
});

export const searchPublic = query({
  args: { query: v.string() },
  returns: v.array(universityDoc),
  handler: async (ctx, args) => {
    const queryText = normalize(args.query);
    if (!queryText) {
      return [];
    }

    const matches = await ctx.db
      .query("universities")
      .withSearchIndex("search_token", (q) =>
        q.search("searchToken", queryText)
      )
      .collect();

    return matches.filter(isNotDeleted);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), universityDoc),
  handler: async (ctx, args) => {
    const university = await ctx.db
      .query("universities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!university || university.deletedAt !== undefined) return null;
    return university;
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    order: v.number(),
    alias: v.optional(v.string()),
  },
  returns: v.id("universities"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    // Uniqueness check ignoring soft-deleted rows
    const existing = await ctx.db
      .query("universities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    if (existing.some(isNotDeleted)) {
      throw new ConvexError({ code: "UNIVERSITY_SLUG_EXISTS" });
    }

    const searchToken = buildUniversitySearchToken({
      name: args.name,
      slug: args.slug,
      alias: args.alias,
    });

    return await ctx.db.insert("universities", {
      name: args.name,
      slug: args.slug,
      logoUrl: args.logoUrl,
      order: args.order,
      alias: args.alias,
      searchToken,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    order: v.optional(v.number()),
    alias: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const current = await ctx.db.get("universities", args.universityId);
    if (!current || current.deletedAt !== undefined) {
      throw new ConvexError({ code: "UNIVERSITY_NOT_FOUND" });
    }

    if (args.slug) {
      const slug = args.slug;
      const conflicting = await ctx.db
        .query("universities")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .collect();
      const conflict = conflicting.find(
        (u) => isNotDeleted(u) && u._id !== args.universityId
      );
      if (conflict) {
        throw new ConvexError({ code: "UNIVERSITY_SLUG_EXISTS" });
      }
    }

    // Recompute searchToken
    const newName = args.name ?? current.name;
    const newSlug = args.slug ?? current.slug;
    const newAlias = args.alias !== undefined ? args.alias : current.alias;
    const searchToken = buildUniversitySearchToken({
      name: newName,
      slug: newSlug,
      alias: newAlias,
    });

    const { universityId, token: _token, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch("universities", universityId, {
      ...filtered,
      searchToken,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const university = await ctx.db.get("universities", args.universityId);
    if (!university || university.deletedAt !== undefined) {
      return null; // already deleted, idempotent
    }

    await ctx.db.patch("universities", args.universityId, softDeleteFields(user._id));
    return null;
  },
});
