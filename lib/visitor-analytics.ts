const STORAGE_NAMESPACE = "aoun:analytics";
const STORAGE_VERSION = "v1";
const AMMAN_TIME_ZONE = "Asia/Amman";
const RESERVED_SEGMENTS = new Set(["dashboard", "login", "offline"]);

export const VISITOR_ID_STORAGE_KEY =
  `${STORAGE_NAMESPACE}:visitor-id:${STORAGE_VERSION}`;
export const VISITOR_TRACKED_DATE_KEY =
  `${STORAGE_NAMESPACE}:visitor-date:${STORAGE_VERSION}`;

const ammanDateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: AMMAN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function canUseStorage() {
  return typeof window !== "undefined";
}

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day",
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function getVisitorDateKey(timestamp = Date.now()) {
  const parts = ammanDateKeyFormatter.formatToParts(new Date(timestamp));
  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  return `${year}-${month}-${day}`;
}

function createVisitorKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVisitorKey() {
  if (!canUseStorage()) {
    return createVisitorKey();
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const nextVisitorKey = createVisitorKey();
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, nextVisitorKey);
    return nextVisitorKey;
  } catch {
    return createVisitorKey();
  }
}

export function hasTrackedVisitorForDate(dateKey: string) {
  if (!canUseStorage()) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(VISITOR_TRACKED_DATE_KEY) === dateKey;
  } catch {
    return false;
  }
}

export function markVisitorTrackedForDate(dateKey: string) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(VISITOR_TRACKED_DATE_KEY, dateKey);
  } catch {
    // Session storage may be blocked.
  }
}

export function isTrackableVisitorPath(pathname: string) {
  if (pathname === "/" || pathname === "/gpa-calculator") {
    return true;
  }

  if (!pathname || pathname.includes(".")) {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 1 || segments.length > 3) {
    return false;
  }

  return !RESERVED_SEGMENTS.has(segments[0] ?? "");
}
