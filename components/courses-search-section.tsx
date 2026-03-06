"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CourseStatusSelector } from "@/components/course-status-selector";
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

const semesterLabels: Record<number, string> = {
  1: "الفصل الأول",
  2: "الفصل الثاني",
  3: "الفصل الثالث",
  4: "الفصل الرابع",
  5: "الفصل الخامس",
  6: "الفصل السادس",
  7: "الفصل السابع",
  8: "الفصل الثامن",
  9: "الفصل التاسع",
  10: "الفصل العاشر",
};

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
        ? semesterLabels[semesterKey] || `الفصل ${semesterKey}`
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

export function CoursesSearchSection({
  majorId,
  universitySlug,
  majorSlug,
  courses,
}: {
  majorId: Id<"majors">;
  universitySlug: string;
  majorSlug: string;
  courses: CourseListItem[];
}) {
  const search = useDebouncedPublicSearch();
  const [courseStatuses, setCourseStatuses] = useState<
    Record<string, CourseProgressStatus>
  >({});

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCourseStatuses(loadCourseStatuses());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const searchedCourses = useQuery(
    api.courses.searchByMajor,
    search.isEmpty ? "skip" : { majorId, query: search.query },
  );

  const defaultCourses = useMemo(
    () => courses.toSorted((a, b) => a.order - b.order),
    [courses],
  );
  const groupedDefaultCourses = useMemo(
    () => groupCoursesBySemester(defaultCourses),
    [defaultCourses],
  );
  const activeSearchedCourses = searchedCourses ?? [];

  const isLoading =
    !search.isEmpty && (search.isDebouncing || searchedCourses === undefined);
  const isNoResults =
    !search.isEmpty && !isLoading && activeSearchedCourses.length === 0;
  const isEmptyList = search.isEmpty && defaultCourses.length === 0;

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

        <div className="max-w-2xl">
          <PublicSearchInput
            label="ابحث داخل مواد التخصص"
            placeholder="مثال: برمجة كائنية"
            value={search.input}
            onChange={search.setInput}
          />
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
            {activeSearchedCourses.length} نتيجة بحث
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSearchedCourses.map((course: CourseListItem) => (
              <CourseCard
                key={course._id}
                course={course}
                href={`/${universitySlug}/${majorSlug}/${course.slug}`}
                badge={
                  course.semester
                    ? semesterLabels[course.semester] || `فصل ${course.semester}`
                    : "مادة عامة"
                }
                status={getStatus(course._id)}
                onStatusChange={(status) => handleStatusChange(course._id, status)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
