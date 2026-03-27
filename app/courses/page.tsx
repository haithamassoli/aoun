import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { GlobalCoursesSearchPage } from "@/components/global-courses-search-page";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

type CoursesPageSearchParams = {
  q?: string | string[];
  university?: string | string[];
  major?: string | string[];
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const metadata: Metadata = {
  title: "البحث عن المواد",
  description:
    "ابحث عن المواد الأكاديمية عبر جميع الجامعات الأردنية من صفحة واحدة، ثم انتقل مباشرة إلى صفحة المادة.",
  openGraph: {
    title: "البحث عن المواد — عون",
    description:
      "ابحث عن المواد الأكاديمية عبر جميع الجامعات الأردنية من صفحة واحدة، ثم انتقل مباشرة إلى صفحة المادة.",
    url: "/courses",
    type: "website",
  },
  alternates: {
    canonical: "/courses",
  },
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CoursesPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  let universities: Awaited<
    ReturnType<typeof fetchQuery<typeof api.universities.list>>
  > = [];
  try {
    universities = await fetchQuery(api.universities.list);
  } catch {
    // Convex data may not be available yet in local development.
  }

  return (
    <>
      <MobilePageHeaderMenu
        title="البحث عن المواد"
        subtitle="ابحث في جميع الجامعات الأردنية من صفحة واحدة"
      >
        <div className="rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:from-surface-900 dark:to-primary-950/40 dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            أداة سريعة
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            ابحث عن أي مادة
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            اكتب اسم المادة أو رمزها، ثم صفِّ النتائج حسب الجامعة والتخصص للوصول
            إلى الصفحة الصحيحة بسرعة.
          </p>
        </div>
      </MobilePageHeaderMenu>

      <GlobalCoursesSearchPage
        universities={universities}
        initialSearchParams={{
          q: getSingleParam(resolvedSearchParams.q),
          university: getSingleParam(resolvedSearchParams.university),
          major: getSingleParam(resolvedSearchParams.major),
        }}
      />
    </>
  );
}
