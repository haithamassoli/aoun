import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import * as motion from "motion/react-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { NewsPageContent } from "@/components/news-page-content";
import type { NewsWithAuthor } from "@/components/news-card";
import { api } from "@/convex/_generated/api";
import { NotificationToggle } from "@/components/notification-toggle";
import { decodeSlugParam } from "@/lib/slug";
import Link from "next/link";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { UniversityMobileQuickLinks } from "@/components/university-mobile-quick-links";

const INITIAL_PAGE_SIZE = 8;

type Params = {
  universitySlug: string;
  majorSlug: string;
};

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
  if (!university) {
    return {};
  }

  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) {
    return {};
  }

  const absoluteTitle = `أخبار ${major.name} - ${university.name} | عون`;
  const description = `اطلع على آخر الأخبار والإعلانات الخاصة بتخصص ${major.name} في ${university.name} عبر منصة عون.`;
  const url = `/${university.slug}/${major.slug}/news`;

  return {
    title: { absolute: absoluteTitle },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: absoluteTitle,
      description,
      url,
      type: "website",
    },
  };
}

export default async function MajorNewsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, majorSlug } = await params;
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) {
    notFound();
  }

  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) {
    notFound();
  }
  const canonicalUniversitySlug = university.slug;
  const canonicalMajorSlug = major.slug;
  const newsSummary = `${major.name} · ${university.name}`;

  const initialNews = (await fetchQuery(api.news.listByMajor, {
    majorId: major._id,
    paginationOpts: {
      cursor: null,
      numItems: INITIAL_PAGE_SIZE,
    },
  })) as {
    page: NewsWithAuthor[];
    isDone: boolean;
    continueCursor: string;
  };

  return (
    <div>
      <MobilePageHeaderMenu title={major.name} subtitle={newsSummary}>
        <div className="public-elevated-surface rounded-[28px] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
                الأخبـار
              </p>
              <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                {major.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
                {newsSummary}
              </p>
            </div>

            <div className="shrink-0 pt-1">
              <NotificationToggle majorId={major._id} />
            </div>
          </div>
        </div>

        <Link
          href={`/${canonicalUniversitySlug}/${canonicalMajorSlug}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
        >
          <span>العودة للتخـصص</span>
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.5 8.25 12 15 4.5"
            />
          </svg>
        </Link>

        <UniversityMobileQuickLinks links={university.quickLinks} />
      </MobilePageHeaderMenu>

      {/* Page Header */}
      <section className="hidden border-b border-surface-200/80 bg-gradient-to-bl from-primary-50/90 to-white/80 px-4 py-10 dark:border-surface-700/80 dark:from-primary-950/90 dark:to-surface-950/80 sm:px-6 sm:py-14 lg:px-8 md:block">
        <div className="mx-auto max-w-3xl">
          <Breadcrumb
            items={[
              { label: "الرئيسـية", href: "/" },
              { label: university.name, href: `/${canonicalUniversitySlug}` },
              {
                label: major.name,
                href: `/${canonicalUniversitySlug}/${canonicalMajorSlug}`,
              },
              { label: "الأخبـار" },
            ]}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 dark:border-primary-800 dark:bg-primary-950/60"
              >
                <svg
                  className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400"
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
                <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-300">
                  أخبار ومسـتجدات
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl"
              >
                {major.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-1.5 text-surface-500 dark:text-surface-400"
              >
                {university.name}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="shrink-0 pt-1"
            >
              <NotificationToggle majorId={major._id} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* News Feed */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {initialNews.page.length > 0 && (
            <p className="mb-4 text-xs font-medium text-surface-400 dark:text-surface-500">
              {initialNews.isDone
                ? `${initialNews.page.length} خـبر`
                : `أحدث ${initialNews.page.length} أخبـار`}
            </p>
          )}
          <NewsPageContent majorId={major._id} initialNews={initialNews} />
        </div>
      </section>
    </div>
  );
}
