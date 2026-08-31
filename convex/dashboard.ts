import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertAdmin,
  assertCanEditCourse,
  assertCanEditMajor,
  authenticateUser,
  getPermissions,
  isNotDeleted,
} from "./helpers";

const deliveryMode = v.union(v.literal("in_person"), v.literal("online"));

const socialLinks = v.object({
  instagram: v.optional(v.string()),
  facebook: v.optional(v.string()),
  facebookGroup: v.optional(v.string()),
  faculty: v.optional(v.string()),
  telegram: v.optional(v.string()),
});

const majorWithUniversity = v.object({
  _id: v.id("majors"),
  _creationTime: v.number(),
  universityId: v.id("universities"),
  name: v.string(),
  slug: v.string(),
  order: v.number(),
  alias: v.optional(v.string()),
  treeDiagramUrl: v.optional(v.string()),
  socialLinks: v.optional(socialLinks),
  universityName: v.string(),
});

const courseWithResourceCount = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  majorId: v.id("majors"),
  name: v.string(),
  slug: v.string(),
  credits: v.number(),
  deliveryMode,
  courseCode: v.optional(v.string()),
  semesterId: v.optional(v.id("semesters")),
  semester: v.optional(v.string()),
  semesterName: v.optional(v.string()),
  semesterOrder: v.optional(v.number()),
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

const publicVisitorsTotal = v.object({
  visitorsTotal: v.number(),
});

const visitorSeriesEntry = v.object({
  dateKey: v.string(),
  label: v.string(),
  uniqueVisitors: v.number(),
});

const pageViewSeriesEntry = v.object({
  dateKey: v.string(),
  label: v.string(),
  pageViews: v.number(),
  uniqueVisitors: v.number(),
});

const topPageEntry = v.object({
  pathname: v.string(),
  label: v.string(),
  pageType: v.string(),
  pageTypeLabel: v.string(),
  pageViews: v.number(),
  uniqueVisitors: v.number(),
});

const pageTypeTrafficEntry = v.object({
  pageType: v.string(),
  label: v.string(),
  pageViews: v.number(),
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
  pageViewsTotal: v.number(),
  entitySeries: v.array(entitySeriesEntry),
  visitorSeries: v.array(visitorSeriesEntry),
  pageViewSeries: v.array(pageViewSeriesEntry),
  topPages: v.array(topPageEntry),
  trafficByPageType: v.array(pageTypeTrafficEntry),
});

const AMMAN_TIME_ZONE = "Asia/Amman";
const PUBLIC_VISITOR_STATIC_PATHS = new Set([
  "/academic-planner",
  "/courses",
  "/focus",
  "/gpa-calculator",
]);
const STATIC_TRACKABLE_PAGE_LABELS: Record<
  string,
  { pageType: string; pageTypeLabel: string; label: string }
> = {
  "/gpa-calculator": {
    pageType: "tool",
    pageTypeLabel: "أدوات",
    label: "حاسبة المعدل",
  },
  "/academic-planner": {
    pageType: "tool",
    pageTypeLabel: "أدوات",
    label: "المخطط الأكاديمي",
  },
  "/courses": {
    pageType: "catalog",
    pageTypeLabel: "الدليل",
    label: "دليل المواد",
  },
  "/focus": {
    pageType: "tool",
    pageTypeLabel: "أدوات",
    label: "وضع التركيز",
  },
};
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
  const [firstSegment] = segments;
  if (segments.length !== 2) {
    return false;
  }

  return !(
    firstSegment === "bookmarks" ||
    firstSegment === "dashboard" ||
    firstSegment === "login" ||
    firstSegment === "news" ||
    firstSegment === "offline" ||
    firstSegment === "partners" ||
    firstSegment === "settings"
  );
}

type PathLookup = {
  universityNamesBySlug: Map<string, string>;
  majorNamesByPath: Map<string, string>;
  courseNamesByPath: Map<string, string>;
  newsLabelsByPath: Map<string, string>;
};

function buildPathLookup(
  universities: Array<{ _id: string; slug: string; name: string }>,
  majors: Array<{
    _id: string;
    universityId: string;
    slug: string;
    name: string;
  }>,
  courses: Array<{ majorId: string; slug: string; name: string }>
): PathLookup {
  const universityNamesBySlug = new Map(
    universities.map((university) => [university.slug, university.name])
  );
  const universitiesById = new Map(
    universities.map((university) => [university._id, university])
  );
  const majorsById = new Map(majors.map((major) => [major._id, major]));
  const majorNamesByPath = new Map<string, string>();
  const courseNamesByPath = new Map<string, string>();
  const newsLabelsByPath = new Map<string, string>();

  for (const major of majors) {
    const university = universitiesById.get(major.universityId);
    if (!university) {
      continue;
    }

    const majorPath = `/${university.slug}/${major.slug}`;
    majorNamesByPath.set(majorPath, major.name);
    newsLabelsByPath.set(`${majorPath}/news`, `أخبار ${major.name}`);
  }

  for (const course of courses) {
    const major = majorsById.get(course.majorId);
    if (!major) {
      continue;
    }

    const university = universitiesById.get(major.universityId);
    if (!university) {
      continue;
    }

    courseNamesByPath.set(
      `/${university.slug}/${major.slug}/${course.slug}`,
      course.name
    );
  }

  return {
    universityNamesBySlug,
    majorNamesByPath,
    courseNamesByPath,
    newsLabelsByPath,
  };
}

function describePublicPath(pathname: string, pathLookup: PathLookup) {
  const staticPage = STATIC_TRACKABLE_PAGE_LABELS[pathname];
  if (staticPage) {
    return staticPage;
  }

  const courseName = pathLookup.courseNamesByPath.get(pathname);
  if (courseName) {
    return {
      pageType: "course",
      pageTypeLabel: "المواد",
      label: `مادة: ${courseName}`,
    };
  }

  const newsLabel = pathLookup.newsLabelsByPath.get(pathname);
  if (newsLabel) {
    return {
      pageType: "news",
      pageTypeLabel: "الأخبار",
      label: newsLabel,
    };
  }

  const majorName = pathLookup.majorNamesByPath.get(pathname);
  if (majorName) {
    return {
      pageType: "major",
      pageTypeLabel: "التخصصات",
      label: `تخصص: ${majorName}`,
    };
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) {
    const universityName = pathLookup.universityNamesBySlug.get(segments[0] ?? "");
    if (universityName) {
      return {
        pageType: "university",
        pageTypeLabel: "الجامعات",
        label: `جامعة: ${universityName}`,
      };
    }
  }

  return {
    pageType: "other",
    pageTypeLabel: "أخرى",
    label: pathname,
  };
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
        const [resources, semester] = await Promise.all([
          ctx.db
            .query("resources")
            .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
            .collect(),
          course.semesterId ? ctx.db.get(course.semesterId) : null,
        ]);
        const activeSemester = semester && isNotDeleted(semester) ? semester : null;
        return {
          _id: course._id,
          _creationTime: course._creationTime,
          majorId: course.majorId,
          name: course.name,
          slug: course.slug,
          credits: course.credits,
          deliveryMode: course.deliveryMode ?? "in_person",
          courseCode: course.courseCode,
          semesterId: activeSemester?._id,
          semester: course.semester,
          semesterName: activeSemester?.name,
          semesterOrder: activeSemester?.order,
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
      treeDiagramUrl: major.treeDiagramUrl,
      socialLinks: major.socialLinks,
      universityName: university?.name ?? "",
    };
  },
});

export const updateMajorTreeDiagramUrl = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    treeDiagramUrl: v.optional(v.string()),
    socialLinks: v.optional(socialLinks),
  },
  returns: v.null(),
  handler: async (ctx, { token, majorId, treeDiagramUrl, socialLinks }) => {
    const user = await authenticateUser(ctx, token);
    await assertCanEditMajor(ctx, user._id, majorId);

    const major = await ctx.db.get("majors", majorId);
    if (!major || major.deletedAt !== undefined) {
      throw new ConvexError({ code: "MAJOR_NOT_FOUND" });
    }

    await ctx.db.patch("majors", majorId, {
      treeDiagramUrl,
      socialLinks,
    });

    return null;
  },
});

export const getPublicVisitorsTotal = query({
  args: {},
  returns: publicVisitorsTotal,
  handler: async (ctx) => {
    const visitorDailyStats = await ctx.db.query("visitorDailyStats").collect();

    return {
      visitorsTotal: visitorDailyStats.reduce(
        (total, entry) => total + entry.uniqueVisitors,
        0
      ),
    };
  },
});

export const trackVisitorVisit = mutation({
  args: {
    visitorKey: v.string(),
    pathname: v.string(),
    referrerPath: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { visitorKey, pathname, referrerPath }) => {
    const normalizedPathname = pathname.trim();
    if (!visitorKey || !normalizedPathname) {
      return null;
    }

    if (!shouldTrackVisitorPath(normalizedPathname)) {
      return null;
    }

    const now = Date.now();
    const dateKey = formatDateKey(now);
    const normalizedReferrerPath = referrerPath?.trim();
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

    await ctx.db.insert("visitorPageViews", {
      visitorKey,
      dateKey,
      pathname: normalizedPathname,
      referrerPath:
        normalizedReferrerPath &&
        normalizedReferrerPath !== normalizedPathname &&
        shouldTrackVisitorPath(normalizedReferrerPath)
          ? normalizedReferrerPath
          : undefined,
      trackedAt: now,
    });

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
    const [
      universities,
      majors,
      courses,
      visitors,
      visitorDailyStats,
      visitorPageViewBatches,
    ] = await Promise.all([
      ctx.db.query("universities").collect(),
      ctx.db.query("majors").collect(),
      ctx.db.query("courses").collect(),
      ctx.db.query("visitors").collect(),
      ctx.db.query("visitorDailyStats").collect(),
      Promise.all(
        dateKeys.map((dateKey) =>
          ctx.db
            .query("visitorPageViews")
            .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
            .collect()
        )
      ),
    ]);

    const visitorDailyStatsByDate = new Map<string, number>(
      visitorDailyStats.map((entry) => [entry.dateKey, entry.uniqueVisitors])
    );
    const visitorPageViews = visitorPageViewBatches
      .flat()
      .filter((pageView) => shouldTrackVisitorPath(pageView.pathname));
    const activeUniversities = universities.filter(isNotDeleted);
    const activeMajors = majors.filter(isNotDeleted);
    const activeCourses = courses.filter(isNotDeleted);
    const pathLookup = buildPathLookup(
      activeUniversities,
      activeMajors,
      activeCourses
    );
    const universityTotalsByDay = buildCumulativeTotals(
      activeUniversities,
      dateKeys
    );
    const majorTotalsByDay = buildCumulativeTotals(activeMajors, dateKeys);
    const courseTotalsByDay = buildCumulativeTotals(activeCourses, dateKeys);
    const pageViewsByDate = new Map<string, number>();
    const pageStatsByPath = new Map<
      string,
      {
        label: string;
        pageType: string;
        pageTypeLabel: string;
        pageViews: number;
        uniqueVisitors: Set<string>;
      }
    >();
    const pageTypeStats = new Map<
      string,
      { label: string; pageViews: number; uniqueVisitors: Set<string> }
    >();

    for (const pageView of visitorPageViews) {
      const pageMeta = describePublicPath(pageView.pathname, pathLookup);
      pageViewsByDate.set(
        pageView.dateKey,
        (pageViewsByDate.get(pageView.dateKey) ?? 0) + 1
      );

      const pageStats = pageStatsByPath.get(pageView.pathname) ?? {
        label: pageMeta.label,
        pageType: pageMeta.pageType,
        pageTypeLabel: pageMeta.pageTypeLabel,
        pageViews: 0,
        uniqueVisitors: new Set<string>(),
      };
      pageStats.pageViews += 1;
      pageStats.uniqueVisitors.add(pageView.visitorKey);
      pageStatsByPath.set(pageView.pathname, pageStats);

      const pageTypeEntry = pageTypeStats.get(pageMeta.pageType) ?? {
        label: pageMeta.pageTypeLabel,
        pageViews: 0,
        uniqueVisitors: new Set<string>(),
      };
      pageTypeEntry.pageViews += 1;
      pageTypeEntry.uniqueVisitors.add(pageView.visitorKey);
      pageTypeStats.set(pageMeta.pageType, pageTypeEntry);
    }

    return {
      universitiesTotal: activeUniversities.length,
      majorsTotal: activeMajors.length,
      coursesTotal: activeCourses.length,
      visitorsTotal: visitors.length,
      pageViewsTotal: visitorPageViews.length,
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
      pageViewSeries: dateKeys.map((dateKey) => ({
        dateKey,
        label: formatSeriesLabel(dateKey),
        pageViews: pageViewsByDate.get(dateKey) ?? 0,
        uniqueVisitors: visitorDailyStatsByDate.get(dateKey) ?? 0,
      })),
      topPages: Array.from(pageStatsByPath.entries())
        .map(([pathname, stats]) => ({
          pathname,
          label: stats.label,
          pageType: stats.pageType,
          pageTypeLabel: stats.pageTypeLabel,
          pageViews: stats.pageViews,
          uniqueVisitors: stats.uniqueVisitors.size,
        }))
        .toSorted((left, right) => right.pageViews - left.pageViews)
        .slice(0, 6),
      trafficByPageType: Array.from(pageTypeStats.entries())
        .map(([pageType, stats]) => ({
          pageType,
          label: stats.label,
          pageViews: stats.pageViews,
          uniqueVisitors: stats.uniqueVisitors.size,
        }))
        .toSorted((left, right) => right.pageViews - left.pageViews),
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
      socialLinks: v.optional(socialLinks),
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
          socialLinks: major.socialLinks,
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
      credits: v.number(),
      deliveryMode,
      courseCode: v.optional(v.string()),
      semesterId: v.optional(v.id("semesters")),
      semester: v.optional(v.string()),
      semesterName: v.optional(v.string()),
      semesterOrder: v.optional(v.number()),
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
        const [major, semester] = await Promise.all([
          ctx.db.get("majors", course.majorId),
          course.semesterId ? ctx.db.get(course.semesterId) : null,
        ]);
        const university = major
          ? await ctx.db.get("universities", major.universityId)
          : null;
        const activeSemester = semester && isNotDeleted(semester) ? semester : null;
        return {
          _id: course._id,
          _creationTime: course._creationTime,
          majorId: course.majorId,
          name: course.name,
          slug: course.slug,
          credits: course.credits,
          deliveryMode: course.deliveryMode ?? "in_person",
          courseCode: course.courseCode,
          semesterId: activeSemester?._id,
          semester: course.semester,
          semesterName: activeSemester?.name,
          semesterOrder: activeSemester?.order,
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
      credits: v.number(),
      courseCode: v.optional(v.string()),
      semesterId: v.optional(v.id("semesters")),
      semester: v.optional(v.string()),
      semesterName: v.optional(v.string()),
      semesterOrder: v.optional(v.number()),
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

    const [major, semester] = await Promise.all([
      ctx.db.get("majors", course.majorId),
      course.semesterId ? ctx.db.get(course.semesterId) : null,
    ]);
    const activeSemester = semester && isNotDeleted(semester) ? semester : null;
    return {
      _id: course._id,
      _creationTime: course._creationTime,
      majorId: course.majorId,
      name: course.name,
      slug: course.slug,
      credits: course.credits,
      courseCode: course.courseCode,
      semesterId: activeSemester?._id,
      semester: course.semester,
      semesterName: activeSemester?.name,
      semesterOrder: activeSemester?.order,
      order: course.order,
      alias: course.alias,
      majorName: major?.name ?? "",
    };
  },
});
