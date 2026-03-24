"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type MobilePageHeaderMenuProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function MobilePageHeaderMenu({
  title,
  subtitle,
  children,
}: MobilePageHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <section className="sticky top-0 z-40 border-b border-surface-200 bg-white/90 backdrop-blur-xl md:hidden dark:border-surface-700 dark:bg-surface-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Link
                href="."
                aria-label="العودة"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50/90 text-surface-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.8)] transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/70 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 4.5 15.75 12 9 19.5"
                  />
                </svg>
              </Link>

              <div className="min-w-0">
                <p
                  id={titleId}
                  className="truncate text-base font-semibold text-surface-900 dark:text-surface-50"
                >
                  {title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-surface-500 dark:text-surface-400">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label={"فتح القائمة"}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50/90 text-surface-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.8)] transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/70 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 7.5h15M4.5 12h15m-15 4.5h15"
              />
            </svg>
          </button>
        </div>
      </section>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.18,
                ease: "easeOut",
              }}
              className="absolute inset-0 bg-surface-950/45 backdrop-blur-sm"
            />

            <motion.div
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, x: -28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24, scale: 0.985 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 34,
                mass: 0.9,
              }}
              className="absolute inset-y-0 end-0 flex w-[min(24rem,calc(100vw-1rem))] max-w-full flex-col overflow-hidden border-surface-200 bg-white/95 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-surface-700 dark:bg-surface-950/95"
            >
              <motion.div
                aria-hidden="true"
                initial={false}
                animate={{ opacity: [0.7, 1, 0.75] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/70 to-transparent dark:via-primary-500/60"
              />

              <div className="flex items-start justify-end px-5 pt-5">
                <motion.button
                  type="button"
                  aria-label="إغلاق القائمة"
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50/90 text-surface-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.8)] transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/70 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
                <div className="space-y-5">{children}</div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
