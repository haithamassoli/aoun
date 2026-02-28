import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, assertCanEditMajor, assertCanEditCourse } from "./helpers";

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

// ── Add course (auth + permission) ────────────────────────────────────
export const add = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    name: v.string(),
    slug: v.string(),
    courseCode: v.optional(v.string()),
    semester: v.optional(v.number()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);

    return await ctx.db.insert("courses", {
      majorId: args.majorId,
      name: args.name,
      slug: args.slug,
      courseCode: args.courseCode,
      semester: args.semester,
      order: args.order,
    });
  },
});

// ── Update course (auth + permission) ─────────────────────────────────
export const update = mutation({
  args: {
    token: v.string(),
    courseId: v.id("courses"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    courseCode: v.optional(v.string()),
    semester: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditCourse(ctx, user._id, args.courseId);

    const { token: _, courseId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(courseId, filtered);
  },
});
