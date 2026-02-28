import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, assertAdmin } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("universities").withIndex("by_slug").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("universities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// ── Add university (admin only) ───────────────────────────────────────
export const add = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    return await ctx.db.insert("universities", {
      name: args.name,
      slug: args.slug,
      logoUrl: args.logoUrl,
      order: args.order,
    });
  },
});

// ── Update university (admin only) ────────────────────────────────────
export const update = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const { token: _, universityId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(universityId, filtered);
  },
});

// ── Delete university (admin only) ────────────────────────────────────
export const remove = mutation({
  args: {
    token: v.string(),
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    await ctx.db.delete(args.universityId);
  },
});
