import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { CoursesSearchSection } from "@/components/courses-search-section";
import type { Metadata } from "next";
import * as motion from "motion/react-client";

type Params = { universitySlug: string; majorSlug: string };

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
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, majorSlug } = await params;

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) notFound();
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) notFound();

  const courses = await fetchQuery(api.courses.listByMajor, {
    majorId: major._id,
  });

  return (
    <div>
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
        </div>
      </section>

      <CoursesSearchSection
        majorId={major._id}
        universitySlug={universitySlug}
        majorSlug={majorSlug}
        courses={courses}
      />
    </div>
  );
}
