"use client";

import { useReducedMotion } from "motion/react";
import Link from "next/link";
import React, { useCallback, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */
type ButtonBaseProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children" | "onClick"
>;

interface MagneticButtonProps extends ButtonBaseProps {
  children: React.ReactNode;
  className?: string;
  /** If provided the component renders as a Next.js Link. */
  href?: string;
  onClick?: () => void;
  /** How strongly the button follows the cursor (0–1). @default 0.3 */
  magneticStrength?: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/* ------------------------------------------------------------------ */
/* Shared visual classes                                              */
/* ------------------------------------------------------------------ */
const BUTTON_BASE =
  "relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-8 py-4 text-lg font-bold bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-lg transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

/* ------------------------------------------------------------------ */
/* Shimmer keyframe (injected once via a <style> tag)                 */
/* ------------------------------------------------------------------ */
const SHIMMER_ID = "magnetic-btn-shimmer";

function ensureShimmerStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SHIMMER_ID)) return;

  const style = document.createElement("style");
  style.id = SHIMMER_ID;
  style.textContent = `
    @keyframes magnetic-shimmer {
      0%   { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export function MagneticButton({
  children,
  className,
  href,
  onClick,
  magneticStrength = 0.3,
  ...rest
}: MagneticButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const disabled = prefersReducedMotion || isTouchDevice();

  /* ---- ensure shimmer keyframe is available ---- */
  React.useEffect(() => {
    if (!prefersReducedMotion) ensureShimmerStyle();
  }, [prefersReducedMotion]);

  /* ---- mouse move ---- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) * magneticStrength;
      const dy = (e.clientY - cy) * magneticStrength;

      setOffset({ x: dx, y: dy });
    },
    [disabled, magneticStrength],
  );

  /* ---- mouse enter / leave ---- */
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  /* ---- inner transform style ---- */
  const innerStyle: React.CSSProperties = disabled
    ? {}
    : {
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
      };

  /* ---- shimmer overlay (diagonal light sweep) ---- */
  const shimmer = !prefersReducedMotion && (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
        animation: isHovered ? "magnetic-shimmer 0.7s ease-out forwards" : "none",
        opacity: isHovered ? 1 : 0,
      }}
    />
  );

  const buttonClasses = `${BUTTON_BASE} ${className ?? ""}`;

  /* ---- shared content ---- */
  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {shimmer}
    </>
  );

  /* ---- render ---- */
  return (
    <div
      ref={wrapperRef}
      onMouseMove={disabled ? undefined : handleMouseMove}
      onMouseEnter={disabled ? undefined : handleMouseEnter}
      onMouseLeave={disabled ? undefined : handleMouseLeave}
      className="inline-block"
    >
      {href ? (
        <Link
          href={href}
          className={buttonClasses}
          style={innerStyle}
          onClick={onClick}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          className={buttonClasses}
          style={innerStyle}
          onClick={onClick}
          {...rest}
        >
          {content}
        </button>
      )}
    </div>
  );
}
