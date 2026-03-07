"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CourseStatusSelector } from "@/components/course-status-selector";
import { motion } from "@/components/motion";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import {
  type CourseProgressStatus,
  loadCourseStatuses,
  setCourseStatus,
} from "@/lib/student-progress";

type CourseListItem = {
  _id: Id<"courses">;
  slug: string;
  name: string;
  courseCode?: string;
  semester?: number;
  order: number;
};
type CourseStatusFilter = "all" | CourseProgressStatus;

const semesterLabels: Record<number, string> = {
  1: "المستوى الأول",
  2: "المستوى الثاني",
  3: "المستوى الثالث",
  4: "المستوى الرابع",
  5: "المستوى الخامس",
  6: "المستوى السادس",
  7: "المستوى السابع",
  8: "المستوى الثامن",
  9: "المستوى التاسع",
  10: "المستوى العاشر",
};
const STATUS_FILTER_STORAGE_KEY = "aoun:student:course-filter:v1";
const statusFilterOptions: {
  value: CourseStatusFilter;
  label: string;
  dotClassName: string;
}[] = [
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
];

function parseCourseStatusFilter(
  raw: string | null,
): CourseStatusFilter | null {
  if (
    raw === "all" ||
    raw === "none" ||
    raw === "in_progress" ||
    raw === "completed"
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
  const grouped = new Map<number | null, CourseListItem[]>();

  for (const course of courses) {
    const key = course.semester ?? null;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(course);
  }

  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  return sortedKeys.map((semesterKey) => {
    const semesterCourses = (grouped.get(semesterKey) ?? []).toSorted(
      (a, b) => a.order - b.order,
    );

    const label =
      semesterKey !== null
        ? semesterLabels[semesterKey] || `المستوى ${semesterKey}`
        : "مواد أخرى";

    return {
      key: semesterKey,
      label,
      courses: semesterCourses,
    };
  });
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
  return (
    <article className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {badge ? (
            <span className="inline-flex rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {badge}
            </span>
          ) : null}
          <Link
            href={href}
            className="mt-2 block truncate font-semibold text-surface-800 transition-colors hover:text-primary-600 dark:text-surface-100 dark:hover:text-primary-400"
          >
            {course.name}
          </Link>
          {course.courseCode ? (
            <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
              {course.courseCode}
            </p>
          ) : null}
        </div>

        <Link
          href={href}
          aria-label={`اذهب إلى مادة ${course.name}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-200 text-surface-500 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-surface-700 dark:text-surface-400 dark:hover:border-primary-600 dark:hover:text-primary-300"
        >
          <svg
            className="h-4 w-4 rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      <div className="mt-3 border-t border-surface-100 pt-3 dark:border-surface-800">
        <CourseStatusSelector
          compact
          ariaLabel={`حالة المادة ${course.name}`}
          value={status}
          onChange={onStatusChange}
        />
      </div>
    </article>
  );
}

function CourseProgressStats({
  total,
  courseStatuses,
  courses,
}: {
  total: number;
  courseStatuses: Record<string, CourseProgressStatus>;
  courses: CourseListItem[];
}) {
  const completed = courses.filter(
    (course) => courseStatuses[course._id] === "completed",
  ).length;
  const inProgress = courses.filter(
    (course) => courseStatuses[course._id] === "in_progress",
  ).length;
  const none = total - completed - inProgress;
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct =
    total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const nonePct = 100 - completedPct - inProgressPct;

  const stats = [
    {
      key: "completed",
      label: "مكتمل",
      count: completed,
      percentage: completedPct,
      dotClassName: "bg-emerald-500",
      textClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "in_progress",
      label: "قيد الدراسة",
      count: inProgress,
      percentage: inProgressPct,
      dotClassName: "bg-amber-500",
      textClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "none",
      label: "لم يُبدأ",
      count: none,
      percentage: nonePct,
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
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            توزيع حالة {total} مادة ضمن الخطة.
          </p>
        </div>

        <div className="sm:text-left">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
            مكتمل
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedPct}%
            </span>
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {completed} / {total}
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
            <span className={`font-semibold ${stat.textClassName}`}>
              {stat.count}
            </span>
            <span className="text-surface-500 dark:text-surface-400">
              ({stat.percentage}%)
            </span>
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
      defaultCourses.filter(
        (course) =>
          statusFilter === "all" ||
          (courseStatuses[course._id] ?? "none") === statusFilter,
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
  const filteredSearchedCourses = useMemo(
    () =>
      activeSearchedCourses.filter(
        (course: CourseListItem) =>
          statusFilter === "all" ||
          (courseStatuses[course._id] ?? "none") === statusFilter,
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
    statusFilter !== "all" &&
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100 sm:text-2xl">
          الخطة الدراسية
        </h2>

        {isStatusFilterReady && courses.length > 0 ? (
          <CourseProgressStats
            total={courses.length}
            courseStatuses={courseStatuses}
            courses={courses}
          />
        ) : null}

        <div className="max-w-2xl space-y-3">
          <PublicSearchInput
            label="ابحث داخل مواد التخصص"
            placeholder="مثال: برمجة كائنية"
            value={search.input}
            onChange={search.setInput}
          />

          <div className="rounded-xl border border-surface-200/80 bg-surface-50/80 p-3 dark:border-surface-700 dark:bg-surface-900">
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
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
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
            لا توجد مواد بهذه الحالة حالياً
          </p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            غيّر فلتر الحالة لعرض مواد إضافية.
          </p>
        </div>
      ) : search.isEmpty ? (
        <div className="space-y-10">
          {groupedDefaultCourses.map((semester) => (
            <div key={semester.key ?? "other"}>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-700 dark:text-surface-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {semester.key ?? "—"}
                </span>
                {semester.label}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">
            {filteredSearchedCourses.length} نتيجة بحث
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSearchedCourses.map((course: CourseListItem) => (
              <CourseCard
                key={course._id}
                course={course}
                href={`/${universitySlug}/${majorSlug}/${course.slug}`}
                badge={
                  course.semester
                    ? semesterLabels[course.semester] ||
                      `فصل ${course.semester}`
                    : "مادة عامة"
                }
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
