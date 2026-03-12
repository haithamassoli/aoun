"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  getOrCreateVisitorKey,
  getVisitorDateKey,
  hasTrackedVisitorForDate,
  isTrackableVisitorPath,
  markVisitorTrackedForDate,
} from "@/lib/visitor-analytics";

export function VisitorTracker() {
  const pathname = usePathname();
  const trackVisitorVisit = useMutation(api.dashboard.trackVisitorVisit);

  useEffect(() => {
    if (!isTrackableVisitorPath(pathname)) {
      return;
    }

    const dateKey = getVisitorDateKey();
    if (hasTrackedVisitorForDate(dateKey)) {
      return;
    }

    const visitorKey = getOrCreateVisitorKey();
    void trackVisitorVisit({ visitorKey, pathname })
      .then(() => {
        markVisitorTrackedForDate(dateKey);
      })
      .catch(() => {
        // Visitor analytics should never block navigation.
      });
  }, [pathname, trackVisitorVisit]);

  return null;
}
