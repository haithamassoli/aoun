"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { isStudentFacingPath } from "@/lib/public-shell";

export function PublicShellChrome() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (!isStudentFacingPath(pathname)) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        initial={false}
        animate={
          prefersReducedMotion
            ? { opacity: 0.85 }
            : {
                opacity: [0.82, 1, 0.86],
                x: [0, -18, 10, 0],
                y: [0, 14, -10, 0],
              }
        }
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute start-[-12rem] top-[-8rem] h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.17)_0%,rgba(37,99,235,0.08)_34%,transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(96,165,250,0.18)_0%,rgba(37,99,235,0.08)_34%,transparent_72%)]"
      />
      <motion.div
        initial={false}
        animate={
          prefersReducedMotion
            ? { opacity: 0.7 }
            : {
                opacity: [0.58, 0.82, 0.64],
                x: [0, 22, -12, 0],
                y: [0, -20, 8, 0],
              }
        }
        transition={{
          duration: 18,
          delay: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute end-[-9rem] top-[18vh] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12)_0%,rgba(56,189,248,0.06)_38%,transparent_74%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(14,165,233,0.16)_0%,rgba(14,165,233,0.08)_38%,transparent_74%)]"
      />
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(248,250,252,0.18)_56%,transparent_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82)_0%,rgba(2,6,23,0.14)_56%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.36),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.38),transparent)]" />
    </div>
  );
}
