import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { GlobalCoursesSearchPage } from "@/components/global-courses-search-page";

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

  let universities: Awaited<ReturnType<typeof fetchQuery<typeof api.universities.list>>> =
    [];
  try {
    universities = await fetchQuery(api.universities.list);
  } catch {
    // Convex data may not be available yet in local development.
  }

  return (
    <GlobalCoursesSearchPage
      universities={universities}
      initialSearchParams={{
        q: getSingleParam(resolvedSearchParams.q),
        university: getSingleParam(resolvedSearchParams.university),
        major: getSingleParam(resolvedSearchParams.major),
      }}
    />
  );
}
