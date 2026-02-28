import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import * as motion from "motion/react-client";

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
  let universities: Awaited<ReturnType<typeof fetchQuery<typeof api.universities.list>>> = [];
  try {
    universities = await fetchQuery(api.universities.list);
  } catch {
    // Convex may not have data yet
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-900 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
          >
            عون
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

      {/* Universities Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 text-center text-2xl font-bold text-surface-800 dark:text-surface-100 sm:text-3xl"
        >
          الجامعات
        </motion.h2>

        {universities.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {universities
              .sort((a, b) => a.order - b.order)
              .map((uni, index) => (
                <motion.a
                  key={uni._id}
                  href={`/${uni.slug}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600"
                >
                  {uni.logoUrl && (
                    <img
                      src={uni.logoUrl}
                      alt={uni.name}
                      className="h-20 w-20 rounded-xl object-contain"
                    />
                  )}
                  {!uni.logoUrl && (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                      {uni.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="text-center text-lg font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                    {uni.name}
                  </h3>
                </motion.a>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "الجامعة الأردنية",
              "جامعة اليرموك",
              "الجامعة الهاشمية",
              "جامعة العلوم والتكنولوجيا",
            ].map((name, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-700 dark:bg-surface-900"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  {name.charAt(0)}
                </div>
                <h3 className="text-center text-lg font-semibold text-surface-800 dark:text-surface-100">
                  {name}
                </h3>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
