"use client";

import {
  type HTMLMotionProps,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import React, { useRef } from "react";


/* ------------------------------------------------------------------ */
/* Variant map                                                        */
/* ------------------------------------------------------------------ */
type RevealVariant = "fade-up" | "fade-in" | "scale-up" | "slide-start";

const variants: Record<
  RevealVariant,
  { initial: HTMLMotionProps<"div">["initial"]; animate: HTMLMotionProps<"div">["animate"] }
> = {
  "fade-up": {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
  },
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  "scale-up": {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
  /** x: 40 slides from the inline‑start side (right in RTL) */
  "slide-start": {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
  },
};

/* ------------------------------------------------------------------ */
/* ScrollReveal                                                       */
/* ------------------------------------------------------------------ */
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation variant. @default "fade-up" */
  variant?: RevealVariant;
  /** Delay in seconds before animation starts. @default 0 */
  delay?: number;
  /** Animation duration in seconds. @default 0.6 */
  duration?: number;
  /** Animate only once (don't replay on re‑enter). @default true */
  once?: boolean;
  /** Fraction of element that must be visible (0–1). @default 0.2 */
  amount?: number;
}

export function ScrollReveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.2,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });
  const prefersReducedMotion = useReducedMotion();

  const { initial, animate } = variants[variant];

  // Reduced‑motion: render children immediately, no animation wrapper
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={{
        duration,
        delay,
        ease: [0.25, 1, 0.5, 1], // ease-out-quart matching project token
      }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* ScrollRevealGroup — staggers its direct children                    */
/* ------------------------------------------------------------------ */
interface ScrollRevealGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Base variant applied to every child. @default "fade-up" */
  variant?: RevealVariant;
  /** Seconds between each child's animation start. @default 0.08 */
  staggerDelay?: number;
  /** Base delay before the first child animates. @default 0 */
  baseDelay?: number;
  /** Duration per child animation. @default 0.6 */
  duration?: number;
  /** Only animate once. @default true */
  once?: boolean;
  /** Fraction of element visible to trigger. @default 0.2 */
  amount?: number;
}

export function ScrollRevealGroup({
  children,
  className,
  variant = "fade-up",
  staggerDelay = 0.08,
  baseDelay = 0,
  duration = 0.6,
  once = true,
  amount = 0.2,
}: ScrollRevealGroupProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, index) => (
        <ScrollReveal
          key={index}
          variant={variant}
          delay={baseDelay + index * staggerDelay}
          duration={duration}
          once={once}
          amount={amount}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
