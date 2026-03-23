import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Metadata } from "next";
import Link from "next/link";
import * as motion from "motion/react-client";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { UniversityQuickLinks } from "@/components/university-quick-links";
import { CourseResourcesSection } from "@/components/course-resources-section";
import { decodeSlugParam } from "@/lib/slug";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { UniversityMobileQuickLinks } from "@/components/university-mobile-quick-links";

type Params = {
  universitySlug: string;
  majorSlug: string;
  courseSlug: string;
};

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
      "border-blue-200 bg-blue-50/80 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    ),
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug, majorSlug, courseSlug } = await params;
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const normalizedCourseSlug = decodeSlugParam(courseSlug);
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) return {};
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) return {};
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId: major._id,
    slug: normalizedCourseSlug,
  });
  if (!course || course.majorId !== major._id) return {};
  const title = `${course.name} — ${major.name} — ${university.name}`;
  const description = `مصادر أكاديمية لمادة ${course.name}${course.courseCode ? ` (${course.courseCode})` : ""} في تخصص ${major.name}، ${university.name}. ملخصات، امتحانات، وفيديوهات.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} — عون`,
      description,
      url: `/${university.slug}/${major.slug}/${course.slug}`,
      type: "article",
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, majorSlug, courseSlug } = await params;
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const normalizedCourseSlug = decodeSlugParam(courseSlug);

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) notFound();
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) notFound();
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId: major._id,
    slug: normalizedCourseSlug,
  });
  if (!course || course.majorId !== major._id) notFound();
  const canonicalUniversitySlug = university.slug;
  const canonicalMajorSlug = major.slug;

  const [resources, latestNews] = await Promise.all([
    fetchQuery(api.resources.listByCourse, {
      courseId: course._id,
    }),
    fetchQuery(api.news.getLatestByMajor, {
      majorId: major._id,
    }),
  ]);
  const resourceCards = resources.map((resource) => ({
    _id: resource._id,
    category: resource.category,
    contentHtml: resource.content
      ? sanitizeRichText(resource.content)
      : undefined,
    helpfulnessScore: resource.helpfulnessScore,
    notUsefulCount: resource.notUsefulCount,
    order: resource.order,
    totalFeedback: resource.totalFeedback,
    title: resource.title,
    type: resource.type,
    usefulCount: resource.usefulCount,
    url: resource.url,
  }));
  const courseBreadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: university.name, href: `/${canonicalUniversitySlug}` },
    {
      label: major.name,
      href: `/${canonicalUniversitySlug}/${canonicalMajorSlug}`,
    },
    { label: course.name },
  ];
  const courseSummary = course.courseCode
    ? `${course.courseCode} · ${major.name} · ${university.name}`
    : `${major.name} · ${university.name}`;
  const majorSocialLinks = socialPlatforms.flatMap((platform) => {
    const url = major.socialLinks?.[platform.key];
    if (!url) {
      return [];
    }

    return [{ ...platform, url }];
  });

  return (
    <div>
      <MobilePageHeaderMenu title={course.name} subtitle={courseSummary}>
        <div className="rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:from-surface-900 dark:to-primary-950/40 dark:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
                المادة
              </p>
              <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                {course.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
                {courseSummary}
              </p>
            </div>

            {course.courseCode ? (
              <div className="shrink-0 rounded-full bg-surface-100 px-3 py-1 text-sm font-medium text-surface-700 dark:bg-surface-800 dark:text-surface-200">
                {course.courseCode}
              </div>
            ) : null}
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
              <span>شجرة مسار التخصص</span>
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
            <span>الأخبار والمستجدات</span>
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
              عرض
            </div>
          </Link>
        ) : null}

        <UniversityMobileQuickLinks links={university.quickLinks} />
      </MobilePageHeaderMenu>

      {/* Course Header */}
      <section className="hidden border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 md:block lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb items={courseBreadcrumbItems} />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl lg:text-4xl"
          >
            {course.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 flex flex-wrap items-center gap-3 text-surface-500 dark:text-surface-400"
          >
            {course.courseCode && (
              <span className="rounded-md bg-surface-100 px-2.5 py-1 text-sm font-medium text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                {course.courseCode}
              </span>
            )}
            <span>
              {major.name} · {university.name}
            </span>
          </motion.div>
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
                  عرض الخبر
                </div>
              </Link>
            </motion.div>
          )}
          <UniversityQuickLinks links={university.quickLinks} />
        </div>
      </section>

      {/* Resources */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CourseResourcesSection
          courseId={course._id}
          resources={resourceCards}
        />
      </section>
    </div>
  );
}
