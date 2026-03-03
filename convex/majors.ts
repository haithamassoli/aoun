import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, assertAdmin } from "./helpers";

export const listByUniversity = query({
  args: { universityId: v.id("universities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("majors")
      .withIndex("by_universityId", (q) =>
        q.eq("universityId", args.universityId)
      )
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("majors")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// ── Add major (admin only) ────────────────────────────────────────────
export const add = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    return await ctx.db.insert("majors", {
      universityId: args.universityId,
      name: args.name,
      slug: args.slug,
      order: args.order,
    });
  },
});

// ── Update major (admin only) ─────────────────────────────────────────
export const update = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const { majorId, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(
        ([key, value]) => key !== "token" && value !== undefined
      )
    );

    await ctx.db.patch(majorId, filtered);
  },
});

// ── Delete major (admin only) ─────────────────────────────────────────
export const remove = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    await ctx.db.delete(args.majorId);
  },
});
