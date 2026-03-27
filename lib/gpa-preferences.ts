import { useSyncExternalStore } from "react";
import { DEFAULT_GRADE_SCALE, type GradeType } from "@/lib/gpa-utils";
import {
  GPA_GRADE_TYPE_STORAGE_KEY,
  GPA_SUPPORTS_42_SCALE_STORAGE_KEY,
} from "@/lib/local-storage-keys";

const VALID_GRADE_TYPES = new Set<GradeType>([
  "letter",
  "percentage",
  "points",
]);
const GPA_PREFERENCES_CHANGE_EVENT = "aoun:gpa-preferences-changed";

function canUseStorage() {
  return typeof window !== "undefined";
}

function subscribeToPreferenceChanges(listener: () => void) {
  if (!canUseStorage()) {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.localStorage &&
      (event.key === GPA_SUPPORTS_42_SCALE_STORAGE_KEY ||
        event.key === GPA_GRADE_TYPE_STORAGE_KEY)
    ) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(GPA_PREFERENCES_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(GPA_PREFERENCES_CHANGE_EVENT, listener);
  };
}

function notifyPreferenceChange() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(GPA_PREFERENCES_CHANGE_EVENT));
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
    notifyPreferenceChange();
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
    notifyPreferenceChange();
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function useGradeTypePreference(defaultGradeType: GradeType = "letter") {
  return useSyncExternalStore(
    subscribeToPreferenceChanges,
    () => loadGradeTypePreference(defaultGradeType),
    () => defaultGradeType,
  );
}
