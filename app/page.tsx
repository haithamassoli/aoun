import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import * as motion from "motion/react-client";
import Link from "next/link";
import Image from "next/image";
import { UniversitiesSearchSection } from "@/components/universities-search-section";
import { HomeLastMajorRedirect } from "@/components/home-last-major-redirect";
import { GrainOverlay } from "@/components/landing/grain-overlay";
import { ScrollReveal, ScrollRevealGroup } from "@/components/landing/scroll-reveal";
import { HeroVisuals } from "@/components/landing/hero-visuals";

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
  let universities: Awaited<
    ReturnType<typeof fetchQuery<typeof api.universities.list>>
  > = [];
  try {
    universities = await fetchQuery(api.universities.list);
  } catch {
    // Convex may not have data yet
  }

  let partners: PartnerCard[] = [];
  try {
    partners = await fetchQuery(api.partners.list);
  } catch {
    // Convex may not have data yet
  }
  let visitorsTotal: number | null = null;
  try {
    const publicVisitors = await fetchQuery(
      api.dashboard.getPublicVisitorsTotal,
    );
    visitorsTotal = publicVisitors.visitorsTotal;
  } catch {
    // Convex may not have data yet
  }
  const sortedUniversities = universities.toSorted(
    (a: { order: number }, b: { order: number }) => a.order - b.order,
  );

  return (
    <div className="relative">
      <HomeLastMajorRedirect />
      <GrainOverlay />

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="landing-hero px-4 text-white sm:px-6 lg:px-8">
        {/* Canvas particle network + Spotlight + Floating cards */}
        <HeroVisuals />

        {/* Content layer — above all visual layers */}
        <div className="relative z-10 mx-auto max-w-4xl py-24 text-center sm:py-32 lg:py-40">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl"
          >
            عـــــون
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl"
          >
            منصة مجانيـة تجمع الملخصـات، الامتحانـات، والمصـادر الأكاديمية
            لطلاب الجامعـات الأردنية. كل شي بمكان واحـد.
          </motion.p>

          {/* Secondary text → CTA link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-8"
          >
            <Link
              href="#universities"
              className="btn-shimmer inline-flex items-center gap-2 rounded-2xl bg-white/15 px-8 py-4 text-lg font-bold text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/25 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              اختر جامعتك وابدأ بتصفح المــواد
              <svg
                className="size-5 rotate-180 rtl:rotate-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5-5 5M6 12h12"
                />
              </svg>
            </Link>
          </motion.div>

          {/* Visitor counter badge */}
          {visitorsTotal !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mx-auto mt-10 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur-md animate-pulse-glow"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5V18a4 4 0 00-5-3.874M17 20H7m10 0v-2c0-.653-.157-1.269-.436-1.813M7 20H2V18a4 4 0 015-3.874M7 20v-2c0-.653.157-1.269.436-1.813m0 0a5.002 5.002 0 019.128 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </span>
              <span>إجمالي الـزوار</span>
              <span className="tabular-nums font-semibold">
                {visitorsTotal}
              </span>
            </motion.div>
          )}
        </div>

        {/* Bottom fade transition into next section */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-50 to-transparent dark:from-surface-950"
        />
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* UNIVERSITIES SECTION                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <UniversitiesSearchSection universities={sortedUniversities} />

      {/* ════════════════════════════════════════════════════════════ */}
      {/* PARTNERS SECTION                                            */}
      {/* ════════════════════════════════════════════════════════════ */}
      {partners.length > 0 && (
        <section className="relative border-t border-surface-200/80 bg-surface-50/70 px-4 py-16 dark:border-surface-700/80 dark:bg-surface-950/60">
          {/* Subtle gradient divider */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary-500/20 to-transparent"
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fade-up">
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-gradient-to-l from-primary-500 to-accent-500" />
                  <h2 className="public-section-title text-sm font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    شركاؤنــا وداعمــونا
                  </h2>
                </div>
                <Link
                  href="/partners"
                  className="group flex items-center gap-1.5 text-sm text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  عرض الكــل
                  <svg
                    className="size-4 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 17l-5-5 5-5M18 12H6"
                    />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollRevealGroup
              className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
              staggerDelay={0.06}
            >
              {partners.map((partner) => {
                const card = (
                  <div className="public-elevated-surface public-interactive-card glow-border flex flex-col items-center gap-3 rounded-[1.6rem] p-2">
                    <div className="relative h-40 w-32">
                      <Image
                        src={partner.logoUrl || ""}
                        alt={partner.name}
                        fill
                        sizes="(min-width: 1024px) 8rem, (min-width: 640px) 33vw, 50vw"
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
            </ScrollRevealGroup>
          </div>
        </section>
      )}
    </div>
  );
}
