"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type LastVisitedMajor,
  clearLastVisitedMajor,
  loadLastVisitedMajor,
  saveLastVisitedMajor,
} from "@/lib/student-progress";

function subscribeToClientHydration() {
  return () => {};
}

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToClientHydration,
    () => true,
    () => false,
  );
}

export function HomeLastMajorRedirect() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const hasHydrated = useHasHydrated();
  const [storedTarget] = useState<LastVisitedMajor | null>(() =>
    loadLastVisitedMajor(),
  );
  const hasHandledRedirect = useRef(false);
  const hasClearedInvalidTarget = useRef(false);

  const validatedTarget = useQuery(
    api.majors.validateLastVisitedMajor,
    storedTarget
      ? {
          universitySlug: storedTarget.universitySlug,
          majorSlug: storedTarget.majorSlug,
        }
      : "skip",
  );
  const isRedirecting = Boolean(storedTarget && validatedTarget !== null);

  useEffect(() => {
    if (
      hasHandledRedirect.current ||
      !storedTarget ||
      validatedTarget === undefined
    ) {
      return;
    }

    hasHandledRedirect.current = true;

    if (validatedTarget) {
      saveLastVisitedMajor(validatedTarget);
      const targetHref = `/${encodeURIComponent(
        validatedTarget.universitySlug,
      )}/${encodeURIComponent(validatedTarget.majorSlug)}`;
      const timeoutId = window.setTimeout(
        () => {
          router.replace(targetHref);
        },
        prefersReducedMotion ? 0 : 180,
      );

      return () => window.clearTimeout(timeoutId);
    }

    if (!hasClearedInvalidTarget.current) {
      clearLastVisitedMajor();
      hasClearedInvalidTarget.current = true;
    }
  }, [
    prefersReducedMotion,
    router,
    storedTarget,
    validatedTarget,
  ]);

  return (
    <AnimatePresence>
      {hasHydrated && isRedirecting ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-white/96 px-6 text-center backdrop-blur-xl dark:bg-surface-950/96"
        >
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -8, scale: 0.99 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.34,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex max-w-sm flex-col items-center"
          >
            <div className="relative mb-6 flex size-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 shadow-[0_18px_60px_rgba(37,99,235,0.18)] dark:bg-primary-950/70 dark:text-primary-300 dark:shadow-[0_18px_60px_rgba(37,99,235,0.24)]">
              <motion.div
                aria-hidden="true"
                animate={
                  prefersReducedMotion ? { opacity: 0.7 } : { rotate: 360 }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 1.2, repeat: Infinity, ease: "linear" }
                }
                className="absolute inset-0 rounded-full border border-primary-200 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-300"
              />
              <svg
                className="relative size-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a1.5 1.5 0 01-2.25 1.3L12 15.5 6.25 18.8A1.5 1.5 0 014 17.5v-11z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-surface-950 dark:text-white">
              نفتح آخر تخصص زرته
            </h2>
            <p className="mt-3 text-sm leading-7 text-surface-500 dark:text-surface-400">
              لحظة ونرجعك للمكان الذي توقفت عنده.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
