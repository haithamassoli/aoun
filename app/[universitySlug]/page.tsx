import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Metadata } from "next";
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
              <img
                src={university.logoUrl}
                alt={university.name}
                className="h-16 w-16 rounded-xl object-contain sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400 sm:h-20 sm:w-20">
                {university.name.charAt(0)}
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

      {/* Majors Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <h2 className="mb-8 text-xl font-bold text-surface-800 dark:text-surface-100 sm:text-2xl">
          التخصصات
        </h2>

        {majors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {majors
              .sort((a, b) => a.order - b.order)
              .map((major, index) => (
                <motion.a
                  key={major._id}
                  href={`/${universitySlug}/${major.slug}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-lg font-bold text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
                    {major.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                      {major.name}
                    </h3>
                  </div>
                  <svg
                    className="ms-auto h-5 w-5 shrink-0 rotate-180 text-surface-400 transition-colors group-hover:text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.a>
              ))}
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
            <p className="text-surface-500 dark:text-surface-400">
              لم تُضاف تخصصات بعد. ترقبوا التحديثات!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
