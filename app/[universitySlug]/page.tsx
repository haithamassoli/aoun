import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { MajorsSearchSection } from "@/components/majors-search-section";
import { UniversityQuickLinks } from "@/components/university-quick-links";
import type { Metadata } from "next";
import Image from "next/image";
import * as motion from "motion/react-client";
import { decodeSlugParam } from "@/lib/slug";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { UniversityMobileQuickLinks } from "@/components/university-mobile-quick-links";

type Params = { universitySlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug } = await params;
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
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
      url: `/${university.slug}`,
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
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
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
      <MobilePageHeaderMenu
        title={university.name}
        subtitle={
          majors.length > 0
            ? `${majors.length} تخصص متاح`
            : "لا توجد تخصصات حالياً"
        }
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <div className="flex items-start gap-4">
            {university.logoUrl ? (
              <Image
                src={university.logoUrl}
                alt={university.name}
                width={72}
                height={72}
                unoptimized
                sizes="72px"
                className="h-14 w-14 rounded-2xl object-contain"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-xl font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                {university.slug.toUpperCase().slice(0, 4)}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
                الجامعة
              </p>
              <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                {university.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
                {majors.length > 0
                  ? `${majors.length} تخصص متاح`
                  : "لا توجد تخصصات حالياً"}
              </p>
            </div>
          </div>
        </div>

        <UniversityMobileQuickLinks links={university.quickLinks} />
      </MobilePageHeaderMenu>

      {/* University Header */}
      <section className="hidden border-b border-surface-200/80 bg-gradient-to-bl from-primary-50/90 to-white/80 px-4 py-12 dark:border-surface-700/80 dark:from-primary-950/90 dark:to-surface-950/80 sm:px-6 sm:py-16 lg:px-8 md:block">
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
          <UniversityQuickLinks links={university.quickLinks} />
        </div>
      </section>

      <MajorsSearchSection
        universityId={university._id}
        universitySlug={university.slug}
        majors={sortedMajors}
      />
    </div>
  );
}
