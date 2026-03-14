import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import * as motion from "motion/react-client";
import Link from "next/link";
import Image from "next/image";
import { UniversitiesSearchSection } from "@/components/universities-search-section";
import { HomeLastMajorRedirect } from "@/components/home-last-major-redirect";

export const metadata: Metadata = {
  title: "عون — مصادر أكاديمية للجامعات الأردنية",
  description:
    "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية. اختر جامعتك وابدأ بتصفح المواد.",
  openGraph: {
    title: "عون — مصادر أكاديمية للجامعات الأردنية",
    description:
      "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية.",
    url: "/",
    type: "website",
  },
};

export default async function Home() {
  let universities: Awaited<
    ReturnType<typeof fetchQuery<typeof api.universities.list>>
  > = [];
  try {
    universities = await fetchQuery(api.universities.list);
  } catch {
    // Convex may not have data yet
  }

  let partners: Awaited<
    ReturnType<typeof fetchQuery<typeof api.partners.list>>
  > = [];
  try {
    partners = await fetchQuery(api.partners.list);
  } catch {
    // Convex may not have data yet
  }
  const sortedUniversities = universities.toSorted(
    (a: { order: number }, b: { order: number }) => a.order - b.order,
  );

  return (
    <div>
      <HomeLastMajorRedirect />

      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-900 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
          >
            عـــون
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg leading-relaxed text-primary-100 sm:text-xl"
          >
            منصة مجانية تجمع الملخصات، الامتحانات، والمصادر الأكاديمية لطلاب
            الجامعات الأردنية. كل شي بمكان واحد.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-base text-primary-200"
          >
            اختر جامعتك وابدأ بتصفح المواد
          </motion.p>
        </div>
      </section>

      <UniversitiesSearchSection universities={sortedUniversities} />

      {partners.length > 0 && (
        <section className="border-t border-surface-200 bg-surface-50 px-4 py-12 dark:border-surface-700 dark:bg-surface-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                شركاؤنا وداعمونا
              </h2>
              <Link
                href="/partners"
                className="text-sm text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {partners.map((partner) => {
                const card = (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-surface-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-surface-700 dark:bg-surface-900">
                    <div className="relative h-40 w-32">
                      <Image
                        src={partner.logoUrl}
                        alt={partner.name}
                        fill
                        className="object-contain rounded-lg"
                        unoptimized
                      />
                    </div>
                  </div>
                );
                return partner.websiteUrl ? (
                  <a
                    key={partner._id}
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {card}
                  </a>
                ) : (
                  <div key={partner._id}>{card}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
