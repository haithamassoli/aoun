const STORAGE_NAMESPACE = "aoun:analytics";
const STORAGE_VERSION = "v1";
const TRACKABLE_STATIC_PATHS = new Set([
  "/academic-planner",
  "/courses",
  "/focus",
  "/gpa-calculator",
]);
const RESERVED_SEGMENTS = new Set([
  "bookmarks",
  "dashboard",
  "login",
  "news",
  "offline",
  "partners",
  "settings",
]);

const VISITOR_ID_STORAGE_KEY = `${STORAGE_NAMESPACE}:visitor-id:${STORAGE_VERSION}`;

function canUseStorage() {
  return typeof window !== "undefined";
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

export function isTrackableVisitorPath(pathname: string) {
  if (TRACKABLE_STATIC_PATHS.has(pathname)) {
    return true;
  }

  if (!pathname || pathname.includes(".")) {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    return false;
  }

  return !RESERVED_SEGMENTS.has(segments[0] ?? "");
}
