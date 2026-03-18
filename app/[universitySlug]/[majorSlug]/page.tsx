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
import { decodeSlugParam } from "@/lib/slug";

type Params = { universitySlug: string; majorSlug: string };
type SearchParams = {
  status?: string | string[];
};
type CourseStatusFilter = "all" | "completed" | "in_progress" | "none";

const socialPlatforms = [
  {
    key: "instagram",
    label: "Instagram",
    className:
      "border-pink-200 bg-pink-50/80 text-pink-700 hover:border-pink-300 hover:bg-pink-100 dark:border-pink-900/70 dark:bg-pink-950/30 dark:text-pink-200 dark:hover:border-pink-800 dark:hover:bg-pink-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 7.5h.01M8 3.75h8A4.25 4.25 0 0 1 20.25 8v8A4.25 4.25 0 0 1 16 20.25H8A4.25 4.25 0 0 1 3.75 16V8A4.25 4.25 0 0 1 8 3.75Zm4 4.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
      />
    ),
  },
  {
    key: "facebook",
    label: "Facebook Page",
    className:
      "border-sky-200 bg-sky-50/80 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-800 dark:hover:bg-sky-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 20.25v-6h2.25l.75-3h-3V9.5c0-.966.784-1.75 1.75-1.75H18V4.875A16.8 16.8 0 0 0 15.75 4.5 4.5 4.5 0 0 0 11.25 9v2.25H9v3h2.25v6"
      />
    ),
  },
  {
    key: "facebookGroup",
    label: "Facebook Group",
    className:
      "border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    ),
  },
  {
    key: "telegram",
    label: "Telegram",
    className:
      "border-cyan-200 bg-cyan-50/80 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-200 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 4.5-3.75 15-5.485-4.238a1.5 1.5 0 0 0-1.728-.08L7.5 16.5l.948-4.265a1.5 1.5 0 0 1 .642-.925L17.25 5.25 7.485 10.322a1.5 1.5 0 0 1-1.119.114L3 9.375 21 4.5Z"
      />
    ),
  },
] as const;

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
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) return {};
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
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
      url: `/${university.slug}/${major.slug}`,
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
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const initialStatusFilter = normalizeStatusFilter(
    resolvedSearchParams.status,
  );

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) notFound();
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) notFound();
  const canonicalUniversitySlug = university.slug;
  const canonicalMajorSlug = major.slug;

  const [courses, latestNews] = await Promise.all([
    fetchQuery(api.courses.listByMajor, {
      majorId: major._id,
    }),
    fetchQuery(api.news.getLatestByMajor, {
      majorId: major._id,
    }),
  ]);
  const majorSocialLinks = socialPlatforms.flatMap((platform) => {
    const url = major.socialLinks?.[platform.key];
    if (!url) {
      return [];
    }

    return [{ ...platform, url }];
  });

  return (
    <div>
      <MajorLastVisitTracker
        universitySlug={canonicalUniversitySlug}
        majorSlug={canonicalMajorSlug}
      />

      {/* Major Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-10 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${canonicalUniversitySlug}` },
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
                  شجرة مسار التخصص
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
                الأخبار والمستجدات
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-4"
            >
              <Link
                href={`/${canonicalUniversitySlug}/${canonicalMajorSlug}/news`}
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
