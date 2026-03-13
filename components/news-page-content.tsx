"use client";

import { useEffect, useRef } from "react";
import { usePaginatedQuery } from "convex/react";
import { motion } from "motion/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { NewsCard, type NewsWithAuthor } from "@/components/news-card";

const PAGE_SIZE = 8;

type NewsPageContentProps = {
  majorId: Id<"majors">;
  majorName: string;
  initialItems: NewsWithAuthor[];
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-[24px] border border-surface-200 bg-white/80 dark:border-surface-700 dark:bg-surface-900/80 ${
            index === 0 ? "min-h-[320px] lg:col-span-2" : "min-h-[240px]"
          }`}
        />
      ))}
    </div>
  );
}

export function NewsPageContent({
  majorId,
  majorName,
  initialItems,
}: NewsPageContentProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.news.listByMajor,
    { majorId },
    { initialNumItems: PAGE_SIZE },
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const items =
    results.length > 0 ? (results as NewsWithAuthor[]) : initialItems;
  const isLoadingFirstPage =
    status === "LoadingFirstPage" && initialItems.length === 0;

  useEffect(() => {
    if (status !== "CanLoadMore" || !sentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore(PAGE_SIZE);
        }
      },
      { rootMargin: "280px 0px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, status]);

  if (isLoadingFirstPage) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <LoadingSkeleton />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-[28px] border border-dashed border-surface-300 bg-white/80 p-10 text-center shadow-sm dark:border-surface-700 dark:bg-surface-900/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7H5m14 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7m14 0-1.586-2.379A2 2 0 0015.752 4H8.248a2 2 0 00-1.664.621L5 7m7 4v3m0 0 3-3m-3 3-3-3"
              />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-semibold text-surface-900 dark:text-surface-50">
            لا توجد أخبار حالياً
          </h2>
          <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
            لم يتم نشر أي مستجدات بعد لتخصص {majorName}. عد لاحقاً للاطلاع على
            الإعلانات والتنبيهات الجديدة.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
            تحديثات متجددة
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-surface-950 dark:text-surface-50">
            إعلانات ومستجدات القسم
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-surface-500 dark:text-surface-400">
          يتم ترتيب الأخبار من الأحدث إلى الأقدم، وسيتم تحميل المزيد تلقائياً
          أثناء التمرير لأسفل الصفحة.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((news, index) => (
          <motion.div
            key={news._id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: Math.min(index * 0.05, 0.25),
            }}
            className={index === 0 ? "lg:col-span-2" : ""}
          >
            <NewsCard news={news} featured={index === 0} />
          </motion.div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-3 w-full" aria-hidden />

      {status === "LoadingMore" && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600 dark:border-surface-700 dark:border-t-primary-400" />
          جاري تحميل المزيد من الأخبار...
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            إذا لم يبدأ التحميل تلقائياً، يمكنك المتابعة يدوياً.
          </p>
          <button
            type="button"
            onClick={() => loadMore(PAGE_SIZE)}
            className="rounded-full border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            تحميل المزيد
          </button>
        </div>
      )}

      {status === "Exhausted" && (
        <p className="mt-8 text-center text-sm text-surface-400 dark:text-surface-500">
          وصلت إلى نهاية الأخبار المنشورة لهذا التخصص.
        </p>
      )}
    </section>
  );
}
