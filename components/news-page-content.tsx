"use client";

import { usePaginatedQuery } from "convex/react";
import { motion } from "motion/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NewsWithAuthor } from "@/components/news-card";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";

const LOAD_MORE_SIZE = 8;

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
  }).format(new Date(timestamp));
}

function NewsItemCard({
  news,
  index,
}: {
  news: NewsWithAuthor;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group rounded-2xl border border-surface-200 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800"
    >
      <div className="flex items-start gap-3">
        {/* Date badge */}
        <div className="shrink-0 text-center">
          <span className="block text-[11px] font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            {new Intl.DateTimeFormat("ar-JO", { month: "short" }).format(
              new Date(news.createdAt),
            )}
          </span>
          <span className="block text-xl font-bold leading-none text-surface-800 dark:text-surface-100">
            {new Intl.DateTimeFormat("ar-JO", { day: "numeric" }).format(
              new Date(news.createdAt),
            )}
          </span>
        </div>

        {/* Divider */}
        <div className="mt-1 h-10 w-px shrink-0 bg-surface-200 dark:bg-surface-700" />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-surface-900 transition-colors group-hover:text-primary-700 dark:text-surface-50 dark:group-hover:text-primary-300">
            {news.title}
          </h2>
          {news.content && (
            <div
              className="prose prose-sm mt-2 max-w-none break-words text-surface-600 line-clamp-3 [overflow-wrap:anywhere] [&_a]:break-all [&_a]:text-primary-600 dark:text-surface-400 dark:[&_a]:text-primary-400"
              dir="rtl"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(news.content),
              }}
            />
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
            <svg
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span>{news.authorName}</span>
            <span className="text-surface-300 dark:text-surface-600">·</span>
            <span>{formatDate(news.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white/90 p-5 dark:border-surface-700 dark:bg-surface-900">
      <div className="flex items-start gap-3">
        <div className="shrink-0 space-y-1.5">
          <div className="h-3 w-8 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-6 w-8 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
        <div className="mt-1 h-10 w-px shrink-0 bg-surface-200 dark:bg-surface-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-3 w-full animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
    </div>
  );
}

type NewsPageContentProps = {
  majorId: Id<"majors">;
  initialNews: {
    page: NewsWithAuthor[];
    isDone: boolean;
    continueCursor: string;
  };
};

export function NewsPageContent({ majorId, initialNews }: NewsPageContentProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.news.listByMajor,
    { majorId },
    { initialNumItems: initialNews.page.length || LOAD_MORE_SIZE },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-surface-200 bg-white/90 p-16 text-center dark:border-surface-700 dark:bg-surface-900"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
          <svg
            className="h-6 w-6 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
          لا توجد أخبار حالياً
        </p>
        <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
          سيتم نشر الأخبار والمستجدات هنا
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {(results as NewsWithAuthor[]).map((news, index) => (
        <NewsItemCard key={news._id} news={news} index={index} />
      ))}

      {status === "CanLoadMore" && (
        <div className="pt-2 text-center">
          <button
            onClick={() => loadMore(LOAD_MORE_SIZE)}
            className="rounded-xl border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-surface-600 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-primary-700 dark:hover:bg-primary-950 dark:hover:text-primary-300"
          >
            تحميل المزيد
          </button>
        </div>
      )}

      {status === "LoadingMore" && (
        <div className="pt-2 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" />
        </div>
      )}
    </div>
  );
}
