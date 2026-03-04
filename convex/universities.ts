import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin, authenticateUser } from "./helpers";

const universityDoc = v.object({
  _id: v.id("universities"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  logoUrl: v.optional(v.string()),
  order: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(universityDoc),
  handler: async (ctx) => {
    return await ctx.db.query("universities").withIndex("by_order").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), universityDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("universities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    order: v.number(),
  },
  returns: v.id("universities"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const existing = await ctx.db
      .query("universities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new ConvexError({ code: "UNIVERSITY_SLUG_EXISTS" });
    }

    return await ctx.db.insert("universities", {
      name: args.name,
      slug: args.slug,
      logoUrl: args.logoUrl,
      order: args.order,
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    if (args.slug) {
      const conflicting = await ctx.db
        .query("universities")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .first();
      if (conflicting && conflicting._id !== args.universityId) {
        throw new ConvexError({ code: "UNIVERSITY_SLUG_EXISTS" });
      }
    }

    const { universityId, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch("universities", universityId, filtered);
    }

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

    await ctx.db.delete("universities", args.universityId);
    return null;
  },
});
