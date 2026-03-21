import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  buildUniversitySearchToken,
  buildMajorSearchToken,
  buildCourseSearchToken,
} from "./searchUtils";

/**
 * M1-T7: Migration/backfill script.
 * Backfills alias, searchToken, and null soft-delete defaults for all entities.
 *
 * Run order:
 * 1. Deploy schema first (so new fields are accepted)
 * 2. Run backfillUniversities
 * 3. Run backfillMajors
 * 4. Run backfillCourses
 * 5. Run backfillCourseSemesterStrings
 * 6. Run backfillResources
 * 7. Run backfillUsers
 * 8. Run backfillPermissions
 */

export const backfillUniversities = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const universities = await ctx.db.query("universities").collect();
    let count = 0;
    for (const uni of universities) {
      const updates: Record<string, unknown> = {};
      if (uni.alias === undefined) updates.alias = "";
      if (uni.searchToken === undefined) {
        updates.searchToken = buildUniversitySearchToken({
          name: uni.name,
          slug: uni.slug,
          alias: (uni.alias as string) ?? "",
        });
      }
      if (uni.deletedAt === undefined) updates.deletedAt = undefined;
      if (uni.deletedBy === undefined) updates.deletedBy = undefined;

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch("universities", uni._id, updates);
        count++;
      }
    }
    return count;
  },
});

export const backfillMajors = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const majors = await ctx.db.query("majors").collect();
    let count = 0;
    for (const major of majors) {
      const updates: Record<string, unknown> = {};
      if (major.alias === undefined) updates.alias = "";
      if (major.searchToken === undefined) {
        updates.searchToken = buildMajorSearchToken({
          name: major.name,
          slug: major.slug,
          alias: (major.alias as string) ?? "",
        });
      }
      if (major.deletedAt === undefined) updates.deletedAt = undefined;
      if (major.deletedBy === undefined) updates.deletedBy = undefined;

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch("majors", major._id, updates);
        count++;
      }
    }
    return count;
  },
});

export const backfillCourses = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    let count = 0;
    for (const course of courses) {
      const updates: Record<string, unknown> = {};
      if (course.alias === undefined) updates.alias = "";
      if (course.searchToken === undefined) {
        updates.searchToken = buildCourseSearchToken({
          name: course.name,
          slug: course.slug,
          alias: (course.alias as string) ?? "",
          courseCode: course.courseCode,
        });
      }
      if (course.deletedAt === undefined) updates.deletedAt = undefined;
      if (course.deletedBy === undefined) updates.deletedBy = undefined;

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch("courses", course._id, updates);
        count++;
      }
    }
    return count;
  },
});

export const backfillCourseSemesterStrings = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    let count = 0;

    for (const course of courses) {
      const rawSemester = (course as { semester?: unknown }).semester;

      if (typeof rawSemester === "number") {
        await ctx.db.patch("courses", course._id, {
          semester: String(rawSemester),
        });
        count += 1;
        continue;
      }

      if (typeof rawSemester !== "string") {
        continue;
      }

      const normalized = rawSemester.trim();
      if (normalized === rawSemester) {
        continue;
      }

      await ctx.db.patch("courses", course._id, {
        semester: normalized || undefined,
      });
      count += 1;
    }

    return count;
  },
});

export const backfillResources = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const resources = await ctx.db.query("resources").collect();
    let count = 0;
    for (const resource of resources) {
      if (resource.deletedAt === undefined || resource.deletedBy === undefined) {
        await ctx.db.patch("resources", resource._id, {});
        count++;
      }
    }
    return count;
  },
});

export const backfillUsers = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let count = 0;
    for (const user of users) {
      if (user.deletedAt === undefined || user.deletedBy === undefined) {
        await ctx.db.patch("users", user._id, {});
        count++;
      }
    }
    return count;
  },
});

export const backfillPermissions = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const permissions = await ctx.db.query("permissions").collect();
    let count = 0;
    for (const perm of permissions) {
      if (perm.deletedAt === undefined || perm.deletedBy === undefined) {
        await ctx.db.patch("permissions", perm._id, {});
        count++;
      }
    }
    return count;
  },
});
