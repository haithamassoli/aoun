import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { CoursesSearchSection } from "@/components/courses-search-section";
import { UniversityQuickLinks } from "@/components/university-quick-links";
import type { Metadata } from "next";
import Link from "next/link";
import * as motion from "motion/react-client";
import { MajorLastVisitTracker } from "@/components/major-last-visit-tracker";
import { NotificationToggle } from "@/components/notification-toggle";
import { decodeSlugParam } from "@/lib/slug";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { UniversityMobileQuickLinks } from "@/components/university-mobile-quick-links";
import { MajorPageSkeleton } from "@/components/loading-shells";
import { socialPlatforms } from "@/lib/social-platforms";
import {
  getCoursesByMajor,
  getLatestNewsByMajor,
  getMajorByUniversityAndSlug,
  getPublicSitemapUrls,
  getUniversityBySlug,
} from "@/lib/public-data";

type Params = { universitySlug: string; majorSlug: string };
type SearchParams = {
  status?: string | string[];
};
type CourseStatusFilter =
  | "all"
  | "completed"
  | "in_progress"
  | "hidden"
  | "none";

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const urls = await getPublicSitemapUrls();
    const params = urls.flatMap(({ path }) => {
      const segments = path.split("/").filter(Boolean);
      return segments.length === 2
        ? [{ universitySlug: segments[0], majorSlug: segments[1] }]
        : [];
    });
    return params.length > 0
      ? params
      : [{ universitySlug: "_", majorSlug: "_" }];
  } catch {
    return [{ universitySlug: "_", majorSlug: "_" }];
  }
}

function normalizeStatusFilter(
  value: string | string[] | undefined,
): CourseStatusFilter | undefined {
  const singleValue = Array.isArray(value) ? value[0] : value;
  if (!singleValue) {
    return undefined;
  }

  if (
    singleValue === "all" ||
    singleValue === "completed" ||
    singleValue === "in_progress" ||
    singleValue === "hidden" ||
    singleValue === "none"
  ) {
    return singleValue;
  }

  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug, majorSlug } = await params;
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const university = await getUniversityBySlug(normalizedUniversitySlug);
  if (!university) return {};
  const major = await getMajorByUniversityAndSlug(
    university._id,
    normalizedMajorSlug,
  );
  if (!major || major.universityId !== university._id) return {};
  const title = `${major.name} — ${university.name}`;
  const description = `الخطة الدراسية والمواد الأكاديمية لتخصص ${major.name} في ${university.name}. ملخصات، امتحانات، ومصادر مجانية.`;
  const canonicalPath = `/${university.slug}/${major.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} — عون`,
      description,
      url: canonicalPath,
      type: "website",
    },
  };
}

async function MajorContent({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ universitySlug, majorSlug }, resolvedSearchParams] =
    await Promise.all([params, searchParams]);
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const initialStatusFilter = normalizeStatusFilter(
    resolvedSearchParams.status,
  );

  const university = await getUniversityBySlug(normalizedUniversitySlug);
  if (!university) notFound();
  const major = await getMajorByUniversityAndSlug(
    university._id,
    normalizedMajorSlug,
  );
  if (!major || major.universityId !== university._id) notFound();
  const canonicalUniversitySlug = university.slug;
  const canonicalMajorSlug = major.slug;

  const [courses, latestNews] = await Promise.all([
    getCoursesByMajor(major._id),
    getLatestNewsByMajor(major._id),
  ]);
  const majorSocialLinks = socialPlatforms.flatMap((platform) => {
    const url = major.socialLinks?.[platform.key];
    if (!url) {
      return [];
    }

    return [{ ...platform, url }];
  });
  const majorBreadcrumbItems = [
    { label: "الرئيسـية", href: "/" },
    { label: university.name, href: `/${canonicalUniversitySlug}` },
    { label: major.name },
  ];
  const majorSummary =
    courses.length > 0
      ? `${university.name} · ${courses.length} مـواد`
      : `${university.name} · لا توجد مـواد حالياً`;

  return (
    <div className="overflow-x-hidden">
      <MajorLastVisitTracker
        universitySlug={canonicalUniversitySlug}
        majorSlug={canonicalMajorSlug}
      />

      <MobilePageHeaderMenu title={major.name} subtitle={majorSummary}>
        <div className="public-elevated-surface rounded-[28px] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
                التخـصص
              </p>
              <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                {major.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
                {majorSummary}
              </p>
            </div>

            <div className="shrink-0">
              <NotificationToggle majorId={major._id} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {major.treeDiagramUrl ? (
            <a
              href={major.treeDiagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
            >
              <span>شجرة مسار التخـصص</span>
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <rect x="16" y="16" width="6" height="6" rx="1.5" />
                <rect x="2" y="16" width="6" height="6" rx="1.5" />
                <rect x="9" y="2" width="6" height="6" rx="1.5" />
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                <path d="M12 12V8" />
              </svg>
            </a>
          ) : null}

          <Link
            href={`/${canonicalUniversitySlug}/${canonicalMajorSlug}/news`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
          >
            <span>الأخبـار والمستجدات</span>
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </Link>
        </div>

        {majorSocialLinks.length > 0 ? (
          <div className="space-y-3">
            <div className="grid gap-2 grid-cols-4">
              {majorSocialLinks.map((platform) => (
                <a
                  key={platform.key}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform.label}
                  title={platform.label}
                  className={`flex justify-center items-center grid-cols-4 gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 ${platform.className}`}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  >
                    {platform.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {latestNews ? (
          <Link
            href={`/${canonicalUniversitySlug}/${canonicalMajorSlug}/news`}
            className="group flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary-200/80 bg-white/90 px-4 py-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 dark:border-primary-800/80 dark:bg-primary-950/50 dark:hover:border-primary-700 dark:hover:bg-primary-950"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex shrink-0 items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-700 dark:bg-primary-900/60 dark:text-primary-200">
                News
              </div>
              <p className="line-clamp-2 text-sm font-medium text-surface-800 transition-colors group-hover:text-primary-700 dark:text-surface-100 dark:group-hover:text-primary-200">
                {latestNews.title}
              </p>
            </div>
            <div className="shrink-0 text-xs font-medium text-surface-500 transition-colors group-hover:text-primary-700 dark:text-surface-400 dark:group-hover:text-primary-300">
              عـرض
            </div>
          </Link>
        ) : null}
        <UniversityMobileQuickLinks links={university.quickLinks} />
      </MobilePageHeaderMenu>

      {/* Major Header */}
      <section className="hidden border-b border-surface-200/80 bg-gradient-to-bl from-primary-50/90 to-white/80 px-4 py-10 dark:border-surface-700/80 dark:from-primary-950/90 dark:to-surface-950/80 sm:px-6 sm:py-14 md:block lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb items={majorBreadcrumbItems} />

          {/* Title row — notification lives here, next to subject it controls */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl lg:text-4xl"
              >
                {major.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
                className="mt-2 text-surface-500 dark:text-surface-400"
              >
                {majorSummary}
              </motion.p>
            </div>
            <div className="shrink-0 pt-1">
              <NotificationToggle majorId={major._id} />
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: "easeOut" }}
            className="mt-4 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              {major.treeDiagramUrl && (
                <a
                  href={major.treeDiagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="16" y="16" width="6" height="6" rx="1.5" />
                    <rect x="2" y="16" width="6" height="6" rx="1.5" />
                    <rect x="9" y="2" width="6" height="6" rx="1.5" />
                    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                    <path d="M12 12V8" />
                  </svg>
                  شجرة مسار التخـصص
                </a>
              )}
              <Link
                href={`/${canonicalUniversitySlug}/${canonicalMajorSlug}/news`}
                className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                الأخبـار والمستجدات
              </Link>
            </div>
            {majorSocialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {majorSocialLinks.map((platform) => (
                  <a
                    key={platform.key}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform.label}
                    title={platform.label}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${platform.className}`}
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      {platform.icon}
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
          {latestNews && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
              className="mt-4"
            >
              <Link
                href={`/${canonicalUniversitySlug}/${canonicalMajorSlug}/news`}
                className="group flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary-200/80 bg-white/90 px-4 py-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md dark:border-primary-800/80 dark:bg-primary-950/50 dark:hover:border-primary-700 dark:hover:bg-primary-950"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex shrink-0 items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-700 dark:bg-primary-900/60 dark:text-primary-200">
                    News
                  </div>
                  <p className="line-clamp-1 text-sm font-medium text-surface-800 transition-colors group-hover:text-primary-700 dark:text-surface-100 dark:group-hover:text-primary-200">
                    {latestNews.title}
                  </p>
                </div>
                <div className="shrink-0 text-xs font-medium text-surface-500 transition-colors group-hover:text-primary-700 dark:text-surface-400 dark:group-hover:text-primary-300">
                  عرض الخـبر
                </div>
              </Link>
            </motion.div>
          )}
          <UniversityQuickLinks links={university.quickLinks} />
        </div>
      </section>

      <CoursesSearchSection
        majorId={major._id}
        universitySlug={canonicalUniversitySlug}
        majorSlug={canonicalMajorSlug}
        courses={courses}
        initialStatusFilter={initialStatusFilter}
      />
    </div>
  );
}

export default function MajorPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<MajorPageSkeleton />}>
      <MajorContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
