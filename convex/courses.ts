import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanEditCourse, assertCanEditMajor, authenticateUser } from "./helpers";

const courseDoc = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  majorId: v.id("majors"),
  name: v.string(),
  slug: v.string(),
  courseCode: v.optional(v.string()),
  semester: v.optional(v.number()),
  order: v.number(),
});

export const listByMajor = query({
  args: { majorId: v.id("majors") },
  returns: v.array(courseDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_majorId_order", (q) => q.eq("majorId", args.majorId))
      .collect();
  },
});

// Backward-compatible but ambiguous if slugs repeat across majors.
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), courseDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getByMajorAndSlug = query({
  args: {
    majorId: v.id("majors"),
    slug: v.string(),
  },
  returns: v.union(v.null(), courseDoc),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_majorId_slug", (q) =>
        q.eq("majorId", args.majorId).eq("slug", args.slug)
      )
      .unique();
  },
});

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
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);

    const existing = await ctx.db
      .query("courses")
      .withIndex("by_majorId_slug", (q) =>
        q.eq("majorId", args.majorId).eq("slug", args.slug)
      )
      .unique();

    if (existing) {
      throw new ConvexError({ code: "COURSE_SLUG_EXISTS" });
    }

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
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditCourse(ctx, user._id, args.courseId);

    const current = await ctx.db.get("courses", args.courseId);
    if (!current) {
      throw new ConvexError({ code: "COURSE_NOT_FOUND" });
    }

    if (args.slug) {
      const conflicting = await ctx.db
        .query("courses")
        .withIndex("by_majorId_slug", (q) =>
          q.eq("majorId", current.majorId).eq("slug", args.slug)
        )
        .unique();
      if (conflicting && conflicting._id !== args.courseId) {
        throw new ConvexError({ code: "COURSE_SLUG_EXISTS" });
      }
    }

    const { courseId, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch("courses", courseId, filtered);
    }

    return null;
  },
});
