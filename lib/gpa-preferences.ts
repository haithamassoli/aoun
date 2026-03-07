import { useSyncExternalStore } from "react";
import { DEFAULT_GRADE_SCALE, type GradeType } from "@/lib/gpa-utils";

const STORAGE_NAMESPACE = "aoun:gpa";
const STORAGE_VERSION = "v1";

export const GPA_SUPPORTS_42_SCALE_STORAGE_KEY =
  `${STORAGE_NAMESPACE}:supports-42-scale:${STORAGE_VERSION}`;
export const GPA_GRADE_TYPE_STORAGE_KEY =
  `${STORAGE_NAMESPACE}:grade-type:${STORAGE_VERSION}`;

const VALID_GRADE_TYPES = new Set<GradeType>([
  "letter",
  "percentage",
  "points",
]);
const noopSubscribe = () => () => {};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function loadSupports42ScalePreference() {
  if (!canUseStorage()) {
    return DEFAULT_GRADE_SCALE === "just";
  }

  try {
    const raw = window.localStorage.getItem(GPA_SUPPORTS_42_SCALE_STORAGE_KEY);

    if (raw === "1") {
      return true;
    }

    if (raw === "0") {
      return false;
    }
  } catch {
    // Local storage may be blocked by the browser.
  }

  return DEFAULT_GRADE_SCALE === "just";
}

export function saveSupports42ScalePreference(supports42Scale: boolean) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      GPA_SUPPORTS_42_SCALE_STORAGE_KEY,
      supports42Scale ? "1" : "0",
    );
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function loadGradeTypePreference(defaultGradeType: GradeType = "letter") {
  if (!canUseStorage()) {
    return defaultGradeType;
  }

  try {
    const raw = window.localStorage.getItem(GPA_GRADE_TYPE_STORAGE_KEY);

    if (raw && VALID_GRADE_TYPES.has(raw as GradeType)) {
      return raw as GradeType;
    }
  } catch {
    // Local storage may be blocked by the browser.
  }

  return defaultGradeType;
}

export function saveGradeTypePreference(gradeType: GradeType) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(GPA_GRADE_TYPE_STORAGE_KEY, gradeType);
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function useGradeTypePreference(defaultGradeType: GradeType = "letter") {
  return useSyncExternalStore(
    noopSubscribe,
    () => loadGradeTypePreference(defaultGradeType),
    () => defaultGradeType,
  );
}
