import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin, authenticateUser } from "./helpers";

const majorDoc = v.object({
  _id: v.id("majors"),
  _creationTime: v.number(),
  universityId: v.id("universities"),
  name: v.string(),
  slug: v.string(),
  order: v.number(),
});

export const listByUniversity = query({
  args: { universityId: v.id("universities") },
  returns: v.array(majorDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("majors")
      .withIndex("by_universityId_order", (q) =>
        q.eq("universityId", args.universityId)
      )
      .collect();
  },
});

// Backward-compatible but ambiguous if slugs repeat across universities.
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), majorDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("majors")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getByUniversityAndSlug = query({
  args: {
    universityId: v.id("universities"),
    slug: v.string(),
  },
  returns: v.union(v.null(), majorDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("majors")
      .withIndex("by_universityId_slug", (q) =>
        q.eq("universityId", args.universityId).eq("slug", args.slug)
      )
      .unique();
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  },
  returns: v.id("majors"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const existing = await ctx.db
      .query("majors")
      .withIndex("by_universityId_slug", (q) =>
        q.eq("universityId", args.universityId).eq("slug", args.slug)
      )
      .unique();

    if (existing) {
      throw new ConvexError({ code: "MAJOR_SLUG_EXISTS" });
    }

    return await ctx.db.insert("majors", {
      universityId: args.universityId,
      name: args.name,
      slug: args.slug,
      order: args.order,
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const current = await ctx.db.get("majors", args.majorId);
    if (!current) {
      throw new ConvexError({ code: "MAJOR_NOT_FOUND" });
    }

    if (args.slug) {
      const conflicting = await ctx.db
        .query("majors")
        .withIndex("by_universityId_slug", (q) =>
          q.eq("universityId", current.universityId).eq("slug", args.slug)
        )
        .unique();
      if (conflicting && conflicting._id !== args.majorId) {
        throw new ConvexError({ code: "MAJOR_SLUG_EXISTS" });
      }
    }

    const { majorId, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch("majors", majorId, filtered);
    }

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

    await ctx.db.delete("majors", args.majorId);
    return null;
  },
});
