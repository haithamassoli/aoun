import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  assertCanEditCourse,
  assertCanEditMajor,
  authenticateUser,
  getPermissions,
  isNotDeleted,
} from "./helpers";

const majorWithUniversity = v.object({
  _id: v.id("majors"),
  _creationTime: v.number(),
  universityId: v.id("universities"),
  name: v.string(),
  slug: v.string(),
  order: v.number(),
  universityName: v.string(),
});

const courseWithResourceCount = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  majorId: v.id("majors"),
  name: v.string(),
  slug: v.string(),
  courseCode: v.optional(v.string()),
  semester: v.optional(v.number()),
  order: v.number(),
  resourceCount: v.number(),
});

const resourceDoc = v.object({
  _id: v.id("resources"),
  _creationTime: v.number(),
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
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getMyMajors = query({
  args: { token: v.string() },
  returns: v.array(majorWithUniversity),
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    const perms = await getPermissions(ctx, user._id);

    const majors = perms.fullAccess
      ? (await ctx.db.query("majors").collect()).filter(isNotDeleted)
      : (
          await Promise.all(
            perms.majorIds.map((majorId) => ctx.db.get("majors", majorId))
          )
        ).filter((major): major is NonNullable<typeof major> =>
          major !== null && isNotDeleted(major)
        );

    const enriched = await Promise.all(
      majors.map(async (major) => {
        const university = await ctx.db.get("universities", major.universityId);
        return {
          ...major,
          universityName: university?.name ?? "",
        };
      })
    );

    return enriched.toSorted((a, b) => a.order - b.order);
  },
});

export const getCoursesForMajor = query({
  args: { token: v.string(), majorId: v.id("majors") },
  returns: v.array(courseWithResourceCount),
  handler: async (ctx, { token, majorId }) => {
    const user = await authenticateUser(ctx, token);
    await assertCanEditMajor(ctx, user._id, majorId);

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_majorId_order", (q) => q.eq("majorId", majorId))
      .collect();

    return await Promise.all(
      courses.filter(isNotDeleted).map(async (course) => {
        const resources = await ctx.db
          .query("resources")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();
        return {
          ...course,
          resourceCount: resources.filter(isNotDeleted).length,
        };
      })
    );
  },
});

export const getResourcesForCourse = query({
  args: { token: v.string(), courseId: v.id("courses") },
  returns: v.array(resourceDoc),
  handler: async (ctx, { token, courseId }) => {
    const user = await authenticateUser(ctx, token);
    await assertCanEditCourse(ctx, user._id, courseId);

    const resources = await ctx.db
      .query("resources")
      .withIndex("by_courseId_order", (q) => q.eq("courseId", courseId))
      .collect();
    return resources.filter(isNotDeleted);
  },
});

export const getMajorWithUniversity = query({
  args: { token: v.string(), majorId: v.id("majors") },
  returns: v.union(v.null(), majorWithUniversity),
  handler: async (ctx, { token, majorId }) => {
    const user = await authenticateUser(ctx, token);
    await assertCanEditMajor(ctx, user._id, majorId);

    const major = await ctx.db.get("majors", majorId);
    if (!major || major.deletedAt !== undefined) return null;

    const university = await ctx.db.get("universities", major.universityId);
    return {
      ...major,
      universityName: university?.name ?? "",
    };
  },
});

export const getCourseWithMajor = query({
  args: { token: v.string(), courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      majorId: v.id("majors"),
      name: v.string(),
      slug: v.string(),
      courseCode: v.optional(v.string()),
      semester: v.optional(v.number()),
      order: v.number(),
      majorName: v.string(),
    })
  ),
  handler: async (ctx, { token, courseId }) => {
    const user = await authenticateUser(ctx, token);
    await assertCanEditCourse(ctx, user._id, courseId);

    const course = await ctx.db.get("courses", courseId);
    if (!course || course.deletedAt !== undefined) return null;

    const major = await ctx.db.get("majors", course.majorId);
    return {
      ...course,
      majorName: major?.name ?? "",
    };
  },
});
