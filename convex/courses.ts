import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByMajor = query({
  args: { majorId: v.id("majors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_majorId", (q) => q.eq("majorId", args.majorId))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});
