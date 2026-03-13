"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "motion/react";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";

type NewsItem = {
  _id: Id<"news">;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

type NewsListProps = {
  majorId: Id<"majors">;
  onEdit: (news: NewsItem) => void;
  onDelete: (news: NewsItem) => void;
  deleting: string | null;
};

export function NewsList({ majorId, onEdit, onDelete, deleting }: NewsListProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.news.listByMajor,
    { majorId },
    { initialNumItems: 10 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
          <svg
            className="h-6 w-6 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
          لا توجد أخبار
        </p>
        <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
          أضف خبراً جديداً للبدء
        </p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ar", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      {results.map((news, index: number) => (
        <motion.div
          key={news._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: Math.min(index * 0.04, 0.2),
          }}
          className="group rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {news.title}
                </h3>
                <span className="text-[10px] text-surface-400 dark:text-surface-500">
                  {formatDate(news.createdAt)}
                </span>
              </div>
              {news.content && (
                <div
                  className="prose prose-sm max-w-none break-words text-surface-700 line-clamp-2 [overflow-wrap:anywhere] [&_a]:break-all [&_a]:text-primary-600 [&_a]:[overflow-wrap:anywhere] dark:text-surface-300 dark:[&_a]:text-primary-400"
                  dir="rtl"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(news.content),
                  }}
                />
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(news as NewsItem)}
                className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                title="تعديل"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(news as NewsItem)}
                disabled={deleting === news._id}
                className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                title="حذف"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {status === "CanLoadMore" && (
        <div className="pt-2 text-center">
          <button
            onClick={() => loadMore(10)}
            className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
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
