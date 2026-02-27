import { query } from "./_generated/server";
import { v } from "convex/values";

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
