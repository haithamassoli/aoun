"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function isStudentFacingPath(pathname: string) {
  return pathname !== "/login" && !pathname.startsWith("/dashboard");
}

export function PublicRouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const isStudentFacing = isStudentFacingPath(pathname);

  if (!isStudentFacing || prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="public-route-frame"
    >
      {children}
    </motion.div>
  );
}
