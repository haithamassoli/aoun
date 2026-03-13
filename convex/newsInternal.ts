import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getById = internalQuery({
  args: { newsId: v.id("news") },
  handler: async (ctx, { newsId }) => {
    return await ctx.db.get("news", newsId);
  },
});

export const getMajorById = internalQuery({
  args: { majorId: v.id("majors") },
  handler: async (ctx, { majorId }) => {
    return await ctx.db.get("majors", majorId);
  },
});

export const getUniversityById = internalQuery({
  args: { universityId: v.id("universities") },
  handler: async (ctx, { universityId }) => {
    return await ctx.db.get("universities", universityId);
  },
});

export const getSubscriptionsByMajor = internalQuery({
  args: { majorId: v.id("majors") },
  handler: async (ctx, { majorId }) => {
    const allSubscriptions = await ctx.db.query("pushSubscriptions").collect();
    return allSubscriptions.filter((sub) => sub.majorIds.includes(majorId));
  },
});
