"use client";

import { useReducedMotion } from "motion/react";
import React, { useCallback, useRef, useState } from "react";


/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt in degrees. @default 8 */
  tiltAmount?: number;
  /** Show a light‑glare overlay that follows the cursor. @default true */
  glare?: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export function TiltCard({
  children,
  className,
  tiltAmount = 8,
  glare = true,
}: TiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Transform state driven by cursor position
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({});

  const disabled = prefersReducedMotion || isTouchDevice();

  /* ---- mouse move ---- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left; // cursor x in card
      const y = e.clientY - rect.top; // cursor y in card

      // Normalised –1 → +1 from centre
      const nx = (x / rect.width - 0.5) * 2;
      const ny = (y / rect.height - 0.5) * 2;

      // rotateX is inverted because tilting "towards" top means positive rotation
      const rotateX = -ny * tiltAmount;
      const rotateY = nx * tiltAmount;

      setStyle({
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 80ms linear",
      });

      if (glare) {
        // Position the glare highlight at the cursor location
        setGlareStyle({
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.18) 0%, transparent 60%)`,
          opacity: 1,
        });
      }
    },
    [disabled, tiltAmount, glare],
  );

  /* ---- mouse leave ---- */
  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: "perspective(800px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 500ms cubic-bezier(0.25, 1, 0.5, 1)",
    });

    if (glare) {
      setGlareStyle({ opacity: 0, transition: "opacity 400ms ease" });
    }
  }, [glare]);

  return (
    <div
      ref={cardRef}
      onMouseMove={disabled ? undefined : handleMouseMove}
      onMouseLeave={disabled ? undefined : handleMouseLeave}
      className={`relative rounded-[1.7rem] ${className ?? ""}`}
      style={disabled ? undefined : style}
    >
      {children}

      {/* Glare overlay */}
      {glare && !disabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[1.7rem]"
          style={{
            opacity: 0,
            transition: "opacity 300ms ease",
            ...glareStyle,
          }}
        />
      )}
    </div>
  );
}
