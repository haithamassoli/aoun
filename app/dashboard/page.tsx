"use client";

import { useAuth } from "@/components/auth-provider";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { motion } from "motion/react";
import { Toast, useToast } from "@/components/toast";
import { SendNotificationForm } from "@/components/dashboard/send-notification-form";

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

type EntityMetricKey = Exclude<MetricKey, "visitorsTotal">;

type EntitySeriesPoint = {
  dateKey: string;
  label: string;
} & Record<EntityMetricKey, number>;

type VisitorSeriesPoint = {
  dateKey: string;
  label: string;
  uniqueVisitors: number;
};

type DashboardAnalytics = Record<MetricKey, number> & {
  entitySeries: EntitySeriesPoint[];
  visitorSeries: VisitorSeriesPoint[];
};

const DEFAULT_ANALYTICS: DashboardAnalytics = {
  universitiesTotal: 0,
  majorsTotal: 0,
  coursesTotal: 0,
  visitorsTotal: 0,
  entitySeries: [],
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

const ENTITY_CHART_METRICS: Array<{
  key: EntityMetricKey;
  label: string;
  shortLabel: string;
  stroke: string;
  fill: string;
  badgeClass: string;
  panelClass: string;
}> = [
  {
    key: "universitiesTotal",
    label: "إجمالي الجامعات",
    shortLabel: "الجامعات",
    stroke: "#2563eb",
    fill: "rgba(37, 99, 235, 0.16)",
    badgeClass:
      "border-sky-200/80 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100",
    panelClass:
      "from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-400/18 dark:via-sky-400/8 dark:to-transparent",
  },
  {
    key: "majorsTotal",
    label: "إجمالي التخصصات",
    shortLabel: "التخصصات",
    stroke: "#7c3aed",
    fill: "rgba(124, 58, 237, 0.14)",
    badgeClass:
      "border-violet-200/80 bg-violet-500/10 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100",
    panelClass:
      "from-violet-500/15 via-violet-500/5 to-transparent dark:from-violet-400/18 dark:via-violet-400/8 dark:to-transparent",
  },
  {
    key: "coursesTotal",
    label: "إجمالي المواد",
    shortLabel: "المواد",
    stroke: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.14)",
    badgeClass:
      "border-amber-200/80 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100",
    panelClass:
      "from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-400/18 dark:via-amber-400/8 dark:to-transparent",
  },
];

const ENTITY_CHART_WIDTH = 960;
const ENTITY_CHART_HEIGHT = 280;
const ENTITY_CHART_PADDING_X = 28;
const ENTITY_CHART_PADDING_TOP = 16;
const ENTITY_CHART_PADDING_BOTTOM = 36;

type ChartCoordinate = {
  x: number;
  y: number;
};

function buildChartX(index: number, total: number) {
  const drawableWidth = ENTITY_CHART_WIDTH - ENTITY_CHART_PADDING_X * 2;
  if (total <= 1) {
    return ENTITY_CHART_WIDTH / 2;
  }

  return ENTITY_CHART_PADDING_X + (index / (total - 1)) * drawableWidth;
}

function buildChartY(value: number, maxValue: number) {
  const safeMaxValue = Math.max(maxValue, 1);
  const drawableHeight =
    ENTITY_CHART_HEIGHT - ENTITY_CHART_PADDING_TOP - ENTITY_CHART_PADDING_BOTTOM;
  return (
    ENTITY_CHART_HEIGHT -
    ENTITY_CHART_PADDING_BOTTOM -
    (value / safeMaxValue) * drawableHeight
  );
}

function buildSmoothPath(points: ChartCoordinate[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    const midpointX = (currentPoint.x + nextPoint.x) / 2;

    path += ` C ${midpointX} ${currentPoint.y}, ${midpointX} ${nextPoint.y}, ${nextPoint.x} ${nextPoint.y}`;
  }

  return path;
}

function buildAreaPath(points: ChartCoordinate[]) {
  if (points.length === 0) {
    return "";
  }

  const baselineY = ENTITY_CHART_HEIGHT - ENTITY_CHART_PADDING_BOTTOM;
  return `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
}

function buildChartTicks(maxValue: number) {
  if (maxValue <= 3) {
    return [maxValue, Math.max(maxValue - 1, 0), Math.max(maxValue - 2, 0), 0];
  }

  return [
    maxValue,
    Math.round(maxValue * 0.66),
    Math.round(maxValue * 0.33),
    0,
  ];
}

function formatSignedDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  if (value < 0) {
    return `${value}`;
  }

  return "0";
}

export default function DashboardPage() {
  const { user, sessionToken } = useAuth();
  const isAdmin = user?.role === "admin";
  const toast = useToast();

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
    const metricCards = KPI_METRICS.map((metric) => ({
      ...metric,
      value: resolvedAnalytics[metric.key],
    }));
    const firstEntityPoint = resolvedAnalytics.entitySeries[0];
    const latestEntityPoint =
      resolvedAnalytics.entitySeries[resolvedAnalytics.entitySeries.length - 1];
    const highestEntityGrowthValue = Math.max(
      1,
      ...resolvedAnalytics.entitySeries.flatMap((point) =>
        ENTITY_CHART_METRICS.map((metric) =>
          Math.max(point[metric.key] - (firstEntityPoint?.[metric.key] ?? 0), 0)
        )
      )
    );
    const entityChartTicks = buildChartTicks(highestEntityGrowthValue);
    const entityMidpointIndex = Math.floor(
      Math.max(resolvedAnalytics.entitySeries.length - 1, 0) / 2
    );
    const entityChartSeries = ENTITY_CHART_METRICS.map((metric) => {
      const startingValue = firstEntityPoint?.[metric.key] ?? 0;
      const coordinates = resolvedAnalytics.entitySeries.map((point, index) => ({
        x: buildChartX(index, resolvedAnalytics.entitySeries.length),
        y: buildChartY(
          Math.max(point[metric.key] - startingValue, 0),
          highestEntityGrowthValue
        ),
      }));
      const currentValue = latestEntityPoint?.[metric.key] ?? 0;

      return {
        ...metric,
        currentValue,
        delta: currentValue - startingValue,
        linePath: buildSmoothPath(coordinates),
        areaPath: buildAreaPath(coordinates),
        lastCoordinate: coordinates[coordinates.length - 1],
      };
    });
    const entityLatestX =
      resolvedAnalytics.entitySeries.length > 0
        ? buildChartX(
            resolvedAnalytics.entitySeries.length - 1,
            resolvedAnalytics.entitySeries.length
          )
        : ENTITY_CHART_WIDTH - ENTITY_CHART_PADDING_X;
    const hasEntityGrowthData = entityChartSeries.some(
      (series) => series.delta > 0
    );
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
        <Toast toast={toast} />
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
              className="relative overflow-hidden rounded-[28px] border border-sky-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,1),_rgba(248,250,252,0.98)_44%,_rgba(239,246,255,0.96))] p-5 text-slate-900 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(135deg,_rgba(2,6,23,1),_rgba(15,23,42,0.96)_50%,_rgba(30,41,59,0.95))] dark:text-white dark:shadow-[0_24px_60px_-32px_rgba(3,7,18,0.7)] sm:p-6"
            >
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.14),_transparent_68%)] dark:bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),_transparent_68%)]" />
              <div className="pointer-events-none absolute -bottom-14 left-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-400/12" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700/80 dark:text-sky-200/80">
                      Entity tempo
                    </p>
                    <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                      نمو الكيانات خلال آخر 30 يوما
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                      كل خط يبدأ من نقطة بداية الفترة نفسها، لذلك يظهر صافي
                      النمو اليومي للجامعات والتخصصات والمواد بدل تكرار الأرقام
                      الإجمالية في مخطط ثابت.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/72 px-4 py-3 text-sm shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      النافذة الزمنية
                    </p>
                    <p className="mt-1 font-semibold">
                      آخر 30 يوما حتى{" "}
                      {latestEntityPoint?.label ??
                        resolvedAnalytics.entitySeries[
                          resolvedAnalytics.entitySeries.length - 1
                        ]?.label ??
                        "اليوم"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-[24px] border border-white/80 bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_22px_34px_-30px_rgba(15,23,42,0.32)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-inner dark:shadow-black/10 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {entityChartSeries.map((series) => (
                        <div
                          key={series.key}
                          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: series.stroke }}
                          />
                          <span>{series.shortLabel}</span>
                          <span
                            className={`${firaCode.className} text-[11px] font-semibold`}
                          >
                            {series.currentValue}
                          </span>
                        </div>
                      ))}
                    </div>

                    {hasEntityGrowthData ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-[44px_minmax(0,1fr)]">
                          <div className="flex h-[280px] flex-col justify-between pb-9 text-[11px] text-slate-500 dark:text-slate-300">
                            {entityChartTicks.map((tick, index) => (
                              <span
                                key={`${tick}-${index}`}
                                className={index === entityChartTicks.length - 1 ? "translate-y-1" : ""}
                              >
                                {tick}
                              </span>
                            ))}
                          </div>

                          <div
                            className="relative"
                            role="img"
                            aria-label="مخطط زمني لصافي نمو الجامعات والتخصصات والمواد خلال آخر 30 يوما"
                          >
                            <div
                              className="pointer-events-none absolute inset-y-0 w-px bg-slate-900/10 dark:bg-white/10"
                              style={{
                                left: `${(entityLatestX / ENTITY_CHART_WIDTH) * 100}%`,
                              }}
                            />
                            <svg
                              viewBox={`0 0 ${ENTITY_CHART_WIDTH} ${ENTITY_CHART_HEIGHT}`}
                              className="h-[280px] w-full overflow-visible"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                {entityChartSeries.map((series) => (
                                  <linearGradient
                                    key={series.key}
                                    id={`entity-series-${series.key}`}
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor={series.stroke}
                                      stopOpacity="0.38"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={series.stroke}
                                      stopOpacity="0"
                                    />
                                  </linearGradient>
                                ))}
                              </defs>

                              {entityChartTicks.map((_, index) => {
                                const progress =
                                  index / (entityChartTicks.length - 1);
                                const y =
                                  ENTITY_CHART_PADDING_TOP +
                                  progress *
                                    (ENTITY_CHART_HEIGHT -
                                      ENTITY_CHART_PADDING_TOP -
                                      ENTITY_CHART_PADDING_BOTTOM);

                                return (
                                  <line
                                    key={index}
                                    x1={ENTITY_CHART_PADDING_X}
                                    x2={ENTITY_CHART_WIDTH - ENTITY_CHART_PADDING_X}
                                    y1={y}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeDasharray="6 10"
                                    strokeOpacity="0.12"
                                  />
                                );
                              })}

                              {entityChartSeries.map((series) => (
                                <path
                                  key={`${series.key}-area`}
                                  d={series.areaPath}
                                  fill={`url(#entity-series-${series.key})`}
                                />
                              ))}

                              {entityChartSeries.map((series) => (
                                <path
                                  key={`${series.key}-line`}
                                  d={series.linePath}
                                  fill="none"
                                  stroke={series.stroke}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="4"
                                />
                              ))}

                              {entityChartSeries.map(
                                (series) =>
                                  series.lastCoordinate && (
                                    <g key={`${series.key}-dot`}>
                                      <circle
                                        cx={series.lastCoordinate.x}
                                        cy={series.lastCoordinate.y}
                                        fill={series.stroke}
                                        opacity="0.24"
                                        r="11"
                                      />
                                      <circle
                                        cx={series.lastCoordinate.x}
                                        cy={series.lastCoordinate.y}
                                        fill={series.stroke}
                                        r="5.5"
                                        stroke="white"
                                        strokeWidth="3"
                                      />
                                    </g>
                                  )
                              )}
                            </svg>
                          </div>
                        </div>

                        <div
                          dir="ltr"
                          className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300"
                        >
                          <span>{resolvedAnalytics.entitySeries[0]?.label}</span>
                          <span>
                            {
                              resolvedAnalytics.entitySeries[entityMidpointIndex]
                                ?.label
                            }
                          </span>
                          <span>
                            {
                              resolvedAnalytics.entitySeries[
                                resolvedAnalytics.entitySeries.length - 1
                              ]?.label
                            }
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center rounded-[20px] border border-dashed border-sky-200 bg-sky-50/70 px-6 text-center text-sm text-slate-600 dark:border-white/12 dark:bg-black/10 dark:text-slate-300">
                        لا توجد إضافات جديدة خلال هذه النافذة الزمنية. ما زالت
                        البطاقات على اليمين تعرض الإجمالي الحالي ونقطة بداية
                        الفترة لكل نوع.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {entityChartSeries.map((series) => (
                      <div
                        key={series.key}
                        className={`overflow-hidden rounded-[22px] border border-white/75 bg-gradient-to-br ${series.panelClass} p-4 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {series.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                              التغير خلال الفترة الحالية
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${series.badgeClass}`}
                          >
                            {series.shortLabel}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div>
                            <p
                              className={`${firaCode.className} text-3xl font-bold text-slate-900 dark:text-white`}
                            >
                              {series.currentValue}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                              {series.delta === 0
                                ? "بدون زيادة خلال النافذة الحالية"
                                : `صافي ${formatSignedDelta(series.delta)} خلال آخر 30 يوما`}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-right shadow-sm dark:border-white/10 dark:bg-black/10">
                            <p className="text-[11px] text-slate-500 dark:text-slate-300">
                              بداية الفترة
                            </p>
                            <p
                              className={`${firaCode.className} mt-1 text-sm font-semibold text-slate-900 dark:text-white`}
                            >
                              {firstEntityPoint?.[series.key] ?? 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.46 }}
              className="mt-6 overflow-hidden rounded-[28px] border border-primary-200/70 bg-gradient-to-br from-white via-primary-50/40 to-white p-5 dark:border-primary-900/50 dark:from-surface-900 dark:via-primary-950/20 dark:to-surface-900 sm:p-6"
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                  إرسال إشعار مخصص
                </h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  أرسل إشعارا مباشرا لجميع المشتركين أو لمشتركي تخصص محدد.
                </p>
              </div>
              <SendNotificationForm showToast={(msg, type) => toast.show(msg, type)} />
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
