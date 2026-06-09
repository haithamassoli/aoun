import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CoursesPageSearchParams>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const hasFilters = Boolean(
    getSingleParam(resolvedSearchParams.q) ||
      getSingleParam(resolvedSearchParams.university) ||
      getSingleParam(resolvedSearchParams.major),
  );

  return {
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
    robots: hasFilters
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

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
        <div className="public-elevated-surface rounded-[28px] p-4">
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
