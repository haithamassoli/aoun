export type CourseProgressStatus = "completed" | "in_progress" | "none";

export type LastVisitedMajor = {
  universitySlug: string;
  majorSlug: string;
};

const STORAGE_NAMESPACE = "aoun:student";
const STORAGE_VERSION = "v1";

export const COURSE_STATUS_STORAGE_KEY =
  `${STORAGE_NAMESPACE}:course-status:${STORAGE_VERSION}`;
export const LAST_MAJOR_STORAGE_KEY =
  `${STORAGE_NAMESPACE}:last-major:${STORAGE_VERSION}`;

const VALID_STATUSES = new Set<CourseProgressStatus>([
  "completed",
  "in_progress",
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
}
