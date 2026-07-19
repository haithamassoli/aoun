"use client";

import { Fira_Code } from "next/font/google";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  CartesianGrid,
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
  trafficByPageType: PageTypeTraffic[];
};

const SUMMARY_SKELETONS = ["content", "reach", "signal"];
const numberFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatAverage(value: number, days: number) {
  if (days === 0) {
    return "0";
  }

  const formatter = value < days ? decimalFormatter : numberFormatter;

  return formatter.format(value / days);
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value);
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function formatTooltipLabel(name: string) {
  switch (name) {
    case "pageViews":
      return "مشاهدات الصفحـات";
    case "uniqueVisitors":
      return "الزوار الفريـدون";
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-3xl border border-dashed border-surface-200 bg-surface-50/70 px-6 text-center dark:border-surface-700 dark:bg-surface-950/50">
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
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[30px] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6 ${className}`}
    >
      <div className="mb-5 max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold text-primary-700 dark:text-primary-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-surface-500 dark:text-surface-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function SmallMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
      <p
        className={`${firaCode.className} mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function MeterBar({
  percent,
  className = "bg-primary-600 dark:bg-primary-400",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
      <div
        className={`h-full rounded-full ${className}`}
        style={{ width: `${Math.max(4, Math.min(percent, 100))}%` }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  children,
  featured = false,
}: {
  label: string;
  value: string;
  description: string;
  children?: ReactNode;
  featured?: boolean;
}) {
  return (
    <article
      className={`h-full rounded-[28px] border p-5 shadow-sm ${
        featured
          ? "border-primary-200 bg-primary-50/70 dark:border-primary-900/60 dark:bg-primary-950/30"
          : "border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          featured
            ? "text-primary-800 dark:text-primary-200"
            : "text-surface-500 dark:text-surface-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`${firaCode.className} mt-3 text-3xl font-bold text-surface-950 dark:text-surface-50`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

function ContentInventory({ analytics }: { analytics: DashboardAnalytics }) {
  const items = [
    { label: "جامعـات", value: analytics.universitiesTotal },
    { label: "تخصصـات", value: analytics.majorsTotal },
    { label: "مـواد", value: analytics.coursesTotal },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl bg-surface-50 px-3 py-2 dark:bg-surface-950/70"
        >
          <p
            className={`${firaCode.className} text-lg font-bold text-surface-900 dark:text-surface-50`}
          >
            {formatNumber(item.value)}
          </p>
          <p className="mt-0.5 text-[11px] text-surface-500 dark:text-surface-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function TopPageList({
  pages,
  totalViews,
}: {
  pages: TopPage[];
  totalViews: number;
}) {
  if (pages.length === 0) {
    return (
      <EmptyState
        title="لا توجد صفحات متصدرة بعـد"
        description="عند وصول أول الزيارات التفصيلية سيظهر هنا المحتوى الذي يحتاج تحسينًا أو إبرازًا أكثـر."
      />
    );
  }

  const maxViews = pages[0]?.pageViews ?? 1;

  return (
    <div className="space-y-3">
      {pages.map((page, index) => {
        const share = getPercent(page.pageViews, totalViews);
        const widthPercent = getPercent(page.pageViews, maxViews);

        return (
          <div
            key={page.pathname}
            className="rounded-3xl border border-surface-200 bg-surface-50/70 p-4 dark:border-surface-700 dark:bg-surface-950/60"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                    #{formatNumber(index + 1)}
                  </span>
                  <p className="truncate text-sm font-bold text-surface-900 dark:text-surface-50">
                    {page.label}
                  </p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-surface-600 ring-1 ring-surface-200 dark:bg-surface-900 dark:text-surface-300 dark:ring-surface-700">
                    {page.pageTypeLabel}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-surface-500 dark:text-surface-400">
                  {page.pathname}
                </p>
              </div>
              <div className="shrink-0 text-left">
                <p
                  className={`${firaCode.className} text-sm font-bold text-surface-900 dark:text-surface-50`}
                >
                  {formatNumber(page.pageViews)}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {formatPercent(share)} من الزيـارات
                </p>
              </div>
            </div>
            <MeterBar percent={widthPercent} />
            <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
              {formatNumber(page.uniqueVisitors)} زائر فريـد
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PageTypeList({
  traffic,
  totalViews,
}: {
  traffic: PageTypeTraffic[];
  totalViews: number;
}) {
  if (traffic.length === 0) {
    return (
      <EmptyState
        title="لا يوجد توزيع صفحات بعـد"
        description="سيظهر هذا القسم بعد وصول زيارات فعلية، لتعرف هل الحركة تتركز في المواد أم الجامعات أم الأدوات بدقـة."
      />
    );
  }

  return (
    <div className="space-y-3">
      {traffic.map((entry, index) => {
        const share = getPercent(entry.pageViews, totalViews);

        return (
          <div
            key={entry.pageType}
            className="rounded-3xl border border-surface-200 bg-surface-50/70 p-4 dark:border-surface-700 dark:bg-surface-950/60"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-50">
                  {entry.label}
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  {formatNumber(entry.uniqueVisitors)} زائر فريـد
                </p>
              </div>
              <div className="text-left">
                <p
                  className={`${firaCode.className} text-sm font-bold text-surface-900 dark:text-surface-50`}
                >
                  {formatPercent(share)}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {formatNumber(entry.pageViews)} مشـاهدة
                </p>
              </div>
            </div>
            <MeterBar
              percent={share}
              className={
                index === 0
                  ? "bg-primary-600 dark:bg-primary-400"
                  : "bg-surface-500 dark:bg-surface-500"
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function TrafficChart({ series }: { series: PageViewSeriesPoint[] }) {
  return (
    <div className="h-[300px] w-full lg:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={series}
          margin={{ top: 10, right: 6, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(148, 163, 184, 0.22)"
            vertical={false}
          />
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
            fill="#2563eb"
            radius={[10, 10, 0, 0]}
            barSize={16}
            name="pageViews"
          />
          <Line
            type="monotone"
            dataKey="uniqueVisitors"
            stroke="#059669"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            name="uniqueVisitors"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrafficLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-surface-500 dark:text-surface-400">
      <span className="inline-flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-primary-600" />
        مشاهدات الصفحـات
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-emerald-600" />
        الزوار الفريـدون
      </span>
    </div>
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
        <div className="grid gap-4 lg:grid-cols-3">
          {SUMMARY_SKELETONS.map((item) => (
            <Skeleton
              key={item}
              className="h-40 rounded-[28px] border border-surface-200 dark:border-surface-700"
            />
          ))}
        </div>
        <Skeleton className="h-[460px] rounded-[30px] border border-surface-200 dark:border-surface-700" />
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[520px] rounded-[30px] border border-surface-200 dark:border-surface-700" />
          <Skeleton className="h-[520px] rounded-[30px] border border-surface-200 dark:border-surface-700" />
        </div>
      </div>
    );
  }

  const series = analytics.pageViewSeries;
  const hasPageLevelData =
    analytics.pageViewsTotal > 0 || analytics.topPages.length > 0;
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
  const topPageType = analytics.trafficByPageType[0];
  const dailyVisitorTotal = series.reduce(
    (total, point) => total + point.uniqueVisitors,
    0,
  );
  const viewsPerVisitor =
    dailyVisitorTotal > 0
      ? analytics.pageViewsTotal / dailyVisitorTotal
      : 0;
  const topPageShare = topPage
    ? getPercent(topPage.pageViews, analytics.pageViewsTotal)
    : 0;
  const topPageTypeShare = topPageType
    ? getPercent(topPageType.pageViews, analytics.pageViewsTotal)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.05 }}
        >
          <SummaryCard
            label="حجم المحتـوى"
            value={formatNumber(analytics.coursesTotal)}
            description="عدد المواد هو المؤشر الأسرع لحجم الدليل الأكاديمي المتاح للطـلاب."
          >
            <ContentInventory analytics={analytics} />
          </SummaryCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.1 }}
        >
          <SummaryCard
            label="نشاط آخـر 30 يومًا"
            value={formatNumber(analytics.pageViewsTotal)}
            description={`${formatNumber(
              dailyVisitorTotal,
            )} زيارة فريدة يوميـة، بمتوسط ${formatDecimal(
              viewsPerVisitor,
            )} مشاهدة لكل زيارة.`}
            featured
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.15 }}
        >
          <SummaryCard
            label="أوضح إشـارة الآن"
            value={topPage ? formatPercent(topPageShare) : "0%"}
            description={
              topPage
                ? `${shortenLabel(topPage.label, 38)} تستحوذ على هذه النسبة من المشاهـدات.`
                : "بانتظار بيانات صفحات كافية لتحديد المحتوى الأبـرز."
            }
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.2 }}
      >
        <SectionFrame
          eyebrow="حركة الزيـارات"
          title="هل الحركة تنمو أم تتذبـذب؟"
          description="اقرأ الأعمدة كحجم مشاهدة، والخط كعدد طلاب مختلفين. الفرق بينهما يوضح عمق التصـفح."
        >
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr] lg:items-center">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-surface-50 p-4 dark:bg-surface-950/60">
                <SmallMetric
                  label="متوسط المشاهدات اليومـي"
                  value={averageDailyViews}
                  hint={`${formatNumber(totalTrackedDays)} يومًا متتبـعًا`}
                />
              </div>
              <div className="rounded-3xl bg-surface-50 p-4 dark:bg-surface-950/60">
                <SmallMetric
                  label="أعلى يوم مشـاهدة"
                  value={formatNumber(peakTrafficDay.pageViews)}
                  hint={peakTrafficDay.label || "لا توجد بيانات بعـد"}
                />
              </div>
              <div className="rounded-3xl bg-surface-50 p-4 dark:bg-surface-950/60">
                <SmallMetric
                  label="المشاهدات لكل زيارة فريـدة"
                  value={formatDecimal(viewsPerVisitor)}
                  hint="كلما ارتفع الرقم زاد تنقل الطالب داخل الموقـع"
                />
              </div>
            </div>
            <div>
              <TrafficChart series={series} />
              <div className="mt-4 flex items-center justify-between gap-4">
                <TrafficLegend />
                <p className="hidden text-xs text-surface-500 dark:text-surface-400 sm:block">
                  آخـر {formatNumber(totalTrackedDays)} يومًا
                </p>
              </div>
            </div>
          </div>
        </SectionFrame>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.26 }}
        >
          <SectionFrame
            eyebrow="اهتمام الطـلاب"
            title="أكثر الصفحات فائدة للمراقبـة"
            description="هذه القائمة تكشف أين يذهب الطلاب فعليًا، مع حصة كل صفحة من إجمالي المشاهـدات."
          >
            <TopPageList
              pages={analytics.topPages}
              totalViews={analytics.pageViewsTotal}
            />
          </SectionFrame>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.32 }}
        >
          <SectionFrame
            eyebrow="توزيع الحركـة"
            title="أي نوع صفحات يجذب الزيـارات؟"
            description={
              topPageType
                ? `${topPageType.label} يستحوذ على ${formatPercent(
                    topPageTypeShare,
                  )} من الحركة الحاليـة.`
                : "سيظهر توزيع الأنواع بعد وصول بيانات صفحات كافيـة."
            }
          >
            <PageTypeList
              traffic={analytics.trafficByPageType}
              totalViews={analytics.pageViewsTotal}
            />
          </SectionFrame>
        </motion.div>
      </div>

      {!hasPageLevelData &&
      analytics.visitorSeries.some((point) => point.uniqueVisitors > 0) ? (
        <div className="rounded-3xl border border-primary-200 bg-primary-50/70 px-4 py-3 text-sm leading-6 text-primary-800 dark:border-primary-900/60 dark:bg-primary-950/30 dark:text-primary-200">
          بيانات الزوار اليومية القديمة ما زالت ظاهـرة. تفاصيل الصفحات
          ستبدأ بالظهور مع الزيارات الجديدة بعد تفعيل التتبع الأدق.
        </div>
      ) : null}
    </div>
  );
}
