import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { MajorsSearchSection } from "@/components/majors-search-section";
import type { Metadata } from "next";
import Image from "next/image";
import * as motion from "motion/react-client";

type Params = { universitySlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug } = await params;
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) return {};
  const title = university.name;
  const description = `تصفح التخصصات والمواد الأكاديمية في ${university.name}. ملخصات، امتحانات، ومصادر مجانية.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} — عون`,
      description,
      url: `/${universitySlug}`,
      type: "website",
    },
  };
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug } = await params;

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) notFound();

  const majors = await fetchQuery(api.majors.listByUniversity, {
    universityId: university._id,
  });
  const sortedMajors = majors.toSorted(
    (a: { order: number }, b: { order: number }) => a.order - b.order,
  );

  return (
    <div>
      {/* University Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name },
            ]}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-5"
          >
            {university.logoUrl ? (
              <Image
                src={university.logoUrl}
                alt={university.name}
                width={80}
                height={80}
                unoptimized
                sizes="(max-width: 640px) 64px, 80px"
                className="h-16 w-16 rounded-xl object-contain sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400 sm:h-20 sm:w-20">
                {university.slug.toUpperCase().slice(0, 4)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl lg:text-4xl">
                {university.name}
              </h1>
              <p className="mt-1 text-surface-500 dark:text-surface-400">
                {majors.length > 0
                  ? `${majors.length} تخصص متاح`
                  : "لا توجد تخصصات حالياً"}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <MajorsSearchSection
        universityId={university._id}
        universitySlug={universitySlug}
        majors={sortedMajors}
      />
    </div>
  );
}
