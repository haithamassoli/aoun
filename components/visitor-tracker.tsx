"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  getOrCreateVisitorKey,
  isTrackableVisitorPath,
} from "@/lib/visitor-analytics";

export function VisitorTracker() {
  const pathname = usePathname();
  const trackVisitorVisit = useMutation(api.dashboard.trackVisitorVisit);
  const previousTrackablePathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isTrackableVisitorPath(pathname)) {
      previousTrackablePathnameRef.current = null;
      return;
    }

    const visitorKey = getOrCreateVisitorKey();
    const referrerPath = previousTrackablePathnameRef.current ?? undefined;
    previousTrackablePathnameRef.current = pathname;

    void trackVisitorVisit({ visitorKey, pathname, referrerPath })
      .catch(() => {
        // Visitor analytics should never block navigation.
      });
  }, [pathname, trackVisitorVisit]);

  return null;
}
