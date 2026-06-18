import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isSameSlug, normalizeSlugLookup } from "../lib/slug";
import { normalizeAlias } from "../lib/alias";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertCanEditCourse, assertCanEditMajor, authenticateUser, isNotDeleted, softDeleteFields } from "./helpers";
import { buildCourseSearchToken, normalize } from "./searchUtils";
import { normalizeCourseSemesterInput } from "../lib/course-semester";

const semesterIdInput = v.optional(v.union(v.id("semesters"), v.null()));

const courseDoc = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  majorId: v.id("majors"),
  name: v.string(),
  slug: v.string(),
  credits: v.number(),
  courseCode: v.optional(v.string()),
  semesterId: v.optional(v.id("semesters")),
  semester: v.optional(v.string()),
  semesterName: v.optional(v.string()),
  semesterOrder: v.optional(v.number()),
  order: v.number(),
  alias: v.optional(v.string()),
  searchToken: v.optional(v.string()),
});

const globalCourseSearchResultDoc = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  slug: v.string(),
  name: v.string(),
  credits: v.number(),
  courseCode: v.optional(v.string()),
  semesterId: v.optional(v.id("semesters")),
  semester: v.optional(v.string()),
  semesterName: v.optional(v.string()),
  semesterOrder: v.optional(v.number()),
  order: v.number(),
  majorName: v.string(),
  majorSlug: v.string(),
  universityName: v.string(),
  universitySlug: v.string(),
  href: v.string(),
});

const courseInput = v.object({
  name: v.string(),
  slug: v.string(),
  credits: v.number(),
  courseCode: v.optional(v.string()),
  semesterId: semesterIdInput,
  order: v.number(),
  alias: v.optional(v.string()),
});

async function assertSemesterBelongsToMajor(
  ctx: QueryCtx | MutationCtx,
  majorId: Id<"majors">,
  semesterId: Id<"semesters"> | null | undefined,
) {
  if (!semesterId) {
    return;
  }

  const semester = await ctx.db.get(semesterId);
  if (
    !semester ||
    semester.deletedAt !== undefined ||
    semester.majorId !== majorId
  ) {
    throw new ConvexError({ code: "SEMESTER_NOT_FOUND" });
  }
}

async function getSemesterDetails(
  ctx: QueryCtx,
  semesterId: Id<"semesters"> | undefined,
) {
  if (!semesterId) {
    return {};
  }

  const semester = await ctx.db.get(semesterId);
  if (!semester || semester.deletedAt !== undefined) {
    return {};
  }

  return {
    semesterId: semester._id,
    semesterName: semester.name,
    semesterOrder: semester.order,
  };
}

async function enrichCourse(ctx: QueryCtx, course: Doc<"courses">) {
  const semesterDetails = await getSemesterDetails(ctx, course.semesterId);

  return {
    _id: course._id,
    _creationTime: course._creationTime,
    majorId: course.majorId,
    name: course.name,
    slug: course.slug,
    credits: course.credits,
    courseCode: course.courseCode,
    semester: normalizeCourseSemesterInput(
      (course as { semester?: string }).semester,
    ),
    ...semesterDetails,
    order: course.order,
    alias: course.alias,
    searchToken: course.searchToken,
  };
}

function makeCourseInsert(args: {
  majorId: Id<"majors">;
  name: string;
  slug: string;
  credits: number;
  courseCode?: string;
  semesterId?: Id<"semesters"> | null;
  order: number;
  alias?: string;
}) {
  const alias = args.alias ? normalizeAlias(args.alias) : args.alias;
  const searchToken = buildCourseSearchToken({
    name: args.name,
    slug: args.slug,
    alias,
    courseCode: args.courseCode,
  });

  return {
    majorId: args.majorId,
    name: args.name,
    slug: args.slug,
    credits: args.credits,
    courseCode: args.courseCode,
    semesterId: args.semesterId ?? undefined,
    order: args.order,
    alias,
    searchToken,
  };
}

export const listByMajor = query({
  args: { majorId: v.id("majors") },
  returns: v.array(courseDoc),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("courses")
      .withIndex("by_majorId_order", (q) => q.eq("majorId", args.majorId))
      .collect();
    return await Promise.all(all.filter(isNotDeleted).map((course) => enrichCourse(ctx, course)));
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

    return await Promise.all(
      matches.filter(isNotDeleted).map((course) => enrichCourse(ctx, course)),
    );
  },
});

const GLOBAL_PUBLIC_COURSE_SEARCH_LIMIT = 30;

export const searchGlobalPublic = query({
  args: {
    query: v.string(),
    universitySlug: v.optional(v.string()),
    majorSlug: v.optional(v.string()),
  },
  returns: v.array(globalCourseSearchResultDoc),
  handler: async (ctx, args) => {
    const queryText = normalize(args.query);
    if (!queryText) {
      return [];
    }

    const normalizedUniversitySlug = args.universitySlug
      ? normalizeSlugLookup(args.universitySlug)
      : null;
    const normalizedMajorSlug = args.majorSlug
      ? normalizeSlugLookup(args.majorSlug)
      : null;

    const matches = (await ctx.db
      .query("courses")
      .withSearchIndex("search_token", (q) => q.search("searchToken", queryText))
      .collect()).filter(isNotDeleted);

    if (matches.length === 0) {
      return [];
    }

    const majorIds = [...new Set(matches.map((course) => course.majorId))];
    const majorEntries = await Promise.all(
      majorIds.map(async (majorId) => [majorId, await ctx.db.get(majorId)] as const),
    );
    const majorMap = new Map(
      majorEntries.flatMap(([majorId, major]) =>
        major && isNotDeleted(major) ? [[majorId, major] as const] : [],
      ),
    );

    const universityIds = [
      ...new Set(Array.from(majorMap.values()).map((major) => major.universityId)),
    ];
    const universityEntries = await Promise.all(
      universityIds.map(async (universityId) => [
        universityId,
        await ctx.db.get(universityId),
      ] as const),
    );
    const universityMap = new Map(
      universityEntries.flatMap(([universityId, university]) =>
        university && isNotDeleted(university)
          ? [[universityId, university] as const]
          : [],
      ),
    );
    const semesterIds = [
      ...new Set(matches.flatMap((course) => (course.semesterId ? [course.semesterId] : []))),
    ];
    const semesterEntries = await Promise.all(
      semesterIds.map(async (semesterId) => [semesterId, await ctx.db.get(semesterId)] as const),
    );
    const semesterMap = new Map(
      semesterEntries.flatMap(([semesterId, semester]) =>
        semester && isNotDeleted(semester)
          ? [[semesterId, semester] as const]
          : [],
      ),
    );

    return matches.flatMap((course) => {
      const major = majorMap.get(course.majorId);
      if (!major) {
        return [];
      }

      const university = universityMap.get(major.universityId);
      if (!university) {
        return [];
      }

      if (
        normalizedUniversitySlug &&
        normalizeSlugLookup(university.slug) !== normalizedUniversitySlug
      ) {
        return [];
      }

      if (normalizedMajorSlug && normalizeSlugLookup(major.slug) !== normalizedMajorSlug) {
        return [];
      }

      const semester = course.semesterId
        ? semesterMap.get(course.semesterId)
        : undefined;

      return [
        {
          _id: course._id,
          _creationTime: course._creationTime,
          slug: course.slug,
          name: course.name,
          credits: course.credits,
          courseCode: course.courseCode,
          semesterId: semester?._id,
          semester: course.semester,
          semesterName: semester?.name,
          semesterOrder: semester?.order,
          order: course.order,
          majorName: major.name,
          majorSlug: major.slug,
          universityName: university.name,
          universitySlug: university.slug,
          href: `/${university.slug}/${major.slug}/${course.slug}`,
        },
      ];
    }).slice(0, GLOBAL_PUBLIC_COURSE_SEARCH_LIMIT);
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
      return await enrichCourse(ctx, course);
    }

    const courses = await ctx.db.query("courses").collect();
    const normalizedMatch = courses.find(
      (entry) => isNotDeleted(entry) && isSameSlug(entry.slug, slug),
    );
    return normalizedMatch ? await enrichCourse(ctx, normalizedMatch) : null;
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
      return await enrichCourse(ctx, course);
    }

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_majorId", (q) => q.eq("majorId", args.majorId))
      .collect();
    const normalizedMatch = courses.find(
      (entry) => isNotDeleted(entry) && isSameSlug(entry.slug, slug),
    );
    return normalizedMatch ? await enrichCourse(ctx, normalizedMatch) : null;
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    name: v.string(),
    slug: v.string(),
    credits: v.number(),
    courseCode: v.optional(v.string()),
    semesterId: semesterIdInput,
    order: v.number(),
    alias: v.optional(v.string()),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);
    await assertSemesterBelongsToMajor(ctx, args.majorId, args.semesterId);

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

    return await ctx.db.insert(
      "courses",
      makeCourseInsert({
        majorId: args.majorId,
        name: args.name,
        slug: args.slug,
        credits: args.credits,
        courseCode: args.courseCode,
        semesterId: args.semesterId,
        order: args.order,
        alias: args.alias,
      }),
    );
  },
});

export const bulkAddForMajor = internalMutation({
  args: {
    majorId: v.id("majors"),
    courses: v.array(courseInput),
  },
  returns: v.array(v.id("courses")),
  handler: async (ctx, args) => {
    const seen = new Set<string>();
    for (const course of args.courses) {
      if (seen.has(course.slug)) {
        throw new ConvexError({
          code: "COURSE_SLUG_DUPLICATE_IN_PAYLOAD",
          slug: course.slug,
        });
      }
      seen.add(course.slug);
    }

    for (const course of args.courses) {
      const existing = await ctx.db
        .query("courses")
        .withIndex("by_majorId_slug", (q) =>
          q.eq("majorId", args.majorId).eq("slug", course.slug)
        )
        .collect();
      if (existing.some(isNotDeleted)) {
        throw new ConvexError({
          code: "COURSE_SLUG_EXISTS",
          slug: course.slug,
        });
      }
    }

    const ids: Id<"courses">[] = [];
    for (const course of args.courses) {
      await assertSemesterBelongsToMajor(ctx, args.majorId, course.semesterId);
      ids.push(
        await ctx.db.insert(
          "courses",
          makeCourseInsert({
            majorId: args.majorId,
            name: course.name,
            slug: course.slug,
            credits: course.credits,
            courseCode: course.courseCode,
            semesterId: course.semesterId,
            order: course.order,
            alias: course.alias,
          }),
        ),
      );
    }

    return ids;
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    courseId: v.id("courses"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    credits: v.optional(v.number()),
    courseCode: v.optional(v.string()),
    semesterId: semesterIdInput,
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
    const newAlias =
      args.alias !== undefined
        ? normalizeAlias(args.alias)
        : current.alias
          ? normalizeAlias(current.alias)
          : current.alias;
    const newCourseCode = args.courseCode !== undefined ? args.courseCode : current.courseCode;
    const searchToken = buildCourseSearchToken({
      name: newName,
      slug: newSlug,
      alias: newAlias,
      courseCode: newCourseCode,
    });

    if (args.semesterId !== undefined) {
      await assertSemesterBelongsToMajor(ctx, current.majorId, args.semesterId);
    }

    const courseId = args.courseId;
    const rawUpdates = {
      name: args.name,
      slug: args.slug,
      credits: args.credits,
      courseCode: args.courseCode,
      order: args.order,
      alias: args.alias,
    };
    const filtered: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );
    if (args.semesterId !== undefined) {
      filtered.semesterId = args.semesterId ?? undefined;
    }
    if (typeof filtered.alias === "string") {
      filtered.alias = normalizeAlias(filtered.alias) || undefined;
    }

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
