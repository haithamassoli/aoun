"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import { decodeSlugParam } from "@/lib/slug";

type MajorListItem = {
  _id: Id<"majors">;
  name: string;
  slug: string;
  order: number;
};

export function MajorsSearchSection({
  universityId,
  universitySlug,
  majors,
}: {
  universityId: Id<"universities">;
  universitySlug: string;
  majors: MajorListItem[];
}) {
  const search = useDebouncedPublicSearch();

  const searchedMajors = useQuery(
    api.majors.searchByUniversity,
    search.isEmpty ? "skip" : { universityId, query: search.query },
  );

  const defaultMajors = majors.toSorted((a, b) => a.order - b.order);
  const activeMajors = search.isEmpty ? defaultMajors : (searchedMajors ?? []);

  const isLoading =
    !search.isEmpty && (search.isDebouncing || searchedMajors === undefined);
  const isNoResults =
    !search.isEmpty && !isLoading && activeMajors.length === 0;
  const isEmptyList = search.isEmpty && defaultMajors.length === 0;

  return (
    <section
      id="majors"
      className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100 sm:text-2xl">
          التخصصات
        </h2>

        <div className="max-w-2xl">
          <PublicSearchInput
            label="ابحث داخل تخصصات الجامعة"
            placeholder="مثال: هندسة الحاسوب"
            value={search.input}
            onChange={search.setInput}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            لم نعثر على تخصص يطابق «{search.query}» داخل هذه الجامعة.
          </p>
        </div>
      ) : isEmptyList ? (
        <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-surface-500 dark:text-surface-400">
            لم تُضاف تخصصات بعد. ترقبوا التحديثات!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeMajors.map((major: MajorListItem) => (
            <Link
              key={major._id}
              href={`/${universitySlug}/${decodeSlugParam(major.slug)}`}
              className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-lg font-bold text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
                {decodeSlugParam(major.slug).toUpperCase().slice(0, 4)}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                  {major.name}
                </h3>
              </div>
              <svg
                className="ms-auto h-5 w-5 shrink-0 rotate-180 text-surface-400 transition-colors group-hover:text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
