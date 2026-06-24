"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PublicSearchInput } from "@/components/public-search-input";
import {
  loadRecentGlobalCourseSearches,
  rememberRecentGlobalCourseSearch,
  removeRecentGlobalCourseSearch,
  saveRecentGlobalCourseSearches,
  subscribeRecentGlobalCourseSearches,
  type RecentGlobalCourseSearch,
} from "@/lib/recent-global-course-searches";
import {
  PUBLIC_SEARCH_CONTRACT,
  normalizePublicSearchQuery,
} from "@/lib/public-search";
import { normalizeSlugLookup } from "@/lib/slug";
import { BookmarkToggleButton } from "@/components/bookmarks/bookmark-toggle-button";
import { captureAnalyticsEvent } from "@/lib/analytics-events";

// Simple SVG Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

type UniversityOption = {
  _id: Id<"universities">;
  name: string;
  slug: string;
  order: number;
};

type MajorOption = {
  _id: Id<"majors">;
  name: string;
  slug: string;
  order: number;
};

type GlobalCourseSearchResult = {
  _id: Id<"courses">;
  _creationTime: number;
  slug: string;
  name: string;
  credits: number;
  courseCode?: string;
  semesterId?: Id<"semesters">;
  semester?: string;
  semesterName?: string;
  semesterOrder?: number;
  order: number;
  majorName: string;
  majorSlug: string;
  universityName: string;
  universitySlug: string;
  href: string;
};

type GlobalCoursesSearchPageProps = {
  universities: UniversityOption[];
  initialSearchParams: {
    q?: string;
    university?: string;
    major?: string;
  };
};

const EMPTY_RESULTS: GlobalCourseSearchResult[] = [];
const EMPTY_MAJORS: MajorOption[] = [];
const EMPTY_RECENT_SEARCHES: RecentGlobalCourseSearch[] = [];

function getSelectClassName(isDisabled: boolean) {
  return [
    "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors",
    "dark:bg-surface-900",
    isDisabled
      ? "cursor-not-allowed border-surface-200 text-surface-400 dark:border-surface-700 dark:text-surface-500"
      : "border-surface-300 text-surface-900 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-surface-600 dark:text-surface-100 dark:hover:border-surface-500 dark:focus:border-primary-500 dark:focus:ring-primary-900/30",
  ].join(" ");
}

function buildCoursesSearchHref(params: {
  query: string;
  universitySlug?: string;
  majorSlug?: string;
}) {
  const searchParams = new URLSearchParams();
  const trimmedQuery = params.query.trim();

  if (normalizePublicSearchQuery(trimmedQuery).length > 0) {
    searchParams.set("q", trimmedQuery);
  }

  if (params.universitySlug) {
    searchParams.set("university", params.universitySlug);
  }

  if (params.majorSlug) {
    searchParams.set("major", params.majorSlug);
  }

  const nextQueryString = searchParams.toString();
  return nextQueryString ? `/courses?${nextQueryString}` : "/courses";
}

function formatRecentSearchLabel(
  entry: RecentGlobalCourseSearch,
  universityBySlug: Map<string, UniversityOption>,
  majorBySlug: Map<string, MajorOption>,
) {
  const parts = [entry.query];

  if (entry.universitySlug) {
    const university = universityBySlug.get(
      normalizeSlugLookup(entry.universitySlug),
    );
    parts.push(university?.name ?? entry.universitySlug);
  }

  if (entry.majorSlug) {
    const major = majorBySlug.get(normalizeSlugLookup(entry.majorSlug));
    parts.push(major?.name ?? entry.majorSlug);
  }

  return parts.join(" • ");
}

function EmptyState({
  recentSearches,
  onRecentSearchSelect,
  onRecentSearchDelete,
  recentLabels,
}: {
  recentSearches: RecentGlobalCourseSearch[];
  onRecentSearchSelect: (entry: RecentGlobalCourseSearch) => void;
  onRecentSearchDelete: (entry: RecentGlobalCourseSearch) => void;
  recentLabels: string[];
}) {
  return (
    <div className="space-y-8">
      {/* Quick Guide */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-950/50">
            <SearchIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              كيف تبـحث؟
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-400">
              <li>• اكتب اسم المـادة بالعربي أو الإنجليزي أو رمزها مثل CS101</li>
              <li>• اختر الجـامعة لتضييق النتائج (اختياري)</li>
              <li>• اختر التخـصص بعد اختيار الجامعة (اختياري)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900 sm:p-8">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-surface-400 dark:text-surface-500" />
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              عمليات البحث الأخيـرة
            </h3>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {recentSearches.map((entry, index) => (
              <div
                key={`${entry.query}-${entry.universitySlug ?? "all"}-${entry.majorSlug ?? "all"}-${index}`}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 text-sm text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/50 dark:hover:text-primary-300"
              >
                <button
                  type="button"
                  onClick={() => onRecentSearchSelect(entry)}
                  className="flex-1 px-3 py-1.5 text-right"
                >
                  <span className="line-clamp-1">{recentLabels[index]}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecentSearchDelete(entry);
                  }}
                  className="flex h-full items-center px-2 text-surface-400 transition-colors hover:text-red-600 dark:text-surface-500 dark:hover:text-red-400"
                  aria-label="حذف"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GlobalCoursesSearchPage({
  universities,
}: GlobalCoursesSearchPageProps) {
  const searchParams = useSearchParams();

  return (
    <GlobalCoursesSearchPageInner
      universities={universities}
      initialSearchParams={{
        q: searchParams.get("q") ?? undefined,
        university: searchParams.get("university") ?? undefined,
        major: searchParams.get("major") ?? undefined,
      }}
      currentHref={
        searchParams.toString()
          ? `/courses?${searchParams.toString()}`
          : "/courses"
      }
    />
  );
}

function GlobalCoursesSearchPageInner({
  universities,
  initialSearchParams,
  currentHref,
}: GlobalCoursesSearchPageProps & {
  currentHref: string;
}) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const form = useForm({
    defaultValues: {
      query: initialSearchParams.q ?? "",
      universitySlug: initialSearchParams.university ?? "",
      majorSlug: initialSearchParams.major ?? "",
    },
    onSubmit: ({ value }) => {
      const trimmedQuery = value.query.trim();
      if (normalizePublicSearchQuery(trimmedQuery).length === 0) {
        return;
      }

      setDebouncedQueryInput(trimmedQuery);
      captureAnalyticsEvent("course_search_submitted", {
        query: trimmedQuery,
        universitySlug: effectiveUniversitySlug || null,
        majorSlug:
          majors === undefined
            ? selectedMajorSlug || null
            : (selectedMajor?.slug ?? null),
      });
      saveSearch({
        query: trimmedQuery,
        universitySlug: effectiveUniversitySlug || undefined,
        majorSlug:
          majors === undefined
            ? selectedMajorSlug || undefined
            : selectedMajor?.slug,
      });
    },
  });
  const queryInput = useStore(form.store, (state) => state.values.query);
  const selectedUniversitySlug = useStore(
    form.store,
    (state) => state.values.universitySlug,
  );
  const selectedMajorSlug = useStore(
    form.store,
    (state) => state.values.majorSlug,
  );
  const [debouncedQueryInput, setDebouncedQueryInput] = useState(
    initialSearchParams.q ?? "",
  );
  const recentSearches = useSyncExternalStore(
    subscribeRecentGlobalCourseSearches,
    loadRecentGlobalCourseSearches,
    () => EMPTY_RECENT_SEARCHES,
  );
  const nextInitialQuery = initialSearchParams.q ?? "";
  const nextInitialUniversitySlug = initialSearchParams.university ?? "";
  const nextInitialMajorSlug = initialSearchParams.major ?? "";
  const previousHrefRef = useRef(currentHref);

  useEffect(() => {
    if (previousHrefRef.current === currentHref) {
      return;
    }

    previousHrefRef.current = currentHref;

    if (queryInput !== nextInitialQuery) {
      form.setFieldValue("query", nextInitialQuery);
    }

    if (selectedUniversitySlug !== nextInitialUniversitySlug) {
      form.setFieldValue("universitySlug", nextInitialUniversitySlug);
    }

    if (selectedMajorSlug !== nextInitialMajorSlug) {
      form.setFieldValue("majorSlug", nextInitialMajorSlug);
    }

    setDebouncedQueryInput((currentQuery) =>
      currentQuery === nextInitialQuery ? currentQuery : nextInitialQuery,
    );
  }, [
    form,
    currentHref,
    nextInitialMajorSlug,
    nextInitialQuery,
    nextInitialUniversitySlug,
    queryInput,
    selectedMajorSlug,
    selectedUniversitySlug,
  ]);

  const normalizedInput = useMemo(
    () => normalizePublicSearchQuery(queryInput),
    [queryInput],
  );

  const sortedUniversities = useMemo(
    () => universities.toSorted((a, b) => a.order - b.order),
    [universities],
  );
  const universityBySlug = useMemo(
    () =>
      new Map(
        sortedUniversities.map((university) => [
          normalizeSlugLookup(university.slug),
          university,
        ]),
      ),
    [sortedUniversities],
  );

  const selectedUniversity = useMemo(
    () =>
      selectedUniversitySlug
        ? (universityBySlug.get(normalizeSlugLookup(selectedUniversitySlug)) ??
          null)
        : null,
    [selectedUniversitySlug, universityBySlug],
  );

  const queriedMajors = useQuery(
    api.majors.listByUniversity,
    selectedUniversity ? { universityId: selectedUniversity._id } : "skip",
  );
  const majors = queriedMajors as MajorOption[] | undefined;

  const sortedMajors: MajorOption[] = (majors ?? EMPTY_MAJORS).toSorted(
    (a, b) => a.order - b.order,
  );
  const majorBySlug = new Map<string, MajorOption>(
    sortedMajors.map((major) => [normalizeSlugLookup(major.slug), major]),
  );

  const selectedMajor: MajorOption | null =
    selectedMajorSlug && majors !== undefined
      ? (majorBySlug.get(normalizeSlugLookup(selectedMajorSlug)) ?? null)
      : null;

  const recentLabels = recentSearches.map((entry) =>
    formatRecentSearchLabel(entry, universityBySlug, majorBySlug),
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        setDebouncedQueryInput(queryInput.trim());
      },
      normalizedInput.length > 0 ? PUBLIC_SEARCH_CONTRACT.debounceMs : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [queryInput, normalizedInput]);

  const normalizedDebouncedQuery = useMemo(
    () => normalizePublicSearchQuery(debouncedQueryInput),
    [debouncedQueryInput],
  );
  const hasQuery = normalizedDebouncedQuery.length > 0;
  const isDebouncing =
    normalizedInput.length > 0 && queryInput.trim() !== debouncedQueryInput;
  const effectiveUniversitySlug = selectedUniversity?.slug ?? "";
  const effectiveMajorSlug = !effectiveUniversitySlug
    ? ""
    : majors === undefined && selectedMajorSlug
      ? selectedMajorSlug
      : (selectedMajor?.slug ?? "");
  const isMajorPending =
    Boolean(effectiveUniversitySlug) &&
    Boolean(selectedMajorSlug) &&
    majors === undefined;

  const queriedSearchedCourses = useQuery(
    api.courses.searchGlobalPublic,
    hasQuery && !isMajorPending
      ? {
          query: debouncedQueryInput,
          universitySlug: effectiveUniversitySlug || undefined,
          majorSlug: selectedMajor?.slug,
        }
      : "skip",
  );
  const searchedCourses = queriedSearchedCourses as
    | GlobalCourseSearchResult[]
    | undefined;

  const deferredSearchedCourses = useDeferredValue(searchedCourses);
  const activeResults = deferredSearchedCourses ?? EMPTY_RESULTS;

  useEffect(() => {
    const nextHref = buildCoursesSearchHref({
      query: debouncedQueryInput,
      universitySlug: effectiveUniversitySlug || undefined,
      majorSlug:
        majors === undefined ? undefined : effectiveMajorSlug || undefined,
    });

    if (nextHref === currentHref) {
      return;
    }

    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });
  }, [
    currentHref,
    debouncedQueryInput,
    effectiveMajorSlug,
    effectiveUniversitySlug,
    majors,
    router,
  ]);

  const isLoading =
    hasQuery &&
    (isDebouncing ||
      isNavigating ||
      isMajorPending ||
      searchedCourses === undefined);
  const isNoResults = hasQuery && !isLoading && activeResults.length === 0;

  const saveSearch = (entry: RecentGlobalCourseSearch) => {
    const nextRecentSearches = rememberRecentGlobalCourseSearch(
      entry,
      recentSearches,
    );
    saveRecentGlobalCourseSearches(nextRecentSearches);
  };

  const handleRecentSearchSelect = (entry: RecentGlobalCourseSearch) => {
    const nextUniversitySlug = entry.universitySlug ?? "";
    const nextMajorSlug = entry.majorSlug ?? "";

    form.setFieldValue("query", entry.query);
    form.setFieldValue("universitySlug", nextUniversitySlug);
    form.setFieldValue("majorSlug", nextMajorSlug);
    setDebouncedQueryInput(entry.query);
    saveSearch(entry);
  };

  const handleRecentSearchDelete = (entry: RecentGlobalCourseSearch) => {
    const nextRecentSearches = removeRecentGlobalCourseSearch(
      entry,
      recentSearches,
    );
    saveRecentGlobalCourseSearches(nextRecentSearches);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Header Section */}
      <section className="border-b border-surface-200 bg-white px-4 py-8 dark:border-surface-800 dark:bg-surface-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl">
              البحث عن المـواد
            </h1>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 sm:text-base">
              ابحث عن المـواد في جميع الجامعات الأردنية من مكان واحد
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Search Input */}
            <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
              <form.Field name="query">
                {(field) => (
                  <PublicSearchInput
                    label="اسم المـادة أو رمزها"
                    placeholder="مثال: تراكيب البيانـات أو CS201"
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
            </div>

            {/* Filters Row */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              {/* University Select */}
              <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
                <label
                  htmlFor="global-course-search-university"
                  className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400"
                >
                  الجـامعة
                </label>
                <form.Field name="universitySlug">
                  {(field) => (
                    <select
                      id="global-course-search-university"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        form.setFieldValue("majorSlug", "");
                      }}
                      className={getSelectClassName(false)}
                    >
                      <option value="">كل الجـامعات</option>
                      {sortedUniversities.map((university) => (
                        <option key={university._id} value={university.slug}>
                          {university.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              </div>

              {/* Major Select */}
              <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
                <label
                  htmlFor="global-course-search-major"
                  className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400"
                >
                  التخـصص
                </label>
                <form.Field name="majorSlug">
                  {(field) => (
                    <select
                      id="global-course-search-major"
                      value={
                        majors === undefined
                          ? field.state.value
                          : effectiveMajorSlug
                      }
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      disabled={!effectiveUniversitySlug}
                      className={getSelectClassName(!effectiveUniversitySlug)}
                    >
                      <option value="">
                        {effectiveUniversitySlug
                          ? "كل التخـصصات"
                          : "اختر الجـامعة أولاً"}
                      </option>
                      {sortedMajors.map((major) => (
                        <option key={major._id} value={major.slug}>
                          {major.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={normalizedInput.length === 0}
                className="h-full min-h-[56px] rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-surface-300 dark:disabled:bg-surface-700 sm:col-span-2 lg:col-span-1"
              >
                حفظ البـحث
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {!hasQuery ? (
          <EmptyState
            recentSearches={recentSearches}
            onRecentSearchSelect={handleRecentSearchSelect}
            onRecentSearchDelete={handleRecentSearchDelete}
            recentLabels={recentLabels}
          />
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
              />
            ))}
          </div>
        ) : isNoResults ? (
          <div className="rounded-xl border border-surface-200 bg-white p-8 text-center dark:border-surface-700 dark:bg-surface-900">
            <div className="mx-auto w-fit rounded-full bg-surface-100 p-3 dark:bg-surface-800">
              <BookOpenIcon className="h-6 w-6 text-surface-400 dark:text-surface-500" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-surface-900 dark:text-surface-50">
              لا توجد نتائـج
            </h2>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
              جرّب تعديل البـحث أو إزالة الفلاتر
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {activeResults.length} نتيـجة
              </p>
            </div>

            <div className="space-y-3">
              {activeResults.map((course) => (
                <article
                  key={course._id}
                  className="group rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link href={course.href} className="min-w-0 flex-1">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-semibold text-surface-900 group-hover:text-primary-600 dark:text-surface-50 dark:group-hover:text-primary-400">
                          {course.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <span>{course.majorName}</span>
                          <span className="text-surface-300 dark:text-surface-600">
                            •
                          </span>
                          <span>{course.universityName}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <BookmarkToggleButton
                        item={{
                          id: course._id,
                          type: "course",
                          title: course.name,
                          href: course.href,
                          subtitle: `${course.majorName} · ${course.universityName}`,
                          badge: course.courseCode,
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-500 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:border-primary-700 dark:hover:bg-primary-950/50 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950 [&_svg]:h-4 [&_svg]:w-4"
                      />
                      {course.courseCode ? (
                        <span className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                          {course.courseCode}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
