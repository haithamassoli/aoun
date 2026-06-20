"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import { decodeSlugParam } from "@/lib/slug";

type UniversityListItem = {
  _id: Id<"universities">;
  slug: string;
  logoUrl?: string;
  name: string;
  order: number;
};

export function UniversitiesSearchSection({
  universities,
}: {
  universities: UniversityListItem[];
}) {
  const search = useDebouncedPublicSearch();

  const searchedUniversities = useQuery(
    api.universities.searchPublic,
    search.isEmpty ? "skip" : { query: search.query },
  );

  const defaultUniversities = universities.toSorted(
    (a, b) => a.order - b.order,
  );
  const activeUniversities = search.isEmpty
    ? defaultUniversities
    : (searchedUniversities ?? []);

  const isLoading =
    !search.isEmpty &&
    (search.isDebouncing || searchedUniversities === undefined);
  const isNoResults =
    !search.isEmpty && !isLoading && activeUniversities.length === 0;
  const isEmptyList = search.isEmpty && defaultUniversities.length === 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-8 space-y-4">
        <h2 className="public-section-title text-center text-2xl font-bold text-surface-800 dark:text-surface-100 sm:text-3xl">
          الجامعات
        </h2>

        <div className="mx-auto max-w-2xl">
          <PublicSearchInput
            label="ابحث عن الجامعة"
            placeholder="مثال: الجامعة الأردنية"
            value={search.input}
            onChange={search.setInput}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
            />
          ))}
        </div>
      ) : isNoResults ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-surface-200 bg-white p-8 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-base font-semibold text-surface-700 dark:text-surface-200">
            لا توجد نتائج مطابقة
          </p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            لم نعثر على جامعة تطابق «{search.query}».
          </p>
        </div>
      ) : isEmptyList ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-surface-200 bg-white p-8 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-base font-semibold text-surface-700 dark:text-surface-200">
            لا توجد جامعات متاحة حالياً
          </p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            سيتم عرض الجامعات هنا فور إضافتها.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {activeUniversities.map((uni: UniversityListItem) => (
            <Link
              key={uni._id}
              href={`/${decodeSlugParam(uni.slug)}`}
              className="public-elevated-surface public-interactive-card group flex flex-col items-center gap-4 rounded-[1.7rem] p-8"
            >
              {uni.logoUrl ? (
                <Image
                  src={uni.logoUrl}
                  alt={uni.name}
                  width={80}
                  height={80}
                  unoptimized
                  sizes="80px"
                  className="h-20 w-20 rounded-xl object-contain"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  {decodeSlugParam(uni.slug).toUpperCase().slice(0, 4)}
                </div>
              )}
              <h3 className="text-center text-lg font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                {uni.name}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}