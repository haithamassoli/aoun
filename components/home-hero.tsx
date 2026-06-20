"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
} from "motion/react";
export function HomeHero({ visitorsTotal }: { visitorsTotal: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  // Smooth out the mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  useMotionValueEvent(smoothX, "change", (latest) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--mouse-x", `${latest}px`);
    }
  });
  useMotionValueEvent(smoothY, "change", (latest) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--mouse-y", `${latest}px`);
    }
  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    };
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    const container = containerRef.current;
    if (container && !prefersReducedMotion) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [mouseX, mouseY, prefersReducedMotion]);
  // Floating animations for abstract objects
  const floatAnimation1 = prefersReducedMotion
    ? {}
    : {
        y: ["-4%", "4%"],
        transition: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut" as const,
        },
      };
  const floatAnimation2 = prefersReducedMotion
    ? {}
    : {
        y: ["4%", "-4%"],
        rotate: [0, 2, -1, 0],
        transition: {
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut" as const,
        },
      };
  const floatAnimation3 = prefersReducedMotion
    ? {}
    : {
        y: ["-2%", "3%"],
        x: ["-1%", "1%"],
        transition: {
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut" as const,
        },
      };
  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-surface-50 px-4 py-24 text-surface-900 dark:bg-[#020617] dark:text-white sm:px-6 sm:py-32 lg:px-8 border-b border-surface-200/50 dark:border-surface-800/50"
    >
      {/* --- Base Background & Grid --- */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.1)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 dark:opacity-10 pointer-events-none" />
      {/* --- Spotlight Layer --- */}
      {!prefersReducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          {/* We use CSS variables for the actual spotlight mask, so we don't trigger React renders */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(96, 165, 250, 0.12), transparent 40%)`,
            }}
          />
        </div>
      )}
      {/* --- Floating Abstract UI Elements --- */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Left Floating Card */}
        <motion.div
          animate={floatAnimation1}
          className="absolute -left-12 top-20 hidden w-64 rounded-2xl border border-surface-200/40 bg-white/30 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:block md:left-4 lg:left-[10%]"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-100/50 dark:bg-primary-900/50">
              <svg
                className="size-5 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="h-4 w-24 rounded-full bg-surface-200/50 dark:bg-surface-700/50" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-full bg-surface-200/40 dark:bg-surface-700/40" />
            <div className="h-2.5 w-4/5 rounded-full bg-surface-200/40 dark:bg-surface-700/40" />
            <div className="h-2.5 w-full rounded-full bg-surface-200/40 dark:bg-surface-700/40" />
          </div>
        </motion.div>
        {/* Right Floating Card */}
        <motion.div
          animate={floatAnimation2}
          className="absolute -right-8 bottom-32 hidden w-56 rounded-2xl border border-surface-200/40 bg-white/30 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:block md:right-8 lg:right-[15%]"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100/50 dark:bg-emerald-900/50">
              <svg
                className="size-4 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="h-3 w-16 rounded-full bg-surface-200/50 dark:bg-surface-700/50" />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="h-8 w-8 rounded-full bg-surface-200/40 dark:bg-surface-700/40" />
            <div className="h-2 w-20 rounded-full bg-primary-200/50 dark:bg-primary-800/50" />
          </div>
        </motion.div>
        {/* Center Top Glowing Node */}
        <motion.div
          animate={floatAnimation3}
          className="absolute left-[60%] top-[10%] hidden size-32 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-600/20 md:block"
        />
      </div>
      {/* --- Main Content --- */}
      <div className="relative z-20 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center justify-center gap-2 rounded-full border border-primary-500/20 bg-primary-50/50 px-4 py-1.5 text-sm font-medium text-primary-600 backdrop-blur-md dark:border-primary-400/20 dark:bg-primary-950/30 dark:text-primary-300"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-primary-500"></span>
          </span>
          المنصة الأكاديمية الأولى
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          <span className="bg-gradient-to-br from-surface-900 to-surface-500 bg-clip-text text-transparent dark:from-white dark:to-surface-400">
            عـــــون
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-600 dark:text-surface-300 sm:text-xl"
        >
          منصة مجانيـة تجمع الملخصـات، الامتحانـات، والمصـادر الأكاديمية لطلاب
          الجامعـات الأردنية
        </motion.p>
        {/* <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-base font-medium text-primary-600 dark:text-primary-400"
        >
          اختر جامعتك وابدأ بتصفح المــواد
        </motion.p> */}
        {visitorsTotal !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto mt-10 inline-flex items-center gap-3 rounded-2xl border border-surface-200/50 bg-white/40 px-5 py-3 text-sm font-medium text-surface-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:scale-105 hover:bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:bg-white/10"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
              <svg
                className="size-5"
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
            <div className="ml-1 flex flex-col items-start text-left">
              <span className="text-xs text-surface-500 dark:text-surface-400">
                إجمالي الـزوار
              </span>
              <span className="mt-0.5 text-base font-bold leading-none tabular-nums">
                {visitorsTotal.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
