"use client";

import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "motion/react";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { VISITOR_MILESTONE_CELEBRATION_STORAGE_KEY } from "@/lib/local-storage-keys";

const MILESTONE_STEP = 1000;
const CELEBRATION_DURATION_MS = 6400;
const CONFETTI_COLORS = [
  "#facc15",
  "#38bdf8",
  "#60a5fa",
  "#34d399",
  "#fb7185",
  "#f97316",
];

const CONFETTI_PIECES = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  delay: (index % 9) * 0.055,
  duration: 2.25 + (index % 5) * 0.16,
  left: `${(index * 29 + 8) % 100}%`,
  rotate: index % 2 === 0 ? 260 + index * 9 : -220 - index * 7,
  size: 7 + (index % 4) * 2,
  x: (index % 2 === 0 ? 1 : -1) * (24 + (index % 6) * 12),
}));

function getMilestone(visitorsTotal: number) {
  if (visitorsTotal < MILESTONE_STEP) {
    return null;
  }

  return Math.floor(visitorsTotal / MILESTONE_STEP) * MILESTONE_STEP;
}

function getStoredMilestone() {
  const storedValue = window.localStorage.getItem(
    VISITOR_MILESTONE_CELEBRATION_STORAGE_KEY,
  );
  const storedMilestone = Number(storedValue);

  return Number.isFinite(storedMilestone) ? storedMilestone : 0;
}

export function VisitorMilestoneCelebration() {
  const publicVisitors = useQuery(api.dashboard.getPublicVisitorsTotal);
  const visitorsTotal = publicVisitors?.visitorsTotal;
  const prefersReducedMotion = useReducedMotion();
  const [milestone, setMilestone] = useState<number | null>(null);
  const formattedMilestone = useMemo(
    () =>
      milestone === null
        ? ""
        : new Intl.NumberFormat("en-US").format(milestone),
    [milestone],
  );

  useEffect(() => {
    if (visitorsTotal === undefined) {
      return;
    }

    const currentMilestone = getMilestone(visitorsTotal);

    if (currentMilestone === null) {
      return;
    }

    let hideTimeoutId: number | undefined;

    try {
      const storedMilestone = getStoredMilestone();

      if (currentMilestone <= storedMilestone) {
        return;
      }
    } catch {
      // Celebration is optional; storage failures should not affect the page.
    }

    const showTimeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          VISITOR_MILESTONE_CELEBRATION_STORAGE_KEY,
          String(currentMilestone),
        );
      } catch {
        // Celebration is optional; storage failures should not affect the page.
      }

      setMilestone(currentMilestone);
      hideTimeoutId = window.setTimeout(
        () => setMilestone(null),
        CELEBRATION_DURATION_MS,
      );
    }, 0);

    return () => {
      window.clearTimeout(showTimeoutId);

      if (hideTimeoutId !== undefined) {
        window.clearTimeout(hideTimeoutId);
      }
    };
  }, [visitorsTotal]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {milestone !== null && (
          <div
            className="pointer-events-none fixed inset-x-0 top-[calc(0.875rem+env(safe-area-inset-top))] z-[90] flex justify-center px-4 sm:top-[calc(1.5rem+env(safe-area-inset-top))]"
            dir="rtl"
          >
            {!prefersReducedMotion && (
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-80 overflow-hidden"
              >
                {CONFETTI_PIECES.map((piece) => (
                  <m.span
                    key={piece.id}
                    initial={{
                      opacity: 0,
                      y: -36,
                      x: 0,
                      rotate: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [0, 84, 190, 270],
                      x: [0, piece.x * 0.4, piece.x, piece.x * 1.25],
                      rotate: piece.rotate,
                      scale: [0.8, 1, 0.96, 0.82],
                    }}
                    transition={{
                      duration: piece.duration,
                      delay: piece.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute top-0 rounded-[2px] shadow-sm"
                    style={{
                      backgroundColor: piece.color,
                      height: piece.size * 1.45,
                      left: piece.left,
                      width: piece.size,
                    }}
                  />
                ))}
              </div>
            )}

            <m.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-w-[min(92vw,28rem)] items-center gap-3 rounded-2xl border border-white/45 bg-white/92 px-4 py-3 text-start text-sm font-medium text-surface-900 shadow-[0_18px_55px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-950/92 dark:text-surface-50"
            >
              <span className="leading-relaxed">
                وصل عون إلى أكثر من{" "}
                <span className="font-bold tabular-nums">
                  {formattedMilestone}
                </span>{" "}
                زائر. شكراً لكل طالب شاركنا الرحلة.
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg text-primary-700 dark:bg-primary-500/15 dark:text-primary-200">
                🎉
              </span>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
