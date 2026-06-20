"use client";

import dynamic from "next/dynamic";

/* ---- Lazy-loaded heavy hero visuals (client-only) ---- */
const HeroCanvasBg = dynamic(
  () => import("@/components/landing/hero-canvas-bg"),
  { ssr: false },
);
const HeroSpotlight = dynamic(
  () => import("@/components/landing/hero-spotlight"),
  { ssr: false },
);
const FloatingUiCards = dynamic(
  () => import("@/components/landing/floating-ui-cards"),
  { ssr: false },
);

/**
 * Client wrapper that renders the three heavy hero visual layers.
 * Uses next/dynamic with ssr:false so Canvas/DOM-dependent code
 * only loads on the client.
 */
export function HeroVisuals() {
  return (
    <>
      <HeroCanvasBg />
      <HeroSpotlight />
      <FloatingUiCards />
    </>
  );
}
