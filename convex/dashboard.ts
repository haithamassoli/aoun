import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    v.literal("course_intro"),
    v.literal("comprehensive_post"),
    v.literal("textbook"),
    v.literal("previous_years"),
    v.literal("explanations_notebooks"),
    v.literal("course_drive"),
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

const visitorSeriesEntry = v.object({
  dateKey: v.string(),
  label: v.string(),
  uniqueVisitors: v.number(),
});

const entitySeriesEntry = v.object({
  dateKey: v.string(),
  label: v.string(),
  universitiesTotal: v.number(),
  majorsTotal: v.number(),
  coursesTotal: v.number(),
});

const adminDashboardAnalytics = v.object({
  universitiesTotal: v.number(),
  majorsTotal: v.number(),
  coursesTotal: v.number(),
  visitorsTotal: v.number(),
  entitySeries: v.array(entitySeriesEntry),
  visitorSeries: v.array(visitorSeriesEntry),
});

const AMMAN_TIME_ZONE = "Asia/Amman";
const PUBLIC_VISITOR_STATIC_PATHS = new Set(["/", "/gpa-calculator"]);
const ammanDateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: AMMAN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const ammanLabelFormatter = new Intl.DateTimeFormat("ar-JO", {
  timeZone: AMMAN_TIME_ZONE,
  month: "short",
  day: "numeric",
});

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day"
) {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) {
    throw new Error(`Missing ${type} in dashboard analytics date formatter`);
  }
  return value;
}

function formatDateKey(timestamp: number) {
  const parts = ammanDateKeyFormatter.formatToParts(new Date(timestamp));
  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  return `${year}-${month}-${day}`;
}

function formatSeriesLabel(dateKey: string) {
  return ammanLabelFormatter.format(new Date(`${dateKey}T12:00:00.000Z`));
}

function buildRecentDateKeys(days: number) {
  const anchor = new Date();
  anchor.setUTCHours(12, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(anchor);
    current.setUTCDate(anchor.getUTCDate() - (days - index - 1));
    return formatDateKey(current.getTime());
  });
}

function buildCumulativeTotals(
  docs: Array<{ _creationTime: number }>,
  dateKeys: string[]
) {
  const firstDateKey = dateKeys[0];
  const countsByDate = new Map<string, number>();
  let runningTotalBeforeRange = 0;

  for (const doc of docs) {
    const dateKey = formatDateKey(doc._creationTime);

    if (firstDateKey && dateKey < firstDateKey) {
      runningTotalBeforeRange += 1;
      continue;
    }

    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
  }

  let runningTotal = runningTotalBeforeRange;
  return dateKeys.map((dateKey) => {
    runningTotal += countsByDate.get(dateKey) ?? 0;
    return runningTotal;
  });
}

function shouldTrackVisitorPath(pathname: string) {
  if (PUBLIC_VISITOR_STATIC_PATHS.has(pathname)) {
    return true;
  }

  if (!pathname || pathname.includes(".")) {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 1 || segments.length > 3) {
    return false;
  }

  const [firstSegment] = segments;
  if (
    firstSegment === "dashboard" ||
    firstSegment === "login" ||
    firstSegment === "offline"
  ) {
    return false;
  }

  return true;
}

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

export const trackVisitorVisit = mutation({
  args: {
    visitorKey: v.string(),
    pathname: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { visitorKey, pathname }) => {
    const normalizedPathname = pathname.trim();
    if (!visitorKey || !normalizedPathname) {
      return null;
    }

    if (!shouldTrackVisitorPath(normalizedPathname)) {
      return null;
    }

    const now = Date.now();
    const dateKey = formatDateKey(now);
    const visitor = await ctx.db
      .query("visitors")
      .withIndex("by_visitorKey", (q) => q.eq("visitorKey", visitorKey))
      .first();

    if (visitor) {
      await ctx.db.patch(visitor._id, {
        lastSeenAt: now,
        lastPath: normalizedPathname,
      });
    } else {
      await ctx.db.insert("visitors", {
        visitorKey,
        firstSeenAt: now,
        lastSeenAt: now,
        lastPath: normalizedPathname,
      });
    }

    const existingDailyVisit = await ctx.db
      .query("visitorDailyVisits")
      .withIndex("by_visitorKey_dateKey", (q) =>
        q.eq("visitorKey", visitorKey).eq("dateKey", dateKey)
      )
      .first();

    if (existingDailyVisit) {
      return null;
    }

    await ctx.db.insert("visitorDailyVisits", {
      visitorKey,
      dateKey,
      pathname: normalizedPathname,
      trackedAt: now,
    });

    const dailyStats = await ctx.db
      .query("visitorDailyStats")
      .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
      .first();

    if (dailyStats) {
      await ctx.db.patch(dailyStats._id, {
        uniqueVisitors: dailyStats.uniqueVisitors + 1,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("visitorDailyStats", {
      dateKey,
      uniqueVisitors: 1,
      updatedAt: now,
    });
    return null;
  },
});

export const getAdminDashboardAnalytics = query({
  args: {
    token: v.string(),
    days: v.optional(v.number()),
  },
  returns: adminDashboardAnalytics,
  handler: async (ctx, { token, days }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const resolvedDays = Math.max(7, Math.min(days ?? 30, 90));
    const dateKeys = buildRecentDateKeys(resolvedDays);
    const [universities, majors, courses, visitors, visitorDailyStats] =
      await Promise.all([
        ctx.db.query("universities").collect(),
        ctx.db.query("majors").collect(),
        ctx.db.query("courses").collect(),
        ctx.db.query("visitors").collect(),
        ctx.db.query("visitorDailyStats").collect(),
      ]);

    const visitorDailyStatsByDate = new Map(
      visitorDailyStats.map((entry) => [entry.dateKey, entry.uniqueVisitors])
    );
    const activeUniversities = universities.filter(isNotDeleted);
    const activeMajors = majors.filter(isNotDeleted);
    const activeCourses = courses.filter(isNotDeleted);
    const universityTotalsByDay = buildCumulativeTotals(
      activeUniversities,
      dateKeys
    );
    const majorTotalsByDay = buildCumulativeTotals(activeMajors, dateKeys);
    const courseTotalsByDay = buildCumulativeTotals(activeCourses, dateKeys);

    return {
      universitiesTotal: activeUniversities.length,
      majorsTotal: activeMajors.length,
      coursesTotal: activeCourses.length,
      visitorsTotal: visitors.length,
      entitySeries: dateKeys.map((dateKey, index) => ({
        dateKey,
        label: formatSeriesLabel(dateKey),
        universitiesTotal: universityTotalsByDay[index] ?? 0,
        majorsTotal: majorTotalsByDay[index] ?? 0,
        coursesTotal: courseTotalsByDay[index] ?? 0,
      })),
      visitorSeries: dateKeys.map((dateKey) => ({
        dateKey,
        label: formatSeriesLabel(dateKey),
        uniqueVisitors: visitorDailyStatsByDate.get(dateKey) ?? 0,
      })),
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
      treeDiagramUrl: v.optional(v.string()),
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
          treeDiagramUrl: major.treeDiagramUrl,
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
        v.literal("course_intro"),
        v.literal("comprehensive_post"),
        v.literal("textbook"),
        v.literal("previous_years"),
        v.literal("explanations_notebooks"),
        v.literal("course_drive"),
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
