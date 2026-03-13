import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    majorId: v.id("majors"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    const now = Date.now();

    if (existing) {
      if (!existing.majorIds.includes(args.majorId)) {
        await ctx.db.patch("pushSubscriptions", existing._id, {
          majorIds: [...existing.majorIds, args.majorId],
          p256dh: args.p256dh,
          auth: args.auth,
          updatedAt: now,
        });
      }
    } else {
      await ctx.db.insert("pushSubscriptions", {
        endpoint: args.endpoint,
        p256dh: args.p256dh,
        auth: args.auth,
        majorIds: [args.majorId],
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
    majorId: v.id("majors"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (!existing) return null;

    const updatedMajorIds = existing.majorIds.filter(
      (id) => id !== args.majorId
    );

    if (updatedMajorIds.length === 0) {
      await ctx.db.delete("pushSubscriptions", existing._id);
    } else {
      await ctx.db.patch("pushSubscriptions", existing._id, {
        majorIds: updatedMajorIds,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const getByEndpoint = query({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
  },
});

export const removeExpired = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (sub) {
      await ctx.db.delete("pushSubscriptions", sub._id);
    }
  },
});
