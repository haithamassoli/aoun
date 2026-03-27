import { RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY } from "@/lib/local-storage-keys";
import { normalizePublicSearchQuery } from "@/lib/public-search";
import { normalizeSlugLookup } from "@/lib/slug";

export type RecentGlobalCourseSearch = {
  query: string;
  universitySlug?: string;
  majorSlug?: string;
};

const MAX_RECENT_GLOBAL_COURSE_SEARCHES = 8;
const RECENT_GLOBAL_COURSE_SEARCHES_EVENT =
  "aoun:recent-global-course-searches:changed";
const EMPTY_RECENT_GLOBAL_COURSE_SEARCHES: RecentGlobalCourseSearch[] = [];
let cachedRecentSearchesRaw: string | null | undefined;
let cachedRecentSearchesSnapshot: RecentGlobalCourseSearch[] =
  EMPTY_RECENT_GLOBAL_COURSE_SEARCHES;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRecentSearchEntry(
  entry: RecentGlobalCourseSearch,
): RecentGlobalCourseSearch | null {
  const query = entry.query.trim();
  if (normalizePublicSearchQuery(query).length === 0) {
    return null;
  }

  const universitySlug = entry.universitySlug?.trim() || undefined;
  const majorSlug = entry.majorSlug?.trim() || undefined;

  return {
    query,
    universitySlug,
    majorSlug,
  };
}

function getEntryKey(entry: RecentGlobalCourseSearch) {
  return [
    normalizePublicSearchQuery(entry.query),
    entry.universitySlug ? normalizeSlugLookup(entry.universitySlug) : "",
    entry.majorSlug ? normalizeSlugLookup(entry.majorSlug) : "",
  ].join("::");
}

function parseStoredRecentSearches(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (!isRecord(entry) || typeof entry.query !== "string") {
        return [];
      }

      const normalizedEntry = normalizeRecentSearchEntry({
        query: entry.query,
        universitySlug:
          typeof entry.universitySlug === "string" ? entry.universitySlug : undefined,
        majorSlug: typeof entry.majorSlug === "string" ? entry.majorSlug : undefined,
      });

      return normalizedEntry ? [normalizedEntry] : [];
    });
  } catch {
    return [];
  }
}

export function dedupeRecentGlobalCourseSearches(
  entries: RecentGlobalCourseSearch[],
) {
  const seen = new Set<string>();
  const deduped: RecentGlobalCourseSearch[] = [];

  for (const entry of entries) {
    const normalizedEntry = normalizeRecentSearchEntry(entry);
    if (!normalizedEntry) {
      continue;
    }

    const key = getEntryKey(normalizedEntry);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(normalizedEntry);

    if (deduped.length >= MAX_RECENT_GLOBAL_COURSE_SEARCHES) {
      break;
    }
  }

  return deduped;
}

export function loadRecentGlobalCourseSearches() {
  if (typeof window === "undefined") {
    return EMPTY_RECENT_GLOBAL_COURSE_SEARCHES;
  }

  try {
    const rawValue = window.localStorage.getItem(
      RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY,
    );

    if (rawValue === cachedRecentSearchesRaw) {
      return cachedRecentSearchesSnapshot;
    }

    cachedRecentSearchesRaw = rawValue;
    cachedRecentSearchesSnapshot = dedupeRecentGlobalCourseSearches(
      parseStoredRecentSearches(rawValue),
    );

    return cachedRecentSearchesSnapshot;
  } catch {
    return EMPTY_RECENT_GLOBAL_COURSE_SEARCHES;
  }
}

export function saveRecentGlobalCourseSearches(
  entries: RecentGlobalCourseSearch[],
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const dedupedEntries = dedupeRecentGlobalCourseSearches(entries);

    if (dedupedEntries.length === 0) {
      window.localStorage.removeItem(RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY);
      window.dispatchEvent(new Event(RECENT_GLOBAL_COURSE_SEARCHES_EVENT));
      return;
    }

    window.localStorage.setItem(
      RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY,
      JSON.stringify(dedupedEntries),
    );
    window.dispatchEvent(new Event(RECENT_GLOBAL_COURSE_SEARCHES_EVENT));
  } catch {
    // Local storage may be unavailable in private or restricted browsers.
  }
}

export function rememberRecentGlobalCourseSearch(
  entry: RecentGlobalCourseSearch,
  existingEntries: RecentGlobalCourseSearch[] = loadRecentGlobalCourseSearches(),
) {
  const normalizedEntry = normalizeRecentSearchEntry(entry);
  if (!normalizedEntry) {
    return existingEntries;
  }

  return dedupeRecentGlobalCourseSearches([normalizedEntry, ...existingEntries]);
}

export function subscribeRecentGlobalCourseSearches(
  onStoreChange: () => void,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: Event) => {
    if (
      event instanceof StorageEvent &&
      event.key !== null &&
      event.key !== RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY
    ) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(RECENT_GLOBAL_COURSE_SEARCHES_EVENT, handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      RECENT_GLOBAL_COURSE_SEARCHES_EVENT,
      handleStorage,
    );
  };
}
