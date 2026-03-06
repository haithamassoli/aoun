import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  assertAdmin,
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
  alias: v.optional(v.string()),
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
  alias: v.optional(v.string()),
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

const analyticsTotals = v.object({
  universitiesTotal: v.number(),
  majorsTotal: v.number(),
  coursesTotal: v.number(),
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
          _id: major._id,
          _creationTime: major._creationTime,
          universityId: major.universityId,
          name: major.name,
          slug: major.slug,
          order: major.order,
          alias: major.alias,
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
          _id: course._id,
          _creationTime: course._creationTime,
          majorId: course.majorId,
          name: course.name,
          slug: course.slug,
          courseCode: course.courseCode,
          semester: course.semester,
          order: course.order,
          alias: course.alias,
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
      _id: major._id,
      _creationTime: major._creationTime,
      universityId: major.universityId,
      name: major.name,
      slug: major.slug,
      order: major.order,
      alias: major.alias,
      universityName: university?.name ?? "",
    };
  },
});

// ── Admin-only list queries ─────────────────────────────────────────

export const getAdminAnalyticsTotals = query({
  args: { token: v.string() },
  returns: analyticsTotals,
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const [universities, majors, courses] = await Promise.all([
      ctx.db.query("universities").collect(),
      ctx.db.query("majors").collect(),
      ctx.db.query("courses").collect(),
    ]);

    return {
      universitiesTotal: universities.filter(isNotDeleted).length,
      majorsTotal: majors.filter(isNotDeleted).length,
      coursesTotal: courses.filter(isNotDeleted).length,
    };
  },
});

export const adminListMajors = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("majors"),
      _creationTime: v.number(),
      universityId: v.id("universities"),
      name: v.string(),
      slug: v.string(),
      order: v.number(),
      alias: v.optional(v.string()),
      universityName: v.string(),
    })
  ),
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const majors = (await ctx.db.query("majors").collect()).filter(isNotDeleted);
    const enriched = await Promise.all(
      majors.map(async (major) => {
        const university = await ctx.db.get("universities", major.universityId);
        return {
          _id: major._id,
          _creationTime: major._creationTime,
          universityId: major.universityId,
          name: major.name,
          slug: major.slug,
          order: major.order,
          alias: major.alias,
          universityName: university?.name ?? "",
        };
      })
    );
    return enriched.toSorted((a, b) => a.order - b.order);
  },
});

export const adminListCourses = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      majorId: v.id("majors"),
      name: v.string(),
      slug: v.string(),
      courseCode: v.optional(v.string()),
      semester: v.optional(v.number()),
      order: v.number(),
      alias: v.optional(v.string()),
      majorName: v.string(),
      universityName: v.string(),
    })
  ),
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const courses = (await ctx.db.query("courses").collect()).filter(isNotDeleted);
    const enriched = await Promise.all(
      courses.map(async (course) => {
        const major = await ctx.db.get("majors", course.majorId);
        const university = major
          ? await ctx.db.get("universities", major.universityId)
          : null;
        return {
          _id: course._id,
          _creationTime: course._creationTime,
          majorId: course.majorId,
          name: course.name,
          slug: course.slug,
          courseCode: course.courseCode,
          semester: course.semester,
          order: course.order,
          alias: course.alias,
          majorName: major?.name ?? "",
          universityName: university?.name ?? "",
        };
      })
    );
    return enriched.toSorted((a, b) => a.order - b.order);
  },
});

export const adminListResources = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
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
      courseName: v.string(),
      majorName: v.string(),
    })
  ),
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const resources = (await ctx.db.query("resources").collect()).filter(isNotDeleted);
    const enriched = await Promise.all(
      resources.map(async (resource) => {
        const course = await ctx.db.get("courses", resource.courseId);
        const major = course ? await ctx.db.get("majors", course.majorId) : null;
        return {
          _id: resource._id,
          _creationTime: resource._creationTime,
          courseId: resource.courseId,
          type: resource.type,
          category: resource.category,
          title: resource.title,
          url: resource.url,
          content: resource.content,
          order: resource.order,
          createdBy: resource.createdBy,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt,
          courseName: course?.name ?? "",
          majorName: major?.name ?? "",
        };
      })
    );
    return enriched.toSorted((a, b) => a.order - b.order);
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
      alias: v.optional(v.string()),
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
      _id: course._id,
      _creationTime: course._creationTime,
      majorId: course.majorId,
      name: course.name,
      slug: course.slug,
      courseCode: course.courseCode,
      semester: course.semester,
      order: course.order,
      alias: course.alias,
      majorName: major?.name ?? "",
    };
  },
});
