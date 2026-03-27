"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { DeveloperSupportButton } from "@/components/developer-support-button";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  {
    ssr: false,
    loading: () => <div className="h-9 w-9" aria-hidden="true" />,
  },
);

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
  const [menuViewportTop, setMenuViewportTop] = useState(0);
  const panelId = useId();
  const titleId = useId();

  const openMenu = () => {
    setMenuViewportTop(window.scrollY);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverflowX = document.body.style.overflowX;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousDocumentOverflowX = document.documentElement.style.overflowX;
    const previousDocumentOverscrollBehavior =
      document.documentElement.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflowX = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.documentElement.style.overscrollBehavior =
        previousDocumentOverscrollBehavior;
      document.body.style.overflow = previousOverflow;
      document.body.style.overflowX = previousOverflowX;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
      document.documentElement.style.overflowX = previousDocumentOverflowX;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <section className="sticky top-0 z-40 border-b border-surface-200 bg-white/90 backdrop-blur-xl md:hidden dark:border-surface-700 dark:bg-surface-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
            >
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
                  className="truncate text-base font-semibold tracking-[-0.015em] text-surface-900 dark:text-surface-50"
                >
                  {title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-surface-500 dark:text-surface-400">
                  {subtitle}
                </p>
              </div>
            </motion.div>
          </div>

          <button
            type="button"
            aria-label={"فتح القائمة"}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            onClick={openMenu}
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

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence initial={false}>
              {isOpen ? (
                <div
                  className="absolute inset-x-0 z-50 overflow-x-hidden md:hidden"
                  style={{ top: menuViewportTop, height: "100dvh" }}
                >
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
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{
                      duration: 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute inset-y-0 end-0 flex w-[min(24rem,calc(100vw-1rem))] max-w-full flex-col overflow-hidden border-surface-200 bg-white/95 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl will-change-transform dark:border-surface-700 dark:bg-surface-950/95"
                  >
                    <div className="relative flex items-center justify-between gap-3 px-5 pt-5">
                      <div className="pointer-events-none absolute inset-x-5 top-2 h-16 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12)_0%,transparent_72%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(96,165,250,0.16)_0%,transparent_72%)]" />
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        عـون
                      </span>
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

                    <div className="flex flex-1 flex-col justify-between overflow-x-hidden px-5 pb-5 pt-4">
                      <div className="space-y-5">
                        {children}

                        <div className="space-y-3 border-t border-surface-200 pt-2 dark:border-surface-800">
                          <div className="flex items-center gap-3">
                            <Link
                              href="/settings"
                              onClick={() => setIsOpen(false)}
                              className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 text-sm font-medium text-surface-700 shadow-sm transition-all hover:border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-950/40 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-900"
                            >
                              <span>الإعدادات</span>
                              <svg
                                className="h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </Link>

                            <div className="shrink-0 rounded-2xl border border-surface-200/80 bg-white/92 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-950/92 dark:shadow-[0_12px_30px_rgba(2,6,23,0.42)]">
                              <ThemeToggle />
                            </div>
                          </div>

                          <div className="w-full rounded-2xl border border-surface-200 bg-white px-4 py-3 text-center shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-surface-700 dark:bg-surface-950/40 dark:hover:border-primary-700 dark:hover:bg-primary-950/70">
                            <DeveloperSupportButton />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
