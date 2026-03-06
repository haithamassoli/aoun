"use client";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Fira_Code } from "next/font/google";
import Link from "next/link";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

type MetricKey = "universitiesTotal" | "majorsTotal" | "coursesTotal";
type AnalyticsTotals = Record<MetricKey, number>;

const DEFAULT_TOTALS: AnalyticsTotals = {
  universitiesTotal: 0,
  majorsTotal: 0,
  coursesTotal: 0,
};

const KPI_METRICS: Array<{
  key: MetricKey;
  label: string;
  shortLabel: string;
  hint: string;
  tintClass: string;
  barClass: string;
  iconPath: string;
}> = [
  {
    key: "universitiesTotal",
    label: "إجمالي الجامعات",
    shortLabel: "الجامعات",
    hint: "الجامعات غير المحذوفة",
    tintClass:
      "from-primary-100/90 via-primary-50/80 to-white dark:from-primary-950/60 dark:via-primary-900/30 dark:to-surface-900",
    barClass: "from-primary-700 to-primary-500",
    iconPath:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    key: "majorsTotal",
    label: "إجمالي التخصصات",
    shortLabel: "التخصصات",
    hint: "التخصصات غير المحذوفة",
    tintClass:
      "from-primary-200/80 via-primary-100/70 to-white dark:from-primary-900/40 dark:via-primary-950/30 dark:to-surface-900",
    barClass: "from-primary-600 to-primary-400",
    iconPath:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    key: "coursesTotal",
    label: "إجمالي المواد",
    shortLabel: "المواد",
    hint: "المواد غير المحذوفة",
    tintClass:
      "from-amber-100/90 via-amber-50/80 to-white dark:from-amber-950/50 dark:via-amber-900/30 dark:to-surface-900",
    barClass: "from-amber-600 to-amber-400",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

export default function AdminAnalyticsPage() {
  const { user, sessionToken } = useAuth();

  const totals = useQuery(
    api.dashboard.getAdminAnalyticsTotals,
    user?.role === "admin" && sessionToken ? { token: sessionToken } : "skip"
  );

  if (!user || user.role !== "admin") {
    return null;
  }

  const resolvedTotals = totals ?? DEFAULT_TOTALS;
  const highestValue = Math.max(
    1,
    ...KPI_METRICS.map((metric) => resolvedTotals[metric.key])
  );
  const chartBars = KPI_METRICS.map((metric) => {
    const value = resolvedTotals[metric.key];
    const heightPercent =
      value === 0 ? 8 : Math.max(14, Math.round((value / highestValue) * 100));
    return {
      ...metric,
      value,
      heightPercent,
    };
  });

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
        <Link
          href="/dashboard"
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          لوحة التحكم
        </Link>
        <svg
          className="h-3.5 w-3.5 rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-surface-900 dark:text-surface-50">
          التحليلات
        </span>
      </nav>

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-l from-white via-primary-50/60 to-primary-100/70 p-5 dark:border-primary-900/50 dark:from-surface-900 dark:via-primary-950/20 dark:to-surface-900 sm:p-6">
        <div className="absolute -top-14 left-0 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-700/10" />
        <div className="relative">
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 sm:text-2xl">
            لوحة التحليلات
          </h1>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">
            أرقام حية لإجمالي الجامعات والتخصصات والمواد غير المحذوفة.
          </p>
        </div>
      </div>

      {totals === undefined ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {KPI_METRICS.map((metric) => (
              <div
                key={metric.key}
                className="h-36 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {chartBars.map((metric) => (
              <article
                key={metric.key}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 motion-reduce:transform-none"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${metric.tintClass}`}
                />
                <div className="relative p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-300">
                      {metric.shortLabel}
                    </span>
                    <span className="rounded-lg border border-white/60 bg-white/80 p-1.5 text-surface-500 shadow-sm dark:border-surface-700 dark:bg-surface-900/90 dark:text-surface-300">
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
                          d={metric.iconPath}
                        />
                      </svg>
                    </span>
                  </div>
                  <p
                    className={`${firaCode.className} text-3xl font-bold text-surface-900 dark:text-surface-50`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                    {metric.hint}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50 sm:text-lg">
                مقارنة الكيانات
              </h2>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/70 dark:text-primary-300">
                تحديث مباشر
              </span>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              مخطط أعمدة واحد يعرض نفس بيانات بطاقات المؤشرات.
            </p>

            <div className="relative mt-6">
              <div className="pointer-events-none absolute inset-0 grid grid-rows-4">
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-surface-200 dark:border-surface-700"
                  />
                ))}
              </div>

              <div
                className="relative grid grid-cols-3 gap-3 sm:gap-6"
                role="img"
                aria-label="مخطط أعمدة لإجمالي الجامعات والتخصصات والمواد"
              >
                {chartBars.map((bar) => (
                  <div key={bar.key} className="flex flex-col items-center">
                    <div className="relative flex h-56 w-full max-w-28 items-end rounded-xl border border-surface-200/80 bg-gradient-to-b from-surface-50 to-white p-2 dark:border-surface-700 dark:from-surface-800 dark:to-surface-900">
                      <div
                        className={`w-full rounded-lg bg-gradient-to-b ${bar.barClass} shadow-[0_10px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-500 motion-reduce:duration-0`}
                        style={{ height: `${bar.heightPercent}%` }}
                      />
                      <span
                        className={`${firaCode.className} absolute bottom-3 right-0 left-0 text-center text-xs font-semibold text-surface-800 dark:text-surface-100`}
                      >
                        {bar.value}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-surface-700 dark:text-surface-200 sm:text-sm">
                      {bar.shortLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
