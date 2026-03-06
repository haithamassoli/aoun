"use client";

import { useEffect } from "react";
import { saveLastVisitedMajor } from "@/lib/student-progress";

export function MajorLastVisitTracker({
  universitySlug,
  majorSlug,
}: {
  universitySlug: string;
  majorSlug: string;
}) {
  useEffect(() => {
    saveLastVisitedMajor({ universitySlug, majorSlug });
  }, [majorSlug, universitySlug]);

  return null;
}
