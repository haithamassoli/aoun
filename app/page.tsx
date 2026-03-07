import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import * as motion from "motion/react-client";
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
    </div>
  );
}
