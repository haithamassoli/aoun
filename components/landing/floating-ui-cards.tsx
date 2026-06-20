"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FloatingUiCardsProps {
  className?: string;
}

interface CardConfig {
  id: string;
  /** CSS top position */
  top: string;
  /** CSS inset-inline-start position */
  insetInlineStart: string;
  /** Mobile top override (or null to hide) */
  mobileTop: string | null;
  /** Mobile inset-inline-start override */
  mobileInsetInlineStart: string | null;
  /** Float animation duration */
  duration: string;
  /** Float animation delay */
  delay: string;
}

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

function GraduationCapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M9 12h6m-6 4h4M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MagnifyingGlassIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-4"
      aria-hidden="true"
    >
      <circle
        cx={11}
        cy={11}
        r={7}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 6h6v6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Card configs                                                       */
/* ------------------------------------------------------------------ */

const CARD_CONFIGS: CardConfig[] = [
  {
    id: "university",
    top: "12%",
    insetInlineStart: "68%",
    mobileTop: "8%",
    mobileInsetInlineStart: "55%",
    duration: "3.5s",
    delay: "0s",
  },
  {
    id: "resource",
    top: "65%",
    insetInlineStart: "8%",
    mobileTop: "72%",
    mobileInsetInlineStart: "5%",
    duration: "4s",
    delay: "0.5s",
  },
  {
    id: "search",
    top: "40%",
    insetInlineStart: "75%",
    mobileTop: null, // hidden on mobile
    mobileInsetInlineStart: null,
    duration: "3.8s",
    delay: "1s",
  },
  {
    id: "stats",
    top: "18%",
    insetInlineStart: "5%",
    mobileTop: null, // hidden on mobile
    mobileInsetInlineStart: null,
    duration: "4.5s",
    delay: "1.5s",
  },
];

/* ------------------------------------------------------------------ */
/*  Card content components                                            */
/* ------------------------------------------------------------------ */

function UniversityCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
          <GraduationCapIcon />
        </span>
        <span className="text-sm font-medium text-white/90">
          الجامعة الأردنية
        </span>
      </div>
      <span className="inline-flex w-fit rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-medium text-primary-300">
        12 تخصص
      </span>
    </div>
  );
}

function ResourceCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent-500/20 text-accent-400">
          <DocumentIcon />
        </span>
        <span className="text-sm font-medium text-white/90">
          ملخصات ومراجع
        </span>
      </div>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-l from-accent-400 to-primary-400"
            style={{ width: "78%" }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-white/50">78%</span>
      </div>
    </div>
  );
}

function SearchPreviewCard() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
        <span className="text-white/40">
          <MagnifyingGlassIcon />
        </span>
        <span className="text-xs text-white/40">ابحث عن مادتك...</span>
      </div>
    </div>
  );
}

function StatsCard() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
          <TrendUpIcon />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold tabular-nums text-white/90">
            1,200+
          </span>
          <span className="text-[10px] text-white/50">مصدر أكاديمي</span>
        </div>
      </div>
    </div>
  );
}

const CARD_CONTENT: Record<string, () => React.JSX.Element> = {
  university: UniversityCard,
  resource: ResourceCard,
  search: SearchPreviewCard,
  stats: StatsCard,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function FloatingUiCards({ className }: FloatingUiCardsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    >
      {CARD_CONFIGS.map((card) => {
        // On mobile, hide cards that have null mobileTop
        if (isMobile && card.mobileTop === null) return null;

        const Content = CARD_CONTENT[card.id];
        const top = isMobile && card.mobileTop ? card.mobileTop : card.top;
        const insetInlineStart =
          isMobile && card.mobileInsetInlineStart
            ? card.mobileInsetInlineStart
            : card.insetInlineStart;

        return (
          <div
            key={card.id}
            className={`absolute max-w-[180px] rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:max-w-none sm:p-4 ${
              prefersReducedMotion ? "" : "animate-float"
            } ${isMobile ? "scale-90 opacity-80" : ""}`}
            style={{
              top,
              insetInlineStart,
              animationDuration: prefersReducedMotion
                ? undefined
                : card.duration,
              animationDelay: prefersReducedMotion ? undefined : card.delay,
            }}
          >
            <Content />
          </div>
        );
      })}
    </div>
  );
}
