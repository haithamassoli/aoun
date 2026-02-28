import { query } from "./_generated/server";
import { v } from "convex/values";
import { authenticateUser, getPermissions } from "./helpers";

// Get majors accessible to the current user, enriched with university name
export const getMyMajors = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    const perms = await getPermissions(ctx, user._id);

    let majors;
    if (perms.fullAccess) {
      majors = await ctx.db.query("majors").collect();
    } else {
      majors = [];
      for (const majorId of perms.majorIds) {
        const major = await ctx.db.get(majorId);
        if (major) majors.push(major);
      }
    }

    // Enrich with university names
    const result = [];
    for (const major of majors) {
      const university = await ctx.db.get(major.universityId);
      result.push({
        ...major,
        universityName: university?.name ?? "",
      });
    }

    return result.sort((a, b) => a.order - b.order);
  },
});

// Get courses for a major (dashboard view with resource count)
export const getCoursesForMajor = query({
  args: { token: v.string(), majorId: v.id("majors") },
  handler: async (ctx, { token, majorId }) => {
    await authenticateUser(ctx, token);

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_majorId", (q) => q.eq("majorId", majorId))
      .collect();

    const result = [];
    for (const course of courses) {
      const resources = await ctx.db
        .query("resources")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .collect();
      result.push({
        ...course,
        resourceCount: resources.length,
      });
    }

    return result.sort((a, b) => a.order - b.order);
  },
});

// Get resources for a course (dashboard view)
export const getResourcesForCourse = query({
  args: { token: v.string(), courseId: v.id("courses") },
  handler: async (ctx, { token, courseId }) => {
    await authenticateUser(ctx, token);

    const resources = await ctx.db
      .query("resources")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();

    return resources.sort((a, b) => a.order - b.order);
  },
});

// Get a single major with university info
export const getMajorWithUniversity = query({
  args: { token: v.string(), majorId: v.id("majors") },
  handler: async (ctx, { token, majorId }) => {
    await authenticateUser(ctx, token);

    const major = await ctx.db.get(majorId);
    if (!major) return null;

    const university = await ctx.db.get(major.universityId);
    return {
      ...major,
      universityName: university?.name ?? "",
    };
  },
});

// Get a single course with major info
export const getCourseWithMajor = query({
  args: { token: v.string(), courseId: v.id("courses") },
  handler: async (ctx, { token, courseId }) => {
    await authenticateUser(ctx, token);

    const course = await ctx.db.get(courseId);
    if (!course) return null;

    const major = await ctx.db.get(course.majorId);
    return {
      ...course,
      majorName: major?.name ?? "",
      majorId: course.majorId,
    };
  },
});
