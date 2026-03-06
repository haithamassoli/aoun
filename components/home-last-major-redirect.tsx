"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type LastVisitedMajor,
  clearLastVisitedMajor,
  loadLastVisitedMajor,
} from "@/lib/student-progress";

export function HomeLastMajorRedirect() {
  const router = useRouter();
  const [storedTarget] = useState<LastVisitedMajor | null>(() =>
    loadLastVisitedMajor(),
  );
  const hasClearedInvalidTarget = useRef(false);

  const validatedTarget = useQuery(
    api.majors.validateLastVisitedMajor,
    storedTarget
      ? {
          universitySlug: storedTarget.universitySlug,
          majorSlug: storedTarget.majorSlug,
        }
      : "skip",
  );

  useEffect(() => {
    if (!storedTarget || validatedTarget === undefined) {
      return;
    }

    if (validatedTarget) {
      router.replace(
        `/${validatedTarget.universitySlug}/${validatedTarget.majorSlug}`,
      );
      return;
    }

    if (!hasClearedInvalidTarget.current) {
      clearLastVisitedMajor();
      hasClearedInvalidTarget.current = true;
    }
  }, [router, storedTarget, validatedTarget]);

  return null;
}
