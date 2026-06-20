"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HeroSpotlightProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MASK_RADIUS = 180;
const LERP_FACTOR = 0.08;

/* Card positions (percentage-based) */
const CARDS = [
  {
    id: "doc",
    icon: "doc",
    label: "ملخصات",
    top: "18%",
    insetInlineStart: "12%",
    revealX: 14,
    revealY: 20,
  },
  {
    id: "cap",
    icon: "cap",
    label: "تخصصات",
    top: "55%",
    insetInlineStart: "68%",
    revealX: 70,
    revealY: 57,
  },
  {
    id: "search",
    icon: "search",
    label: "بحث",
    top: "72%",
    insetInlineStart: "22%",
    revealX: 24,
    revealY: 74,
  },
  {
    id: "stats",
    icon: "stats",
    label: "إحصائيات",
    top: "30%",
    insetInlineStart: "78%",
    revealX: 80,
    revealY: 32,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
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

function CapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
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

function StatsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
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

const ICON_MAP: Record<string, typeof DocIcon> = {
  doc: DocIcon,
  cap: CapIcon,
  search: SearchIcon,
  stats: StatsIcon,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HeroSpotlight({ className }: HeroSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<Position>({ x: -999, y: -999 }); // smoothed
  const targetRef = useRef<Position>({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);
  const [maskPos, setMaskPos] = useState<Position>({ x: -999, y: -999 });
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  /* ---- detect mobile ---- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ---- mouse tracking + lerp ---- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      targetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [isMobile],
  );

  useEffect(() => {
    if (prefersReducedMotion || isMobile) return;

    function animate() {
      const pos = posRef.current;
      const target = targetRef.current;
      pos.x += (target.x - pos.x) * LERP_FACTOR;
      pos.y += (target.y - pos.y) * LERP_FACTOR;
      setMaskPos({ x: pos.x, y: pos.y });
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [prefersReducedMotion, isMobile]);

  /* ---- mobile automatic drift (CSS-driven via state) ---- */
  const [driftPhase, setDriftPhase] = useState(0);

  useEffect(() => {
    if (!isMobile || prefersReducedMotion) return;

    let frame = 0;
    const container = containerRef.current;
    if (!container) return;

    function drift() {
      frame++;
      // figure-8 path
      const t = frame * 0.008;
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      const x = w * 0.5 + Math.sin(t) * w * 0.28;
      const y = h * 0.45 + Math.sin(t * 2) * h * 0.18;
      setMaskPos({ x, y });
      setDriftPhase(requestAnimationFrame(drift));
    }

    setDriftPhase(requestAnimationFrame(drift));
    return () => cancelAnimationFrame(driftPhase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, prefersReducedMotion]);

  /* ---- don't render reveal on reduced motion ---- */
  const showReveal = !prefersReducedMotion;

  /* ---- dot grid background ---- */
  const dotGridBase =
    "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)";
  const dotGridReveal =
    "radial-gradient(circle, rgba(59,130,246,0.5) 1.2px, transparent 1.2px)";

  /* ---- mask style ---- */
  const maskGradient = `radial-gradient(circle ${MASK_RADIUS}px at ${maskPos.x}px ${maskPos.y}px, black 0%, transparent 100%)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
      className={`pointer-events-auto absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {/* ======== BASE LAYER ======== */}
      <div className="absolute inset-0">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-60 dark:opacity-40"
          style={{
            backgroundImage: dotGridBase,
            backgroundSize: "30px 30px",
          }}
        />

        {/* Glassmorphic mini-cards */}
        {CARDS.map((card) => {
          const IconComp = ICON_MAP[card.icon];
          return (
            <div
              key={card.id}
              className="animate-float absolute rounded-xl border border-white/15 bg-white/8 px-3 py-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5"
              style={{
                top: card.top,
                insetInlineStart: card.insetInlineStart,
                animationDuration:
                  card.id === "doc"
                    ? "3.5s"
                    : card.id === "cap"
                      ? "4s"
                      : card.id === "search"
                        ? "3.8s"
                        : "4.5s",
                animationDelay:
                  card.id === "doc"
                    ? "0s"
                    : card.id === "cap"
                      ? "0.4s"
                      : card.id === "search"
                        ? "0.8s"
                        : "1.2s",
              }}
            >
              <div className="flex items-center gap-2">
                <IconComp className="size-4 text-white/60" />
                <span className="text-xs text-white/70">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======== REVEAL LAYER ======== */}
      {showReveal && (
        <div
          className="absolute inset-0"
          style={{
            maskImage: maskGradient,
            WebkitMaskImage: maskGradient,
          }}
        >
          {/* Glowing dot grid */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage: dotGridReveal,
              backgroundSize: "30px 30px",
            }}
          />

          {/* SVG connection lines + glowing orbs */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow-line">
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-orb">
                <feGaussianBlur stdDeviation="0.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines between cards */}
            <line
              x1={CARDS[0].revealX}
              y1={CARDS[0].revealY}
              x2={CARDS[1].revealX}
              y2={CARDS[1].revealY}
              stroke="rgba(96,165,250,0.4)"
              strokeWidth="0.3"
              filter="url(#glow-line)"
            />
            <line
              x1={CARDS[1].revealX}
              y1={CARDS[1].revealY}
              x2={CARDS[2].revealX}
              y2={CARDS[2].revealY}
              stroke="rgba(139,92,246,0.35)"
              strokeWidth="0.3"
              filter="url(#glow-line)"
            />
            <line
              x1={CARDS[2].revealX}
              y1={CARDS[2].revealY}
              x2={CARDS[0].revealX}
              y2={CARDS[0].revealY}
              stroke="rgba(96,165,250,0.3)"
              strokeWidth="0.25"
              filter="url(#glow-line)"
            />
            <line
              x1={CARDS[3].revealX}
              y1={CARDS[3].revealY}
              x2={CARDS[0].revealX}
              y2={CARDS[0].revealY}
              stroke="rgba(139,92,246,0.3)"
              strokeWidth="0.25"
              filter="url(#glow-line)"
            />
            <line
              x1={CARDS[3].revealX}
              y1={CARDS[3].revealY}
              x2={CARDS[1].revealX}
              y2={CARDS[1].revealY}
              stroke="rgba(96,165,250,0.25)"
              strokeWidth="0.2"
              filter="url(#glow-line)"
            />

            {/* Glowing orbs at card positions */}
            {CARDS.map((card) => (
              <circle
                key={`orb-${card.id}`}
                cx={card.revealX}
                cy={card.revealY}
                r="1.2"
                fill="rgba(96,165,250,0.7)"
                filter="url(#glow-orb)"
              />
            ))}

            {/* Midpoint intersection orbs */}
            <circle
              cx={(CARDS[0].revealX + CARDS[1].revealX) / 2}
              cy={(CARDS[0].revealY + CARDS[1].revealY) / 2}
              r="0.6"
              fill="rgba(139,92,246,0.5)"
              filter="url(#glow-orb)"
            />
            <circle
              cx={(CARDS[1].revealX + CARDS[2].revealX) / 2}
              cy={(CARDS[1].revealY + CARDS[2].revealY) / 2}
              r="0.6"
              fill="rgba(96,165,250,0.45)"
              filter="url(#glow-orb)"
            />
          </svg>

          {/* Reveal-layer card variants (blueprint style) */}
          {CARDS.map((card) => {
            const IconComp = ICON_MAP[card.icon];
            return (
              <div
                key={`reveal-${card.id}`}
                className="absolute rounded-xl border border-primary-400/40 bg-primary-500/15 px-3 py-2 shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md"
                style={{
                  top: card.top,
                  insetInlineStart: card.insetInlineStart,
                }}
              >
                <div className="flex items-center gap-2">
                  <IconComp className="size-4 text-primary-400" />
                  <span className="text-xs font-medium text-primary-300">
                    {card.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
