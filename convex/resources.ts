import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  authenticateUser,
  assertCanEditCourse,
  assertCanEditResource,
} from "./helpers";

export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resources")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// ── Add resource (auth + permission) ──────────────────────────────────
export const add = mutation({
  args: {
    token: v.string(),
    courseId: v.id("courses"),
    type: v.union(v.literal("link"), v.literal("richtext")),
    category: v.union(
      v.literal("notes"),
      v.literal("exams"),
      v.literal("videos"),
      v.literal("summaries"),
      v.literal("tips"),
      v.literal("other")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditCourse(ctx, user._id, args.courseId);

    const now = Date.now();
    return await ctx.db.insert("resources", {
      courseId: args.courseId,
      type: args.type,
      category: args.category,
      title: args.title,
      url: args.url,
      content: args.content,
      order: args.order,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Update resource (auth + permission) ───────────────────────────────
export const update = mutation({
  args: {
    token: v.string(),
    resourceId: v.id("resources"),
    title: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("notes"),
        v.literal("exams"),
        v.literal("videos"),
        v.literal("summaries"),
        v.literal("tips"),
        v.literal("other")
      )
    ),
    type: v.optional(v.union(v.literal("link"), v.literal("richtext"))),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditResource(ctx, user._id, args.resourceId);

    const { token: _, resourceId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(resourceId, {
      ...filtered,
      updatedAt: Date.now(),
    });
  },
});

// ── Delete resource (auth + permission) ───────────────────────────────
export const remove = mutation({
  args: {
    token: v.string(),
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditResource(ctx, user._id, args.resourceId);

    await ctx.db.delete(args.resourceId);
  },
});
