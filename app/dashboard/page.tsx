"use client";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { motion } from "motion/react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

type MetricKey =
  | "universitiesTotal"
  | "majorsTotal"
  | "coursesTotal"
  | "visitorsTotal";

type VisitorSeriesPoint = {
  dateKey: string;
  label: string;
  uniqueVisitors: number;
};

type DashboardAnalytics = Record<MetricKey, number> & {
  visitorSeries: VisitorSeriesPoint[];
};

const DEFAULT_ANALYTICS: DashboardAnalytics = {
  universitiesTotal: 0,
  majorsTotal: 0,
  coursesTotal: 0,
  visitorsTotal: 0,
  visitorSeries: [],
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
  {
    key: "visitorsTotal",
    label: "إجمالي الزوار",
    shortLabel: "الزوار",
    hint: "متصفحات فريدة على الصفحات العامة",
    tintClass:
      "from-emerald-100/90 via-emerald-50/85 to-white dark:from-emerald-950/55 dark:via-emerald-900/30 dark:to-surface-900",
    barClass: "from-emerald-600 to-teal-400",
    iconPath:
      "M17 20h5V18a4 4 0 00-5-3.874M17 20H7m10 0v-2c0-.653-.157-1.269-.436-1.813M7 20H2V18a4 4 0 015-3.874M7 20v-2c0-.653.157-1.269.436-1.813m0 0a5.002 5.002 0 019.128 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
];

const ENTITY_CHART_METRICS = KPI_METRICS.filter(
  (metric) => metric.key !== "visitorsTotal",
);

export default function DashboardPage() {
  const { user, sessionToken } = useAuth();
  const isAdmin = user?.role === "admin";

  const majors = useQuery(
    api.dashboard.getMyMajors,
    !isAdmin && user && sessionToken ? { token: sessionToken } : "skip"
  );
  const analytics = useQuery(
    api.dashboard.getAdminDashboardAnalytics,
    isAdmin && sessionToken ? { token: sessionToken, days: 30 } : "skip"
  );

  if (!user) return null;

  if (isAdmin) {
    const resolvedAnalytics = analytics ?? DEFAULT_ANALYTICS;
    const highestEntityValue = Math.max(
      1,
      ...ENTITY_CHART_METRICS.map((metric) => resolvedAnalytics[metric.key])
    );
    const metricCards = KPI_METRICS.map((metric) => ({
      ...metric,
      value: resolvedAnalytics[metric.key],
    }));
    const entityChartBars = ENTITY_CHART_METRICS.map((metric) => {
      const value = resolvedAnalytics[metric.key];
      const heightPercent =
        value === 0
          ? 8
          : Math.max(14, Math.round((value / highestEntityValue) * 100));
      return {
        ...metric,
        value,
        heightPercent,
      };
    });
    const highestVisitorCount = Math.max(
      1,
      ...resolvedAnalytics.visitorSeries.map((point) => point.uniqueVisitors)
    );
    const visitorChartBars = resolvedAnalytics.visitorSeries.map((point) => ({
      ...point,
      heightPercent:
        point.uniqueVisitors === 0
          ? 6
          : Math.max(
              12,
              Math.round((point.uniqueVisitors / highestVisitorCount) * 100)
            ),
    }));
    const visitorPeakPoint =
      resolvedAnalytics.visitorSeries.reduce<VisitorSeriesPoint>(
        (peak, point) =>
          point.uniqueVisitors > peak.uniqueVisitors ? point : peak,
        { dateKey: "", label: "", uniqueVisitors: 0 }
      );
    const midpointIndex = Math.floor(
      Math.max(resolvedAnalytics.visitorSeries.length - 1, 0) / 2
    );
    const hasVisitorData = visitorChartBars.some(
      (point) => point.uniqueVisitors > 0
    );

    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            لوحة التحكم
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            مرحبا، {user.name}. لديك صلاحيات كاملة.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="relative mb-6 overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-l from-white via-primary-50/60 to-primary-100/70 p-5 dark:border-primary-900/50 dark:from-surface-900 dark:via-primary-950/20 dark:to-surface-900 sm:p-6"
        >
          <div className="absolute -top-14 left-0 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-700/10" />
          <div className="relative">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 sm:text-2xl">
              لوحة التحليلات
            </h2>
            <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">
              أرقام حية للمحتوى المنشور وحركة الزوار على الصفحات العامة.
            </p>
          </div>
        </motion.div>

        {analytics === undefined ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              {KPI_METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="h-36 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
                />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-[28px] border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
            <div className="h-80 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 lg:grid-cols-4">
              {metricCards.map((metric, index) => (
                <motion.article
                  key={metric.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + index * 0.08 }}
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
                </motion.article>
              ))}
            </div>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative mb-6 overflow-hidden rounded-[28px] border border-emerald-200/80 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_34%),radial-gradient(circle_at_right,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,1),_rgba(245,255,252,0.98)_45%,_rgba(236,253,245,0.96))] p-5 text-slate-900 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,_rgba(2,6,23,1),_rgba(15,23,42,0.96)_52%,_rgba(6,78,59,0.95))] dark:text-white dark:shadow-[0_24px_60px_-32px_rgba(3,7,18,0.7)] sm:p-6"
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.14),_transparent_65%)] dark:bg-[radial-gradient(circle_at_center,_rgba(45,212,191,0.18),_transparent_65%)]" />
              <div className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full bg-amber-300/25 blur-3xl dark:bg-emerald-400/20" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700/80 dark:text-emerald-200/80">
                      Public traffic
                    </p>
                    <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                      حركة الزوار خلال آخر 30 يوما
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                      المتابعة تعتمد على متصفح فريد لكل يوم، لذلك يظهر المنحنى
                      كثافة الزيارات العامة بدون احتساب صفحات الإدارة.
                    </p>
                  </div>
                  <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-300">إجمالي الزوار</p>
                      <p
                        className={`${firaCode.className} mt-2 text-3xl font-bold`}
                      >
                        {resolvedAnalytics.visitorsTotal}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-300">أعلى يوم</p>
                      <p
                        className={`${firaCode.className} mt-2 text-3xl font-bold`}
                      >
                        {visitorPeakPoint.uniqueVisitors}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">
                        {visitorPeakPoint.label || "لا توجد بيانات بعد"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/80 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_22px_34px_-30px_rgba(15,23,42,0.32)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-inner dark:shadow-black/10 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      عدد الزوار الفريدين لكل يوم
                    </p>
                    <span className="rounded-full border border-emerald-200 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                      آخر 30 يوما
                    </span>
                  </div>

                  {hasVisitorData ? (
                    <>
                      <div
                        className="flex h-52 items-end gap-1.5 sm:gap-2"
                        role="img"
                        aria-label="مخطط أعمدة لعدد الزوار خلال آخر 30 يوما"
                      >
                        {visitorChartBars.map((point) => (
                          <div
                            key={point.dateKey}
                            className="group flex h-full flex-1 items-end"
                            title={`${point.label}: ${point.uniqueVisitors}`}
                          >
                            <div className="relative w-full rounded-t-[14px] bg-emerald-950/5 dark:bg-white/8">
                              <div
                                className="w-full rounded-t-[14px] bg-gradient-to-t from-emerald-500 via-teal-400 to-amber-200 shadow-[0_14px_28px_-14px_rgba(16,185,129,0.55)] transition-all duration-500 motion-reduce:duration-0 dark:from-emerald-300 dark:via-emerald-400 dark:to-teal-200 dark:shadow-[0_14px_28px_-14px_rgba(52,211,153,0.85)]"
                                style={{ height: `${point.heightPercent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
                        <span>{resolvedAnalytics.visitorSeries[0]?.label}</span>
                        <span>
                          {resolvedAnalytics.visitorSeries[midpointIndex]?.label}
                        </span>
                        <span>
                          {
                            resolvedAnalytics.visitorSeries[
                              resolvedAnalytics.visitorSeries.length - 1
                            ]?.label
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-52 items-center justify-center rounded-[20px] border border-dashed border-emerald-200 bg-emerald-50/70 px-6 text-center text-sm text-slate-600 dark:border-white/12 dark:bg-black/10 dark:text-slate-300">
                      سيظهر هذا المخطط بعد تسجيل أول زيارة عامة في التطبيق.
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6"
            >
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
                  {entityChartBars.map((bar) => (
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
            </motion.section>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          مرحبا، {user.name}. {user.role === "admin" ? "لديك صلاحيات كاملة." : "اختر تخصصا لإدارة محتواه."}
        </p>
      </motion.div>

      {/* Majors grid */}
      {majors === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
          ))}
        </div>
      ) : majors.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
            <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">لا توجد تخصصات مخصصة لك</p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">تواصل مع المدير لإضافة صلاحيات</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {majors.map((major: { _id: string; name: string; universityName: string }, index: number) => (
            <motion.div
              key={major._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
            >
            <Link
              href={`/dashboard/major/${major._id}`}
              className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-700 block"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <svg className="h-5 w-5 text-surface-300 transition-colors group-hover:text-primary-400 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">{major.name}</h3>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{major.universityName}</p>
            </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
