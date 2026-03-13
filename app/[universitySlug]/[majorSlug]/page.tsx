import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { CoursesSearchSection } from "@/components/courses-search-section";
import { UniversityQuickLinks } from "@/components/university-quick-links";
import type { Metadata } from "next";
import Link from "next/link";
import * as motion from "motion/react-client";
import { MajorLastVisitTracker } from "@/components/major-last-visit-tracker";
import { NotificationToggle } from "@/components/notification-toggle";

type Params = { universitySlug: string; majorSlug: string };
type SearchParams = {
  status?: string | string[];
};
type CourseStatusFilter = "all" | "completed" | "in_progress" | "none";

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
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) return {};
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) return {};
  const title = `${major.name} — ${university.name}`;
  const description = `الخطة الدراسية والمواد الأكاديمية لتخصص ${major.name} في ${university.name}. ملخصات، امتحانات، ومصادر مجانية.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} — عون`,
      description,
      url: `/${universitySlug}/${majorSlug}`,
      type: "website",
    },
  };
}

export default async function MajorPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ universitySlug, majorSlug }, resolvedSearchParams] =
    await Promise.all([params, searchParams]);
  const initialStatusFilter = normalizeStatusFilter(
    resolvedSearchParams.status,
  );

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) notFound();
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) notFound();

  const [courses, latestNews] = await Promise.all([
    fetchQuery(api.courses.listByMajor, {
      majorId: major._id,
    }),
    fetchQuery(api.news.getLatestByMajor, {
      majorId: major._id,
    }),
  ]);

  return (
    <div>
      <MajorLastVisitTracker
        universitySlug={universitySlug}
        majorSlug={majorSlug}
      />

      {/* Major Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-10 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${universitySlug}` },
              { label: major.name },
            ]}
          />

          {/* Title row — notification lives here, next to subject it controls */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl lg:text-4xl"
              >
                {major.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-2 text-surface-500 dark:text-surface-400"
              >
                {university.name} ·{" "}
                {courses.length > 0
                  ? `${courses.length} مادة`
                  : "لا توجد مواد حالياً"}
              </motion.p>
            </div>
            <div className="shrink-0 pt-1">
              <NotificationToggle majorId={major._id} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {major.treeDiagramUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4"
              >
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
                  شجرة مسار التخصص
                </a>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4"
            >
              <Link
                href={`/${universitySlug}/${majorSlug}/news`}
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
                الأخبار والمستجدات
              </Link>
            </motion.div>
            {latestNews ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 w-full"
              >
                <Link
                  href={`/${universitySlug}/${majorSlug}/news`}
                  className="group flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary-200/80 bg-white/90 px-4 py-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md dark:border-primary-800/80 dark:bg-primary-950/50 dark:hover:border-primary-700 dark:hover:bg-primary-950"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex shrink-0 items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-700 dark:bg-primary-900/60 dark:text-primary-200">
                      News
                    </span>
                    <p className="line-clamp-1 text-sm font-medium text-surface-800 transition-colors group-hover:text-primary-700 dark:text-surface-100 dark:group-hover:text-primary-200">
                      {latestNews.title}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-surface-500 transition-colors group-hover:text-primary-700 dark:text-surface-400 dark:group-hover:text-primary-300">
                    عرض الخبر
                  </span>
                </Link>
              </motion.div>
            ) : null}
          </div>
          <UniversityQuickLinks links={university.quickLinks} />
        </div>
      </section>

      <CoursesSearchSection
        majorId={major._id}
        universitySlug={universitySlug}
        majorSlug={majorSlug}
        courses={courses}
        initialStatusFilter={initialStatusFilter}
      />
    </div>
  );
}
