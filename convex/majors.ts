import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin, authenticateUser, isNotDeleted, softDeleteFields } from "./helpers";
import { buildMajorSearchToken, normalize } from "./searchUtils";

const majorDoc = v.object({
  _id: v.id("majors"),
  _creationTime: v.number(),
  universityId: v.id("universities"),
  name: v.string(),
  slug: v.string(),
  order: v.number(),
  alias: v.optional(v.string()),
  searchToken: v.optional(v.string()),
});

export const listByUniversity = query({
  args: { universityId: v.id("universities") },
  returns: v.array(majorDoc),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("majors")
      .withIndex("by_universityId_order", (q) =>
        q.eq("universityId", args.universityId)
      )
      .collect();
    return all.filter(isNotDeleted);
  },
});

export const searchByUniversity = query({
  args: {
    universityId: v.id("universities"),
    query: v.string(),
  },
  returns: v.array(majorDoc),
  handler: async (ctx, args) => {
    const queryText = normalize(args.query);
    if (!queryText) {
      return [];
    }

    const matches = await ctx.db
      .query("majors")
      .withSearchIndex("search_token", (q) =>
        q
          .search("searchToken", queryText)
          .eq("universityId", args.universityId)
      )
      .collect();

    return matches.filter(isNotDeleted);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), majorDoc),
  handler: async (ctx, args) => {
    const major = await ctx.db
      .query("majors")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!major || major.deletedAt !== undefined) return null;
    return major;
  },
});

export const getByUniversityAndSlug = query({
  args: {
    universityId: v.id("universities"),
    slug: v.string(),
  },
  returns: v.union(v.null(), majorDoc),
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("majors")
      .withIndex("by_universityId_slug", (q) =>
        q.eq("universityId", args.universityId).eq("slug", args.slug)
      )
      .collect();
    const major = results.find(isNotDeleted);
    return major ?? null;
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
    alias: v.optional(v.string()),
  },
  returns: v.id("majors"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    // Uniqueness check ignoring soft-deleted rows
    const existing = await ctx.db
      .query("majors")
      .withIndex("by_universityId_slug", (q) =>
        q.eq("universityId", args.universityId).eq("slug", args.slug)
      )
      .collect();
    if (existing.some(isNotDeleted)) {
      throw new ConvexError({ code: "MAJOR_SLUG_EXISTS" });
    }

    const searchToken = buildMajorSearchToken({
      name: args.name,
      slug: args.slug,
      alias: args.alias,
    });

    return await ctx.db.insert("majors", {
      universityId: args.universityId,
      name: args.name,
      slug: args.slug,
      order: args.order,
      alias: args.alias,
      searchToken,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    order: v.optional(v.number()),
    alias: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const current = await ctx.db.get("majors", args.majorId);
    if (!current || current.deletedAt !== undefined) {
      throw new ConvexError({ code: "MAJOR_NOT_FOUND" });
    }

    if (args.slug) {
      const slug = args.slug;
      const conflicting = await ctx.db
        .query("majors")
        .withIndex("by_universityId_slug", (q) =>
          q.eq("universityId", current.universityId).eq("slug", slug)
        )
        .collect();
      const conflict = conflicting.find(
        (m) => isNotDeleted(m) && m._id !== args.majorId
      );
      if (conflict) {
        throw new ConvexError({ code: "MAJOR_SLUG_EXISTS" });
      }
    }

    // Recompute searchToken
    const newName = args.name ?? current.name;
    const newSlug = args.slug ?? current.slug;
    const newAlias = args.alias !== undefined ? args.alias : current.alias;
    const searchToken = buildMajorSearchToken({
      name: newName,
      slug: newSlug,
      alias: newAlias,
    });

    const { majorId, token: _token, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch("majors", majorId, {
      ...filtered,
      searchToken,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const major = await ctx.db.get("majors", args.majorId);
    if (!major || major.deletedAt !== undefined) {
      return null;
    }

    await ctx.db.patch("majors", args.majorId, softDeleteFields(user._id));
    return null;
  },
});
