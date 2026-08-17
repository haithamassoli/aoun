import type { Metadata } from "next";
import * as motion from "motion/react-client";
import Link from "next/link";
import Image from "next/image";
import { UniversitiesSearchSection } from "@/components/universities-search-section";
import { HomeLastMajorRedirect } from "@/components/home-last-major-redirect";
import { HomeHero } from "@/components/home-hero";
import {
  getPublicPartners,
  getPublicUniversities,
  getPublicVisitorsTotal,
} from "@/lib/public-data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

type PartnerCard = {
  _id: string;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string;
};

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
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  let universities: Awaited<ReturnType<typeof getPublicUniversities>> = [];
  try {
    universities = await getPublicUniversities();
  } catch {
    // Convex may not have data yet
  }

  let partners: PartnerCard[] = [];
  try {
    partners = await getPublicPartners();
  } catch {
    // Convex may not have data yet
  }
  let visitorsTotal: number | null = null;
  try {
    const publicVisitors = await getPublicVisitorsTotal();
    visitorsTotal = publicVisitors.visitorsTotal;
  } catch {
    // Convex may not have data yet
  }
  const sortedUniversities = universities.toSorted(
    (a: { order: number }, b: { order: number }) => a.order - b.order,
  );

  return (
    <div>
      <HomeLastMajorRedirect />
      <HomeHero visitorsTotal={visitorsTotal} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 bg-surface-50 dark:bg-surface-950"
      >
        <UniversitiesSearchSection universities={sortedUniversities} />
      </motion.div>

      {partners.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="relative z-20 border-t border-surface-200/80 bg-surface-50/70 px-4 py-16 dark:border-surface-700/80 dark:bg-surface-950/60"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="public-section-title text-sm font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                شركاؤنا وداعمونــا
              </h2>
              <Link
                href="/partners"
                className="group flex items-center gap-2 text-sm text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                عرض الكـل
                <svg
                  className="size-4 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {partners.map((partner, index) => {
                const card = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="public-elevated-surface public-interactive-card flex flex-col items-center justify-center gap-3 rounded-3xl p-6 sm:p-8"
                  >
                    <div className="relative h-16 w-32 sm:h-20 sm:w-40">
                      <Image
                        src={partner.logoUrl || ""}
                        alt={partner.name}
                        fill
                        sizes="(min-width: 1024px) 8rem, (min-width: 640px) 33vw, 50vw"
                        className="object-contain rounded-xl"
                        unoptimized
                      />
                    </div>
                  </motion.div>
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
        </motion.section>
      )}
    </div>
  );
}
