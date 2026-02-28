import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  authenticateUser,
  assertCanEditCourse,
  assertCanEditResource,
} from "./helpers";

function assertSafeUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("INVALID_URL_PROTOCOL");
    }
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_URL_PROTOCOL") throw e;
    throw new Error("INVALID_URL");
  }
}

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

    if (args.url) assertSafeUrl(args.url);

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

    if (args.url) assertSafeUrl(args.url);

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
