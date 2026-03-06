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

const HOME_LAST_MAJOR_REDIRECT_SESSION_KEY =
  "aoun:student:home-last-major-redirect:v1";

function hasRedirectedThisSession() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(HOME_LAST_MAJOR_REDIRECT_SESSION_KEY) === "1"
    );
  } catch {
    return false;
  }
}

function markRedirectedThisSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(HOME_LAST_MAJOR_REDIRECT_SESSION_KEY, "1");
  } catch {
    // Session storage may be blocked by the browser.
  }
}

export function HomeLastMajorRedirect() {
  const router = useRouter();
  const [storedTarget] = useState<LastVisitedMajor | null>(() =>
    loadLastVisitedMajor(),
  );
  const [shouldRedirect] = useState(() => !hasRedirectedThisSession());
  const hasHandledRedirect = useRef(false);
  const hasClearedInvalidTarget = useRef(false);

  const validatedTarget = useQuery(
    api.majors.validateLastVisitedMajor,
    storedTarget && shouldRedirect
      ? {
          universitySlug: storedTarget.universitySlug,
          majorSlug: storedTarget.majorSlug,
        }
      : "skip",
  );

  useEffect(() => {
    if (
      !shouldRedirect ||
      hasHandledRedirect.current ||
      !storedTarget ||
      validatedTarget === undefined
    ) {
      return;
    }

    hasHandledRedirect.current = true;
    markRedirectedThisSession();

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
  }, [router, shouldRedirect, storedTarget, validatedTarget]);

  return null;
}
