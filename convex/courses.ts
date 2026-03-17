import { ConvexError, v } from "convex/values";
import { isSameSlug, normalizeSlugLookup } from "../lib/slug";
import { mutation, query } from "./_generated/server";
import { assertCanEditCourse, assertCanEditMajor, authenticateUser, isNotDeleted, softDeleteFields } from "./helpers";
import { buildCourseSearchToken, normalize } from "./searchUtils";

const courseDoc = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  majorId: v.id("majors"),
  name: v.string(),
  slug: v.string(),
  courseCode: v.optional(v.string()),
  semester: v.optional(v.number()),
  order: v.number(),
  alias: v.optional(v.string()),
  searchToken: v.optional(v.string()),
});

export const listByMajor = query({
  args: { majorId: v.id("majors") },
  returns: v.array(courseDoc),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("courses")
      .withIndex("by_majorId_order", (q) => q.eq("majorId", args.majorId))
      .collect();
    return all.filter(isNotDeleted);
  },
});

export const searchByMajor = query({
  args: {
    majorId: v.id("majors"),
    query: v.string(),
  },
  returns: v.array(courseDoc),
  handler: async (ctx, args) => {
    const queryText = normalize(args.query);
    if (!queryText) {
      return [];
    }

    const matches = await ctx.db
      .query("courses")
      .withSearchIndex("search_token", (q) =>
        q
          .search("searchToken", queryText)
          .eq("majorId", args.majorId)
      )
      .collect();

    return matches.filter(isNotDeleted);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), courseDoc),
  handler: async (ctx, args) => {
    const slug = normalizeSlugLookup(args.slug);
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (course && course.deletedAt === undefined) {
      return course;
    }

    const courses = await ctx.db.query("courses").collect();
    const normalizedMatch = courses.find(
      (entry) => isNotDeleted(entry) && isSameSlug(entry.slug, slug),
    );
    return normalizedMatch ?? null;
  },
});

export const getByMajorAndSlug = query({
  args: {
    majorId: v.id("majors"),
    slug: v.string(),
  },
  returns: v.union(v.null(), courseDoc),
  handler: async (ctx, args) => {
    const slug = normalizeSlugLookup(args.slug);
    const results = await ctx.db
      .query("courses")
      .withIndex("by_majorId_slug", (q) =>
        q.eq("majorId", args.majorId).eq("slug", slug)
      )
      .collect();
    const course = results.find(isNotDeleted);
    if (course) {
      return course;
    }

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_majorId", (q) => q.eq("majorId", args.majorId))
      .collect();
    const normalizedMatch = courses.find(
      (entry) => isNotDeleted(entry) && isSameSlug(entry.slug, slug),
    );
    return normalizedMatch ?? null;
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
    alias: v.optional(v.string()),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);

    // Uniqueness check ignoring soft-deleted rows
    const existing = await ctx.db
      .query("courses")
      .withIndex("by_majorId_slug", (q) =>
        q.eq("majorId", args.majorId).eq("slug", args.slug)
      )
      .collect();
    if (existing.some(isNotDeleted)) {
      throw new ConvexError({ code: "COURSE_SLUG_EXISTS" });
    }

    const searchToken = buildCourseSearchToken({
      name: args.name,
      slug: args.slug,
      alias: args.alias,
      courseCode: args.courseCode,
    });

    return await ctx.db.insert("courses", {
      majorId: args.majorId,
      name: args.name,
      slug: args.slug,
      courseCode: args.courseCode,
      semester: args.semester,
      order: args.order,
      alias: args.alias,
      searchToken,
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
    alias: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditCourse(ctx, user._id, args.courseId);

    const current = await ctx.db.get("courses", args.courseId);
    if (!current || current.deletedAt !== undefined) {
      throw new ConvexError({ code: "COURSE_NOT_FOUND" });
    }

    if (args.slug) {
      const slug = args.slug;
      const conflicting = await ctx.db
        .query("courses")
        .withIndex("by_majorId_slug", (q) =>
          q.eq("majorId", current.majorId).eq("slug", slug)
        )
        .collect();
      const conflict = conflicting.find(
        (c) => isNotDeleted(c) && c._id !== args.courseId
      );
      if (conflict) {
        throw new ConvexError({ code: "COURSE_SLUG_EXISTS" });
      }
    }

    // Recompute searchToken
    const newName = args.name ?? current.name;
    const newSlug = args.slug ?? current.slug;
    const newAlias = args.alias !== undefined ? args.alias : current.alias;
    const newCourseCode = args.courseCode !== undefined ? args.courseCode : current.courseCode;
    const searchToken = buildCourseSearchToken({
      name: newName,
      slug: newSlug,
      alias: newAlias,
      courseCode: newCourseCode,
    });

    const { courseId, token: _token, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch("courses", courseId, {
      ...filtered,
      searchToken,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditCourse(ctx, user._id, args.courseId);

    const course = await ctx.db.get("courses", args.courseId);
    if (!course || course.deletedAt !== undefined) {
      return null;
    }

    await ctx.db.patch("courses", args.courseId, softDeleteFields(user._id));
    return null;
  },
});
