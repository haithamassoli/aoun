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
  const latestNewsDate = latestNews
    ? new Intl.DateTimeFormat("ar-JO", {
        dateStyle: "medium",
      }).format(new Date(latestNews.createdAt))
    : null;

  return (
    <div>
      <MajorLastVisitTracker
        universitySlug={universitySlug}
        majorSlug={majorSlug}
      />

      {/* Major Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${universitySlug}` },
              { label: major.name },
            ]}
          />
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 flex flex-wrap gap-3"
          >
            <Link
              href={`/${universitySlug}/${majorSlug}/news`}
              className="group flex min-w-[280px] flex-1 items-start justify-between gap-4 rounded-[24px] border border-primary-200 bg-white/90 px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[0_20px_40px_-28px_rgba(37,99,235,0.35)] dark:border-primary-800/80 dark:bg-surface-900/80 dark:hover:border-primary-700"
            >
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/80 dark:text-primary-300">
                  الأخبار
                </span>
                <p className="mt-3 text-base font-semibold text-surface-950 dark:text-surface-50">
                  تابع مستجدات التخصص
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
                  {latestNews
                    ? latestNews.title
                    : "اطلع على الإعلانات والتنبيهات والمستجدات الخاصة بالقسم في صفحة واحدة."}
                </p>
                {latestNewsDate && (
                  <p className="mt-2 text-xs font-medium text-primary-700 dark:text-primary-300">
                    آخر تحديث {latestNewsDate}
                  </p>
                )}
              </div>
              <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-transform group-hover:-translate-x-1 dark:bg-primary-950/80 dark:text-primary-300">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>

            {major.treeDiagramUrl && (
              <a
                href={major.treeDiagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[24px] border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
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
                <svg
                  className="h-3.5 w-3.5 shrink-0 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </motion.div>
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
