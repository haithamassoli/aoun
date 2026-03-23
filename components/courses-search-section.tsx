"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CourseStatusMenu,
  getCourseStatusOption,
} from "@/components/course-status-selector";
import { motion } from "@/components/motion";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import {
  type CourseProgressStatus,
  loadCourseStatuses,
  setCourseStatus,
} from "@/lib/student-progress";
import { CustomCourseTracker } from "@/components/custom-course-tracker";
import {
  formatCourseSemesterLabel,
  getCourseSemesterGroupKey,
} from "@/lib/course-semester";

type CourseListItem = {
  _id: Id<"courses">;
  _creationTime: number;
  slug: string;
  name: string;
  credits: number;
  courseCode?: string;
  semester?: string;
  order: number;
};
type CourseStatusFilter = "all" | CourseProgressStatus;
type StatusFilterOption = {
  value: CourseStatusFilter;
  label: string;
  dotClassName: string;
};
type CourseStatusCounts = Record<CourseStatusFilter, number>;

const STATUS_FILTER_STORAGE_KEY = "aoun:student:course-filter:v1";
const baseStatusFilterOptions: StatusFilterOption[] = [
  {
    value: "all",
    label: "الكل",
    dotClassName: "bg-primary-500",
  },
  {
    value: "none",
    label: "بدون حالة",
    dotClassName: "bg-surface-400 dark:bg-surface-500",
  },
  {
    value: "in_progress",
    label: "قيد الدراسة",
    dotClassName: "bg-amber-500",
  },
  {
    value: "completed",
    label: "مكتمل",
    dotClassName: "bg-emerald-500",
  },
  {
    value: "hidden",
    label: "مخفي من الخطة",
    dotClassName: "bg-slate-500",
  },
];

function parseCourseStatusFilter(
  raw: string | null,
): CourseStatusFilter | null {
  if (
    raw === "all" ||
    raw === "none" ||
    raw === "in_progress" ||
    raw === "completed" ||
    raw === "hidden"
  ) {
    return raw;
  }

  return null;
}

function loadCourseStatusFilter(): CourseStatusFilter | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseCourseStatusFilter(
      window.localStorage.getItem(STATUS_FILTER_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

function persistCourseStatusFilter(filter: CourseStatusFilter) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (filter === "all") {
      window.localStorage.removeItem(STATUS_FILTER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STATUS_FILTER_STORAGE_KEY, filter);
  } catch {
    // Local storage may be blocked by the browser.
  }
}

function getFilterButtonClassName(isActive: boolean) {
  if (isActive) {
    return "inline-flex items-center gap-1.5 rounded-full border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors dark:border-primary-600 dark:bg-primary-900/40 dark:text-primary-300";
  }

  return "inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-500 transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:border-primary-700 dark:hover:text-primary-300";
}

function groupCoursesBySemester(courses: CourseListItem[]) {
  const grouped = new Map<string | null, CourseListItem[]>();
  const orderedCourses = courses.toSorted((a, b) => a.order - b.order);

  for (const course of orderedCourses) {
    const key = getCourseSemesterGroupKey(course.semester);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(course);
  }

  const groups = Array.from(grouped.entries()).map(
    ([semesterKey, semesterCourses]) => {
      const label = formatCourseSemesterLabel(semesterKey, {
        emptyLabel: "مواد أخرى",
      })!;
      const firstCreatedAt = Math.min(
        ...semesterCourses.map((course) => course._creationTime),
      );
      const isNumericSemester =
        semesterKey !== null && /^\d+$/.test(semesterKey);
      const numericSemester = isNumericSemester
        ? Number.parseInt(semesterKey, 10)
        : null;

      return {
        key: semesterKey,
        label,
        courses: semesterCourses,
        firstCreatedAt,
        isNumericSemester,
        numericSemester,
      };
    },
  );

  groups.sort((a, b) => {
    if (a.isNumericSemester && b.isNumericSemester) {
      return (a.numericSemester ?? 0) - (b.numericSemester ?? 0);
    }

    if (a.isNumericSemester) return -1;
    if (b.isNumericSemester) return 1;

    if (a.key === null && b.key !== null) return 1;
    if (b.key === null && a.key !== null) return -1;

    if (a.firstCreatedAt !== b.firstCreatedAt) {
      return a.firstCreatedAt - b.firstCreatedAt;
    }

    return a.label.localeCompare(b.label, "ar");
  });

  return groups.map(({ key, label, courses: groupedCourses }) => ({
    key,
    label,
    courses: groupedCourses,
  }));
}

function getSemesterGroupKey(semesterKey: string | null) {
  return semesterKey === null
    ? "other"
    : `semester-${encodeURIComponent(semesterKey)}`;
}

function matchesStatusFilter(
  status: CourseProgressStatus,
  filter: CourseStatusFilter,
) {
  if (filter === "all") {
    return status !== "hidden";
  }

  return status === filter;
}

function getCourseStatusCounts(
  courses: CourseListItem[],
  courseStatuses: Record<string, CourseProgressStatus>,
): CourseStatusCounts {
  const counts: CourseStatusCounts = {
    all: 0,
    none: 0,
    in_progress: 0,
    completed: 0,
    hidden: 0,
  };

  for (const course of courses) {
    const status = courseStatuses[course._id] ?? "none";
    counts[status] += 1;

    if (status !== "hidden") {
      counts.all += 1;
    }
  }

  return counts;
}

function CourseCard({
  course,
  href,
  status,
  badge,
  onStatusChange,
}: {
  course: CourseListItem;
  href: string;
  status: CourseProgressStatus;
  badge?: string;
  onStatusChange: (status: CourseProgressStatus) => void;
}) {
  const statusOption = getCourseStatusOption(status);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white/95 p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[0_20px_40px_-28px_rgba(14,165,233,0.45)] dark:border-surface-700/80 dark:bg-surface-900/95 dark:shadow-none dark:hover:border-primary-600 sm:p-4">
      <div className="flex items-center justify-between sm:gap-3">
        <Link href={href} className="min-w-0 flex-1 space-y-2">
          {badge ? (
            <span className="inline-flex max-w-full truncate rounded-full border border-primary-200/70 bg-primary-50/80 px-2.5 py-1 text-[10px] font-semibold text-primary-700 dark:border-primary-900 dark:bg-primary-950/80 dark:text-primary-300">
              {badge}
            </span>
          ) : null}
          <div
            className={
              course.courseCode
                ? "space-y-1"
                : "flex min-h-12 items-center justify-center"
            }
          >
            <div
              className={`flex gap-2 ${
                course.courseCode
                  ? "items-center"
                  : "w-full items-center justify-start"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusOption.dotClassName}`}
                aria-hidden="true"
              />
              <div>
                <h4
                  className={`dark:group-hover:text-primary-400 group-hover:text-primary-600 block min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-6 text-surface-800 transition-colors hover:text-primary-600 dark:text-surface-100 dark:hover:text-primary-400 sm:text-base`}
                >
                  {course.name}
                </h4>
                {course.courseCode ? (
                  <p className="truncate text-[11px] font-medium tracking-[0.14em] text-surface-500 dark:text-surface-400">
                    {course.courseCode}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <CourseStatusMenu
            ariaLabel={`تغيير حالة المادة ${course.name}`}
            value={status}
            onChange={onStatusChange}
          />
        </div>
      </div>
    </article>
  );
}

function CourseProgressStats({
  courseStatuses,
  courses,
  customCourses = [],
}: {
  courseStatuses: Record<string, CourseProgressStatus>;
  courses: CourseListItem[];
  customCourses?: Array<{ id: string; status: CourseProgressStatus; credits?: number }>;
}) {
  let totalCredits = 0;
  let hiddenCredits = 0;
  let completedCredits = 0;
  let inProgressCredits = 0;

  for (const course of courses) {
    totalCredits += course.credits;

    const status = courseStatuses[course._id] ?? "none";
    if (status === "hidden") {
      hiddenCredits += course.credits;
      continue;
    }

    if (status === "completed") {
      completedCredits += course.credits;
      continue;
    }

    if (status === "in_progress") {
      inProgressCredits += course.credits;
    }
  }

  // Include custom courses in the stats
  for (const customCourse of customCourses) {
    const credits = customCourse.credits ?? 3;
    
    if (customCourse.status === "completed") {
      completedCredits += credits;
      totalCredits += credits;
    } else if (customCourse.status === "in_progress") {
      inProgressCredits += credits;
      totalCredits += credits;
    } else if (customCourse.status === "hidden") {
      hiddenCredits += credits;
      totalCredits += credits;
    } else {
      totalCredits += credits;
    }
  }

  const visibleCredits = totalCredits - hiddenCredits;
  // const noneCredits = visibleCredits - completedCredits - inProgressCredits;
  const completedPct =
    visibleCredits > 0
      ? Math.round((completedCredits / visibleCredits) * 100)
      : 0;
  const inProgressPct =
    visibleCredits > 0
      ? Math.round((inProgressCredits / visibleCredits) * 100)
      : 0;
  const nonePct = Math.max(0, 100 - completedPct - inProgressPct);
  // const hiddenPct =
  //   totalCredits > 0 ? Math.round((hiddenCredits / totalCredits) * 100) : 0;

  const stats = [
    // {
    //   key: "hidden",
    //   label: "مخفي",
    //   count: hiddenCredits,
    //   percentage: hiddenPct,
    //   dotClassName: "bg-slate-500",
    //   textClassName: "text-slate-600 dark:text-slate-300",
    // },
    {
      key: "completed",
      label: "مكتمل",
      // count: completedCredits,
      // percentage: completedPct,
      dotClassName: "bg-emerald-500",
      textClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "in_progress",
      label: "قيد الدراسة",
      // count: inProgressCredits,
      // percentage: inProgressPct,
      dotClassName: "bg-amber-500",
      textClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "none",
      label: "لم يُبدأ",
      // count: noneCredits,
      // percentage: nonePct,
      dotClassName: "bg-surface-300 dark:bg-surface-600",
      textClassName: "text-surface-600 dark:text-surface-300",
    },
  ] as const;

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            تقدم الدراسة
          </p>
          {/* <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {hiddenCredits > 0
              ? `توزيع ${visibleCredits} ساعة ضمن الخطة بعد إخفاء ${hiddenCredits} ساعة من أصل ${totalCredits}.`
              : `توزيع ${visibleCredits} ساعة ضمن الخطة.`}
          </p> */}
        </div>

        <div className="sm:text-left">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedPct}%
            </span>
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {completedCredits} / {visibleCredits} ساعة
            </span>
          </div>
        </div>
      </div>

      <div
        className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800"
        aria-label="مخطط تقدم الدراسة"
        role="img"
      >
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${completedPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${inProgressPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-surface-200 dark:bg-surface-700"
          initial={{ width: 0 }}
          animate={{ width: `${nonePct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="inline-flex items-center gap-2 rounded-full border border-surface-200 px-3 py-1.5 text-sm dark:border-surface-700"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${stat.dotClassName}`}
              aria-hidden="true"
            />
            <span className="text-surface-700 dark:text-surface-200">
              {stat.label}
            </span>
            {/* <span className={`font-semibold ${stat.textClassName}`}>
              {stat.count} ساعة
            </span>
            <span className="text-surface-500 dark:text-surface-400">
              ({stat.percentage}%)
            </span> */}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoursesSearchSection({
  majorId,
  universitySlug,
  majorSlug,
  courses,
  initialStatusFilter,
}: {
  majorId: Id<"majors">;
  universitySlug: string;
  majorSlug: string;
  courses: CourseListItem[];
  initialStatusFilter?: CourseStatusFilter;
}) {
  const search = useDebouncedPublicSearch();
  const [courseStatuses, setCourseStatuses] = useState<
    Record<string, CourseProgressStatus>
  >({});
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>(
    initialStatusFilter ?? "all",
  );
  const [isStatusFilterReady, setIsStatusFilterReady] = useState(false);
  const [collapsedSemesterGroups, setCollapsedSemesterGroups] = useState<
    Record<string, boolean>
  >({});
  const [customCourses, setCustomCourses] = useState<
    Array<{ id: string; status: CourseProgressStatus; credits?: number }>
  >([]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCourseStatuses(loadCourseStatuses());

      if (initialStatusFilter === undefined) {
        const storedFilter = loadCourseStatusFilter();
        if (storedFilter) {
          setStatusFilter(storedFilter);
        }
      } else {
        setStatusFilter(initialStatusFilter);
      }

      setIsStatusFilterReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [initialStatusFilter]);

  useEffect(() => {
    if (!isStatusFilterReady) {
      return;
    }

    persistCourseStatusFilter(statusFilter);
  }, [isStatusFilterReady, statusFilter]);

  const searchedCourses = useQuery(
    api.courses.searchByMajor,
    search.isEmpty ? "skip" : { majorId, query: search.query },
  );

  const defaultCourses = useMemo(
    () => courses.toSorted((a, b) => a.order - b.order),
    [courses],
  );
  const filteredDefaultCourses = useMemo(
    () =>
      defaultCourses.filter((course) =>
        matchesStatusFilter(courseStatuses[course._id] ?? "none", statusFilter),
      ),
    [courseStatuses, defaultCourses, statusFilter],
  );
  const groupedDefaultCourses = useMemo(
    () => groupCoursesBySemester(filteredDefaultCourses),
    [filteredDefaultCourses],
  );
  const activeSearchedCourses = useMemo(
    () => searchedCourses ?? [],
    [searchedCourses],
  );
  const coursesForStatusCounts =
    search.isEmpty || searchedCourses === undefined
      ? defaultCourses
      : activeSearchedCourses;
  const statusFilterCounts = useMemo(
    () => getCourseStatusCounts(coursesForStatusCounts, courseStatuses),
    [courseStatuses, coursesForStatusCounts],
  );
  const statusFilterOptions = useMemo(
    () =>
      baseStatusFilterOptions.map((option) => ({
        ...option,
        count: statusFilterCounts[option.value],
      })),
    [statusFilterCounts],
  );
  const filteredSearchedCourses = useMemo(
    () =>
      activeSearchedCourses.filter((course: CourseListItem) =>
        matchesStatusFilter(courseStatuses[course._id] ?? "none", statusFilter),
      ),
    [activeSearchedCourses, courseStatuses, statusFilter],
  );

  const isLoading =
    !search.isEmpty && (search.isDebouncing || searchedCourses === undefined);
  const isNoResults =
    !search.isEmpty && !isLoading && filteredSearchedCourses.length === 0;
  const isEmptyList = search.isEmpty && defaultCourses.length === 0;
  const isNoFilterResults =
    search.isEmpty &&
    defaultCourses.length > 0 &&
    filteredDefaultCourses.length === 0;

  const getStatus = (courseId: Id<"courses">) => {
    return courseStatuses[courseId] ?? "none";
  };

  const handleStatusChange = (
    courseId: Id<"courses">,
    nextStatus: CourseProgressStatus,
  ) => {
    setCourseStatuses(setCourseStatus(courseId, nextStatus));
  };

  const toggleSemesterGroup = (groupKey: string) => {
    setCollapsedSemesterGroups((current) => ({
      ...current,
      [groupKey]: !(current[groupKey] ?? false),
    }));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8  pb-10 pt-4 sm:py-8">
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100 sm:text-2xl">
          الخطة الدراسية
        </h2>

        {isStatusFilterReady && courses.length > 0 ? (
          <CourseProgressStats
            courseStatuses={courseStatuses}
            courses={courses}
            customCourses={customCourses}
          />
        ) : null}

        <div className="max-w-5xl space-y-3 md:flex md:items-start md:gap-3 md:space-y-0">
          <div className="w-full md:max-w-sm lg:max-w-lg">
            <PublicSearchInput
              label="ابحث داخل مواد التخصص"
              placeholder="مثال: برمجة كائنية"
              value={search.input}
              onChange={search.setInput}
            />
          </div>

          <div className="rounded-xl flex-1 border border-surface-200/80 bg-surface-50/80 p-3 dark:border-surface-700 dark:bg-surface-900 md:w-[320px] md:shrink-0 lg:w-[360px]">
            <p className="mb-2 text-xs font-medium text-surface-600 dark:text-surface-300">
              فلترة حسب حالة الدراسة
            </p>
            <div
              role="radiogroup"
              aria-label="فلترة المواد حسب حالة الدراسة"
              className="flex flex-wrap items-center gap-2"
            >
              {statusFilterOptions.map((option) => {
                const isActive = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setStatusFilter(option.value)}
                    className={getFilterButtonClassName(isActive)}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${option.dotClassName}`}
                      aria-hidden="true"
                    />
                    <span>{option.label}</span>
                    {isStatusFilterReady ? (
                      <span className="text-[11px] tabular-nums">
                        ({option.count})
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
            />
          ))}
        </div>
      ) : isNoResults ? (
        <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-base font-semibold text-surface-700 dark:text-surface-200">
            لا توجد نتائج مطابقة
          </p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            لم نعثر على مادة تطابق «{search.query}» داخل هذا التخصص.
          </p>
        </div>
      ) : isEmptyList ? (
        <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-surface-500 dark:text-surface-400">
            لم تُضاف مواد بعد. ترقبوا التحديثات!
          </p>
        </div>
      ) : isNoFilterResults ? (
        <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-base font-semibold text-surface-700 dark:text-surface-200">
            {statusFilter === "all"
              ? "تم إخفاء جميع المواد من الخطة"
              : "لا توجد مواد بهذه الحالة حالياً"}
          </p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {statusFilter === "all"
              ? "اعرض المواد المخفية أو غيّر حالة بعض المواد لتظهر مجدداً."
              : "غيّر فلتر الحالة لعرض مواد إضافية."}
          </p>
        </div>
      ) : search.isEmpty ? (
        <div className="space-y-10">
          <CustomCourseTracker
            majorId={majorId}
            onCoursesChange={(courses) =>
              setCustomCourses(
                courses.map((c) => ({ id: c.id, status: c.status, credits: c.credits })),
              )
            }
          />
          {groupedDefaultCourses.map((semester) => {
            const groupKey = getSemesterGroupKey(semester.key);
            const panelId = `courses-semester-panel-${groupKey}`;
            const isCollapsed = collapsedSemesterGroups[groupKey] ?? false;

            return (
              <div key={groupKey} className="space-y-4">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-controls={panelId}
                  onClick={() => toggleSemesterGroup(groupKey)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-surface-200/80 bg-white/90 px-4 py-3 text-right shadow-[0_12px_30px_-28px_rgba(15,23,42,0.55)] transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/60 dark:border-surface-700/80 dark:bg-surface-900/90 dark:shadow-none dark:hover:border-primary-600 dark:hover:bg-surface-900"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {semester.key && /^\d+$/.test(semester.key)
                        ? String(Number.parseInt(semester.key, 10))
                        : semester.key
                          ? "•"
                          : "—"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-surface-800 dark:text-surface-100 sm:text-lg">
                        {semester.label}
                      </span>
                      <span className="block text-xs text-surface-500 dark:text-surface-400">
                        {semester.courses.length} مادة
                      </span>
                    </span>
                  </span>

                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-surface-200/80 bg-surface-50/80 px-2.5 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800/80 dark:text-surface-300">
                    <span>{isCollapsed ? "عرض المواد" : "إخفاء المواد"}</span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isCollapsed ? "" : "rotate-180"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>

                {!isCollapsed ? (
                  <div
                    id={panelId}
                    className="grid grid-cols-2 gap-1 sm:gap-2.5 lg:grid-cols-3"
                  >
                    {semester.courses.map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        href={`/${universitySlug}/${majorSlug}/${course.slug}`}
                        status={getStatus(course._id)}
                        onStatusChange={(status) =>
                          handleStatusChange(course._id, status)
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">
            {filteredSearchedCourses.length} نتيجة بحث
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            {filteredSearchedCourses.map((course: CourseListItem) => (
              <CourseCard
                key={course._id}
                course={course}
                href={`/${universitySlug}/${majorSlug}/${course.slug}`}
                badge={formatCourseSemesterLabel(course.semester, {
                  emptyLabel: "مواد أخرى",
                })}
                status={getStatus(course._id)}
                onStatusChange={(status) =>
                  handleStatusChange(course._id, status)
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
