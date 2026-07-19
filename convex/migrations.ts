import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  buildUniversitySearchToken,
  buildMajorSearchToken,
  buildCourseSearchToken,
} from "./searchUtils";
import { isNotDeleted } from "./helpers";
import {
  formatCourseSemesterLabel,
  normalizeCourseSemesterInput,
} from "../lib/course-semester";

/**
 * M1-T7: Migration/backfill script.
 * Backfills alias, searchToken, and null soft-delete defaults for all entities.
 *
 * Run order:
 * 1. Deploy schema first (so new fields are accepted)
 * 2. Run backfillUniversities
 * 3. Run backfillMajors
 * 4. Run backfillCourses
 * 5. Run backfillCourseCredits
 * 6. Run backfillCourseSemesterStrings
 * 7. Run backfillResources
 * 8. Run backfillUsers
 * 9. Run backfillPermissions
 * 10. Run migrateCourseSemesters after deploying the semesters table
 */

const numericSemesterPattern = /^\d+$/;

function normalizeLegacyCourseSemester(value: unknown) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return normalizeCourseSemesterInput(value);
  }

  return undefined;
}

function migrationSemesterOrder(value: string, fallbackOrder: number) {
  if (!numericSemesterPattern.test(value)) {
    return fallbackOrder;
  }

  return Number.parseInt(value, 10);
}

function migrationSemesterKey(majorId: Id<"majors">, name: string) {
  return `${majorId}:${name}`;
}

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

export const backfillCourseCredits = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    let count = 0;

    for (const course of courses) {
      if ((course as { credits?: unknown }).credits !== undefined) {
        continue;
      }

      await ctx.db.patch("courses", course._id, { credits: 3 });
      count += 1;
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

export const migrateCourseSemesters = internalMutation({
  args: {},
  returns: v.object({
    createdSemesters: v.number(),
    updatedCourses: v.number(),
    clearedLegacySemesters: v.number(),
    skippedCourses: v.number(),
  }),
  handler: async (ctx) => {
    const [courses, semesters] = await Promise.all([
      ctx.db.query("courses").collect(),
      ctx.db.query("semesters").collect(),
    ]);
    const semesterIdsByKey = new Map<string, Id<"semesters">>();
    for (const semester of semesters) {
      if (!isNotDeleted(semester)) {
        continue;
      }
      semesterIdsByKey.set(
        migrationSemesterKey(semester.majorId, semester.name),
        semester._id,
      );
    }

    const semesterSpecsByKey = new Map<
      string,
      {
        majorId: Id<"majors">;
        legacyValue: string;
        name: string;
        order: number;
        firstCreatedAt: number;
      }
    >();

    for (const course of courses) {
      const legacyValue = normalizeLegacyCourseSemester(
        (course as { semester?: unknown }).semester,
      );
      if (!legacyValue) {
        continue;
      }

      const name = formatCourseSemesterLabel(legacyValue) ?? legacyValue;
      const key = migrationSemesterKey(course.majorId, name);
      const order = migrationSemesterOrder(legacyValue, course.order);
      const existing = semesterSpecsByKey.get(key);
      if (!existing) {
        semesterSpecsByKey.set(key, {
          majorId: course.majorId,
          legacyValue,
          name,
          order,
          firstCreatedAt: course._creationTime,
        });
        continue;
      }

      existing.order = Math.min(existing.order, order);
      existing.firstCreatedAt = Math.min(existing.firstCreatedAt, course._creationTime);
    }

    let createdSemesters = 0;
    const semesterSpecs = Array.from(semesterSpecsByKey.entries()).toSorted(
      ([, left], [, right]) => {
        if (left.majorId !== right.majorId) {
          return String(left.majorId).localeCompare(String(right.majorId));
        }
        if (left.order !== right.order) {
          return left.order - right.order;
        }
        if (left.firstCreatedAt !== right.firstCreatedAt) {
          return left.firstCreatedAt - right.firstCreatedAt;
        }
        return left.name.localeCompare(right.name, "ar");
      },
    );

    for (const [key, spec] of semesterSpecs) {
      if (semesterIdsByKey.has(key)) {
        continue;
      }

      const semesterId = await ctx.db.insert("semesters", {
        majorId: spec.majorId,
        name: spec.name,
        order: spec.order,
      });
      semesterIdsByKey.set(key, semesterId);
      createdSemesters += 1;
    }

    let updatedCourses = 0;
    let clearedLegacySemesters = 0;
    let skippedCourses = 0;

    for (const course of courses) {
      const rawLegacySemester = (course as { semester?: unknown }).semester;
      const legacyValue = normalizeLegacyCourseSemester(rawLegacySemester);
      const currentSemesterId = (course as { semesterId?: Id<"semesters"> })
        .semesterId;
      const updates: {
        semesterId?: Id<"semesters"> | undefined;
        semester?: undefined;
      } = {};

      if (legacyValue) {
        const name = formatCourseSemesterLabel(legacyValue) ?? legacyValue;
        const semesterId = semesterIdsByKey.get(
          migrationSemesterKey(course.majorId, name),
        );
        if (!semesterId) {
          skippedCourses += 1;
          continue;
        }
        if (currentSemesterId !== semesterId) {
          updates.semesterId = semesterId;
        }
      }

      if (rawLegacySemester !== undefined) {
        updates.semester = undefined;
        clearedLegacySemesters += 1;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch("courses", course._id, updates);
        updatedCourses += 1;
      }
    }

    return {
      createdSemesters,
      updatedCourses,
      clearedLegacySemesters,
      skippedCourses,
    };
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
