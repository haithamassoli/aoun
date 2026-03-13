import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import * as motion from "motion/react-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { NewsPageContent } from "@/components/news-page-content";
import type { NewsWithAuthor } from "@/components/news-card";
import { api } from "@/convex/_generated/api";

const INITIAL_PAGE_SIZE = 8;

type Params = {
  universitySlug: string;
  majorSlug: string;
};

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
  }).format(new Date(timestamp));
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
  if (!university) {
    return {};
  }

  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) {
    return {};
  }

  const absoluteTitle = `أخبار ${major.name} - ${university.name} | عون`;
  const description = `اطلع على آخر الأخبار والإعلانات الخاصة بتخصص ${major.name} في ${university.name} عبر منصة عون.`;
  const url = `/${universitySlug}/${majorSlug}/news`;

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

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) {
    notFound();
  }

  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) {
    notFound();
  }

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

  const latestNews = initialNews.page[0] ?? null;

  return (
    <div>
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 via-white to-sky-50 px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:via-surface-950 dark:to-surface-900 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${universitySlug}` },
              {
                label: major.name,
                href: `/${universitySlug}/${majorSlug}`,
              },
              { label: "الأخبار" },
            ]}
          />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center rounded-full border border-primary-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary-700 shadow-sm dark:border-primary-800 dark:bg-surface-900/80 dark:text-primary-300"
              >
                نافذة الأخبار
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-4 text-3xl font-bold text-surface-950 dark:text-white sm:text-4xl lg:text-5xl"
              >
                أخبار {major.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-3 max-w-2xl text-base leading-8 text-surface-600 dark:text-surface-300"
              >
                صفحة مخصصة لمتابعة الإعلانات والمستجدات الأكاديمية الخاصة
                بتخصص {major.name} في {university.name}، مع تحديثات مرتبة من
                الأحدث إلى الأقدم.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="w-full max-w-md rounded-[28px] border border-primary-200/80 bg-white/90 p-5 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.3)] dark:border-primary-800/80 dark:bg-surface-900/90"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                    ملخص سريع
                  </p>
                  <p className="mt-1 text-lg font-semibold text-surface-950 dark:text-white">
                    {latestNews ? "آخر خبر منشور" : "لا توجد أخبار منشورة بعد"}
                  </p>
                </div>
                <Link
                  href={`/${universitySlug}/${majorSlug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-surface-300 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-primary-300 hover:text-primary-700 dark:border-surface-700 dark:text-surface-300 dark:hover:border-primary-700 dark:hover:text-primary-300"
                >
                  العودة للتخصص
                </Link>
              </div>

              {latestNews ? (
                <div className="mt-4 rounded-2xl bg-surface-50 p-4 dark:bg-surface-800/70">
                  <p className="line-clamp-2 text-sm font-semibold leading-7 text-surface-900 dark:text-surface-50">
                    {latestNews.title}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-surface-500 dark:text-surface-400">
                    نُشر بواسطة {latestNews.authorName} بتاريخ{" "}
                    {formatDate(latestNews.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-surface-500 dark:text-surface-400">
                  سيتم عرض آخر مستجدات القسم هنا فور نشرها من قبل المساهمين.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <NewsPageContent
        majorId={major._id}
        majorName={major.name}
        initialItems={initialNews.page}
      />
    </div>
  );
}
