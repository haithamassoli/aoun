"use client";

import { Fira_Code } from "next/font/google";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type PageViewSeriesPoint = {
  dateKey: string;
  label: string;
  pageViews: number;
  uniqueVisitors: number;
};

type TopPage = {
  pathname: string;
  label: string;
  pageType: string;
  pageTypeLabel: string;
  pageViews: number;
  uniqueVisitors: number;
};

type TopTransition = {
  fromPathname: string;
  fromLabel: string;
  toPathname: string;
  toLabel: string;
  count: number;
};

type PageTypeTraffic = {
  pageType: string;
  label: string;
  pageViews: number;
  uniqueVisitors: number;
};

export type DashboardAnalytics = Record<MetricKey, number> & {
  pageViewsTotal: number;
  entitySeries: EntitySeriesPoint[];
  visitorSeries: VisitorSeriesPoint[];
  pageViewSeries: PageViewSeriesPoint[];
  topPages: TopPage[];
  topTransitions: TopTransition[];
  trafficByPageType: PageTypeTraffic[];
};

export const DEFAULT_DASHBOARD_ANALYTICS: DashboardAnalytics = {
  universitiesTotal: 0,
  majorsTotal: 0,
  coursesTotal: 0,
  visitorsTotal: 0,
  pageViewsTotal: 0,
  entitySeries: [],
  visitorSeries: [],
  pageViewSeries: [],
  topPages: [],
  topTransitions: [],
  trafficByPageType: [],
};

const KPI_CARDS: Array<{
  key: keyof Pick<
    DashboardAnalytics,
    | "universitiesTotal"
    | "majorsTotal"
    | "coursesTotal"
    | "visitorsTotal"
    | "pageViewsTotal"
  >;
  label: string;
  hint: string;
  accentClass: string;
}> = [
  {
    key: "universitiesTotal",
    label: "الجامعات",
    hint: "المعروضة حاليًا",
    accentClass:
      "bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:bg-sky-400/10 dark:text-sky-200",
  },
  {
    key: "majorsTotal",
    label: "التخصصات",
    hint: "ضمن المنصة",
    accentClass:
      "bg-violet-500/10 text-violet-700 ring-violet-500/15 dark:bg-violet-400/10 dark:text-violet-200",
  },
  {
    key: "coursesTotal",
    label: "المواد",
    hint: "ذات صفحات عامة",
    accentClass:
      "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:bg-amber-400/10 dark:text-amber-200",
  },
  {
    key: "visitorsTotal",
    label: "الزوار الفريدون",
    hint: "منذ بدء التتبع",
    accentClass:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:bg-emerald-400/10 dark:text-emerald-200",
  },
  {
    key: "pageViewsTotal",
    label: "مشاهدات الصفحات",
    hint: "آخر 30 يومًا",
    accentClass:
      "bg-primary-500/10 text-primary-700 ring-primary-500/15 dark:bg-primary-400/10 dark:text-primary-200",
  },
];

const PAGE_TYPE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#f59e0b",
  "#059669",
  "#db2777",
  "#0891b2",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-JO").format(value);
}

function formatAverage(value: number, days: number) {
  if (days === 0) {
    return "0";
  }

  return new Intl.NumberFormat("ar-JO", {
    maximumFractionDigits: value < days ? 1 : 0,
  }).format(value / days);
}

function formatTooltipLabel(name: string) {
  switch (name) {
    case "pageViews":
      return "مشاهدات الصفحات";
    case "uniqueVisitors":
      return "الزوار الفريدون";
    default:
      return name;
  }
}

function shortenLabel(label: string, maxLength = 26) {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}…`;
}

function buildTransitionLabel(transition: TopTransition) {
  return `${transition.fromLabel} -> ${transition.toLabel}`;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-surface-200 bg-surface-50/70 px-6 text-center dark:border-surface-700 dark:bg-surface-900/50">
      <div>
        <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
          {title}
        </p>
        <p className="mt-2 max-w-lg text-sm leading-6 text-surface-500 dark:text-surface-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionFrame({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 sm:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AdminDashboardOverview({
  analytics,
}: {
  analytics: DashboardAnalytics | undefined;
}) {
  if (analytics === undefined) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-5">
          {KPI_CARDS.map((card) => (
            <Skeleton
              key={card.key}
              className="h-28 rounded-3xl border border-surface-200 dark:border-surface-700"
            />
          ))}
        </div>
        <Skeleton className="h-[440px] rounded-[28px] border border-surface-200 dark:border-surface-700" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[360px] rounded-[28px] border border-surface-200 dark:border-surface-700" />
          <Skeleton className="h-[360px] rounded-[28px] border border-surface-200 dark:border-surface-700" />
        </div>
        <Skeleton className="h-[320px] rounded-[28px] border border-surface-200 dark:border-surface-700" />
      </div>
    );
  }

  const series = analytics.pageViewSeries;
  const hasPageLevelData =
    analytics.pageViewsTotal > 0 ||
    analytics.topPages.length > 0 ||
    analytics.topTransitions.length > 0;
  const totalTrackedDays = series.length;
  const averageDailyViews = formatAverage(
    analytics.pageViewsTotal,
    totalTrackedDays,
  );
  const peakTrafficDay = series.reduce<PageViewSeriesPoint>(
    (peak, point) => (point.pageViews > peak.pageViews ? point : peak),
    { dateKey: "", label: "", pageViews: 0, uniqueVisitors: 0 },
  );
  const topPage = analytics.topPages[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-5">
        {KPI_CARDS.map((card, index) => (
          <motion.article
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05 + index * 0.04 }}
            className="overflow-hidden rounded-[26px] border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900"
          >
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${card.accentClass}`}
            >
              {card.label}
            </span>
            <p
              className={`${firaCode.className} mt-4 text-3xl font-bold text-surface-900 dark:text-surface-50`}
            >
              {formatNumber(analytics[card.key])}
            </p>
            <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
              {card.hint}
            </p>
          </motion.article>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.18 }}
      >
        <SectionFrame
          title="حركة الزوار ومشاهدات الصفحات"
          description="المخطط يجمع بين مشاهدات الصفحات والزوار الفريدين يوميًا، حتى تعرف إن كانت الزيادة ناتجة عن اتساع الوصول أو عن عمق التصفح."
        >
          <div className="mb-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-700 dark:bg-surface-950/60">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                متوسط المشاهدات اليومي
              </p>
              <p
                className={`${firaCode.className} mt-2 text-2xl font-bold text-surface-900 dark:text-surface-50`}
              >
                {averageDailyViews}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-700 dark:bg-surface-950/60">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                أعلى يوم مشاهدة
              </p>
              <p
                className={`${firaCode.className} mt-2 text-2xl font-bold text-surface-900 dark:text-surface-50`}
              >
                {formatNumber(peakTrafficDay.pageViews)}
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                {peakTrafficDay.label || "لا توجد بيانات بعد"}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-700 dark:bg-surface-950/60">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                الصفحة الأبرز
              </p>
              <p className="mt-2 text-base font-semibold text-surface-900 dark:text-surface-50">
                {topPage?.label ?? "بانتظار أول بيانات تفصيلية"}
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                {topPage
                  ? `${formatNumber(topPage.pageViews)} مشاهدة`
                  : "سيظهر هنا أكثر محتوى تتم زيارته"}
              </p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid rgba(148,163,184,0.25)",
                    boxShadow: "0 18px 40px -28px rgba(15,23,42,0.45)",
                  }}
                  formatter={(value, name) => [
                    formatNumber(Number(value ?? 0)),
                    formatTooltipLabel(String(name)),
                  ]}
                />
                <Bar
                  dataKey="pageViews"
                  fill="#93c5fd"
                  radius={[10, 10, 0, 0]}
                  barSize={18}
                  name="pageViews"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  name="uniqueVisitors"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-surface-500 dark:text-surface-400">
            إذا كانت أعمدة المشاهدات أعلى بكثير من خط الزوار، فهذا يعني أن الزائر الواحد يتنقل بين أكثر من صفحة في الجلسة نفسها.
          </p>
        </SectionFrame>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.24 }}
        >
          <SectionFrame
            title="الصفحات الأكثر مشاهدة"
            description="ترتيب مباشر للصفحات العامة التي تستحوذ على الاهتمام الآن، مع عدد الزوار الفريدين لكل صفحة."
          >
            {analytics.topPages.length > 0 ? (
              <>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.topPages.map((item) => ({
                        ...item,
                        shortLabel: shortenLabel(item.label),
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 24, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="rgba(148, 163, 184, 0.18)"
                        horizontal={false}
                      />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="shortLabel"
                        tickLine={false}
                        axisLine={false}
                        width={122}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                        contentStyle={{
                          borderRadius: 18,
                          border: "1px solid rgba(148,163,184,0.25)",
                          boxShadow: "0 18px 40px -28px rgba(15,23,42,0.45)",
                        }}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.label ?? ""
                        }
                        formatter={(value, name) => [
                          formatNumber(Number(value ?? 0)),
                          name === "uniqueVisitors"
                            ? "الزوار الفريدون"
                            : "المشاهدات",
                        ]}
                      />
                      <Bar
                        dataKey="pageViews"
                        fill="#2563eb"
                        radius={[0, 12, 12, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {analytics.topPages.map((page) => (
                    <div
                      key={page.pathname}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-surface-50/80 px-4 py-3 dark:border-surface-700 dark:bg-surface-950/60"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                            {page.label}
                          </p>
                          <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[11px] text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                            {page.pageTypeLabel}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-surface-500 dark:text-surface-400">
                          {page.pathname}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className={`${firaCode.className} text-sm font-semibold text-surface-900 dark:text-surface-50`}>
                          {formatNumber(page.pageViews)}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {formatNumber(page.uniqueVisitors)} زائر
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="لا توجد صفحات متصدرة بعد"
                description="سيظهر هذا القسم بعد وصول أول مشاهدات مسجلة بنظام التتبع الجديد، وسيساعدك على معرفة أي صفحات يجب تحسينها أو إبرازها أكثر."
              />
            )}
          </SectionFrame>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.3 }}
        >
          <SectionFrame
            title="توزيع الحركة حسب نوع الصفحة"
            description="هذا الرسم يوضح أين تتركز الحركة: على صفحات المواد، التخصصات، الجامعات، أو الأدوات العامة."
          >
            {analytics.trafficByPageType.length > 0 ? (
              <>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.trafficByPageType}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 12, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="rgba(148, 163, 184, 0.18)"
                        horizontal={false}
                      />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        width={78}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                        contentStyle={{
                          borderRadius: 18,
                          border: "1px solid rgba(148,163,184,0.25)",
                          boxShadow: "0 18px 40px -28px rgba(15,23,42,0.45)",
                        }}
                        formatter={(value, name) => [
                          formatNumber(Number(value ?? 0)),
                          name === "uniqueVisitors"
                            ? "زوار فريدون"
                            : "مشاهدات",
                        ]}
                      />
                      <Bar dataKey="pageViews" radius={[0, 12, 12, 0]} barSize={18}>
                        {analytics.trafficByPageType.map((entry, index) => (
                          <Cell
                            key={entry.pageType}
                            fill={PAGE_TYPE_COLORS[index % PAGE_TYPE_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {analytics.trafficByPageType.map((entry, index) => (
                    <div
                      key={entry.pageType}
                      className="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-700 dark:bg-surface-950/60"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              PAGE_TYPE_COLORS[index % PAGE_TYPE_COLORS.length],
                          }}
                        />
                        <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {entry.label}
                        </p>
                      </div>
                      <p className={`${firaCode.className} mt-3 text-xl font-bold text-surface-900 dark:text-surface-50`}>
                        {formatNumber(entry.pageViews)}
                      </p>
                      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                        {formatNumber(entry.uniqueVisitors)} زائرًا فريدًا
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="لا يوجد توزيع صفحات بعد"
                description="سيظهر هذا الرسم بعد وصول زيارات فعلية للصفحات العامة، وبعدها ستعرف فورًا إن كانت الحركة مركزة على المواد أم على صفحات التخصصات والجامعات."
              />
            )}
          </SectionFrame>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.36 }}
      >
        <SectionFrame
          title="أكثر مسارات التنقل شيوعًا"
          description="هذا القسم يبين الصفحة التي يأتي منها الزائر والصفحة التالية بعدها، حتى تفهم المسارات الطبيعية داخل الموقع وتعرف أين تضع الروابط أو الدعوات التالية."
        >
          {analytics.topTransitions.length > 0 ? (
            <div className="space-y-4">
              {analytics.topTransitions.map((transition, index) => {
                const maxCount = analytics.topTransitions[0]?.count ?? 1;
                const widthPercent = Math.max(
                  12,
                  Math.round((transition.count / maxCount) * 100),
                );

                return (
                  <div
                    key={`${transition.fromPathname}-${transition.toPathname}`}
                    className="rounded-3xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-700 dark:bg-surface-950/60"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {buildTransitionLabel(transition)}
                        </p>
                        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                          {transition.fromPathname}
                          {" -> "}
                          {transition.toPathname}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className={`${firaCode.className} text-sm font-semibold text-surface-900 dark:text-surface-50`}>
                          {formatNumber(transition.count)}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          انتقالات
                        </p>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                      الترتيب #{formatNumber(index + 1)} ضمن أكثر المسارات استخدامًا
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={hasPageLevelData ? "لا توجد انتقالات كافية بعد" : "بانتظار أول مسارات تنقل"}
              description="عند بدء التنقل بين الصفحات العامة سيظهر هنا أكثر المسارات شيوعًا، مثل الانتقال من صفحة الجامعة إلى التخصص أو من التخصص إلى المادة."
            />
          )}
        </SectionFrame>
      </motion.div>

      {!hasPageLevelData && analytics.visitorSeries.some((point) => point.uniqueVisitors > 0) ? (
        <div className="rounded-3xl border border-primary-200 bg-primary-50/70 px-4 py-3 text-sm text-primary-800 dark:border-primary-900/60 dark:bg-primary-950/30 dark:text-primary-200">
          بيانات الزوار اليومية القديمة ما زالت ظاهرة، أما تفاصيل الصفحات الأكثر مشاهدة ومسارات التنقل فستبدأ بالظهور مع الزيارات الجديدة بعد تفعيل التتبع الأدق.
        </div>
      ) : null}
    </div>
  );
}
