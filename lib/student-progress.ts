import {
  COURSE_STATUS_STORAGE_KEY,
  LAST_MAJOR_STORAGE_KEY,
} from "@/lib/local-storage-keys";

export type CourseProgressStatus =
  | "completed"
  | "in_progress"
  | "hidden"
  | "none";

export type LastVisitedMajor = {
  universitySlug: string;
  majorSlug: string;
};

export const LAST_MAJOR_COOKIE = "aoun_student_last_major_v1";
export const LAST_MAJOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const VALID_STATUSES = new Set<CourseProgressStatus>([
  "completed",
  "in_progress",
  "hidden",
  "none",
]);

type CourseStatusMap = Record<string, CourseProgressStatus>;

let cachedCourseStatuses: CourseStatusMap | null = null;
let cachedLastMajor: LastVisitedMajor | null | undefined;

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseCourseStatuses(raw: string | null): CourseStatusMap {
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const sanitized: CourseStatusMap = {};
    for (const [courseId, status] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (typeof status !== "string") {
        continue;
      }

      if (VALID_STATUSES.has(status as CourseProgressStatus) && status !== "none") {
        sanitized[courseId] = status as CourseProgressStatus;
      }
    }

    return sanitized;
  } catch {
    return {};
  }
}

function parseLastVisitedMajor(raw: string | null): LastVisitedMajor | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const target = parsed as Record<string, unknown>;
    if (
      typeof target.universitySlug !== "string" ||
      typeof target.majorSlug !== "string" ||
      !target.universitySlug ||
      !target.majorSlug
    ) {
      return null;
    }

    return {
      universitySlug: target.universitySlug,
      majorSlug: target.majorSlug,
    };
  } catch {
    return null;
  }
}

export function parseLastVisitedMajorCookie(
  value: string | null | undefined,
): LastVisitedMajor | null {
  if (!value) {
    return null;
  }

  try {
    return parseLastVisitedMajor(decodeURIComponent(value));
  } catch {
    return parseLastVisitedMajor(value);
  }
}

export function encodeLastVisitedMajorCookie(target: LastVisitedMajor) {
  return encodeURIComponent(JSON.stringify(target));
}

function secureCookieSuffix() {
  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "; Secure"
    : "";
}

function persistLastVisitedMajorCookie(target: LastVisitedMajor) {
  if (!canUseStorage()) {
    return;
  }

  try {
    document.cookie = `${LAST_MAJOR_COOKIE}=${encodeLastVisitedMajorCookie(
      target,
    )}; Max-Age=${LAST_MAJOR_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secureCookieSuffix()}`;
  } catch {
    // Cookies may be blocked by the browser.
  }
}

function removeLastVisitedMajorCookie() {
  if (!canUseStorage()) {
    return;
  }

  try {
    document.cookie = `${LAST_MAJOR_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secureCookieSuffix()}`;
  } catch {
    // Cookies may be blocked by the browser.
  }
}

export function loadCourseStatuses(): CourseStatusMap {
  if (cachedCourseStatuses !== null) {
    return cachedCourseStatuses;
  }

  if (!canUseStorage()) {
    cachedCourseStatuses = {};
    return cachedCourseStatuses;
  }

  cachedCourseStatuses = parseCourseStatuses(
    window.localStorage.getItem(COURSE_STATUS_STORAGE_KEY),
  );
  return cachedCourseStatuses;
}

export function getCourseStatus(courseId: string): CourseProgressStatus {
  return loadCourseStatuses()[courseId] ?? "none";
}

function persistCourseStatuses(statuses: CourseStatusMap) {
  if (!canUseStorage()) {
    return;
  }

  try {
    if (Object.keys(statuses).length === 0) {
      window.localStorage.removeItem(COURSE_STATUS_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(COURSE_STATUS_STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function setCourseStatus(
  courseId: string,
  status: CourseProgressStatus,
): CourseStatusMap {
  const nextStatuses = { ...loadCourseStatuses() };

  if (status === "none") {
    delete nextStatuses[courseId];
  } else {
    nextStatuses[courseId] = status;
  }

  cachedCourseStatuses = nextStatuses;
  persistCourseStatuses(nextStatuses);

  return nextStatuses;
}

export function loadLastVisitedMajor(): LastVisitedMajor | null {
  if (cachedLastMajor !== undefined) {
    return cachedLastMajor;
  }

  if (!canUseStorage()) {
    cachedLastMajor = null;
    return cachedLastMajor;
  }

  cachedLastMajor = parseLastVisitedMajor(
    window.localStorage.getItem(LAST_MAJOR_STORAGE_KEY),
  );
  return cachedLastMajor;
}

export function saveLastVisitedMajor(target: LastVisitedMajor) {
  cachedLastMajor = target;

  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_MAJOR_STORAGE_KEY, JSON.stringify(target));
  } catch {
    // Local storage may be blocked by the browser.
  }

  persistLastVisitedMajorCookie(target);
}

export function clearLastVisitedMajor() {
  cachedLastMajor = null;

  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(LAST_MAJOR_STORAGE_KEY);
  } catch {
    // Local storage may be blocked by the browser.
  }

  removeLastVisitedMajorCookie();
}
