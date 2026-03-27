"use client";

import { ACADEMIC_CALENDAR_STORAGE_KEY } from "@/lib/local-storage-keys";

export type AcademicCalendarCategory =
  | "exam"
  | "registration"
  | "add_drop"
  | "project";

export type AcademicCalendarEvent = {
  id: string;
  title: string;
  category: AcademicCalendarCategory;
  start: string;
  end?: string;
  allDay: boolean;
};

export type AcademicCalendarStorageState = "ready" | "corrupt" | "blocked";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const VALID_CATEGORIES = new Set<AcademicCalendarCategory>([
  "exam",
  "registration",
  "add_drop",
  "project",
]);

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

function sanitizeTitle(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);

  return normalized.length > 0 ? normalized : null;
}

function normalizeDateOnly(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return DATE_ONLY_PATTERN.test(trimmed) ? trimmed : null;
}

function normalizeDateTime(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!DATE_TIME_PATTERN.test(trimmed)) {
    return null;
  }

  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const parsed = new Date(withSeconds);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return withSeconds;
}

function isCategory(value: unknown): value is AcademicCalendarCategory {
  return typeof value === "string" && VALID_CATEGORIES.has(value as AcademicCalendarCategory);
}

function sanitizeAcademicCalendarEvent(
  value: unknown,
): AcademicCalendarEvent | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const event = value as Partial<AcademicCalendarEvent>;
  const title = sanitizeTitle(event.title);

  if (!title || typeof event.id !== "string" || !event.id.trim() || !isCategory(event.category)) {
    return null;
  }

  const allDay = Boolean(event.allDay);

  if (allDay) {
    const start = normalizeDateOnly(event.start);
    const end = normalizeDateOnly(event.end);

    return start
      ? {
          id: event.id.trim(),
          title,
          category: event.category,
          start,
          end,
          allDay: true,
        }
      : null;
  }

  const start = normalizeDateTime(event.start);
  const end = normalizeDateTime(event.end);

  if (!start) {
    return null;
  }

  return {
    id: event.id.trim(),
    title,
    category: event.category,
    start,
    end: end && end > start ? end : undefined,
    allDay: false,
  };
}

function getStorage(storage?: StorageLike) {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function loadAcademicCalendarEvents(storage?: StorageLike): {
  events: AcademicCalendarEvent[];
  state: AcademicCalendarStorageState;
} {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return { events: [], state: "blocked" };
  }

  try {
    const raw = resolvedStorage.getItem(ACADEMIC_CALENDAR_STORAGE_KEY);

    if (!raw) {
      return { events: [], state: "ready" };
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      resolvedStorage.removeItem(ACADEMIC_CALENDAR_STORAGE_KEY);
      return { events: [], state: "corrupt" };
    }

    return {
      events: parsed
        .map(sanitizeAcademicCalendarEvent)
        .filter((event): event is AcademicCalendarEvent => event !== null),
      state: "ready",
    };
  } catch {
    try {
      resolvedStorage.removeItem(ACADEMIC_CALENDAR_STORAGE_KEY);
      return { events: [], state: "corrupt" };
    } catch {
      return { events: [], state: "blocked" };
    }
  }
}

export function saveAcademicCalendarEvents(
  events: AcademicCalendarEvent[],
  storage?: StorageLike,
): { ok: boolean; state: AcademicCalendarStorageState } {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return { ok: false, state: "blocked" };
  }

  const safeEvents = events
    .map(sanitizeAcademicCalendarEvent)
    .filter((event): event is AcademicCalendarEvent => event !== null);

  try {
    if (safeEvents.length === 0) {
      resolvedStorage.removeItem(ACADEMIC_CALENDAR_STORAGE_KEY);
    } else {
      resolvedStorage.setItem(
        ACADEMIC_CALENDAR_STORAGE_KEY,
        JSON.stringify(safeEvents),
      );
    }

    return { ok: true, state: "ready" };
  } catch {
    return { ok: false, state: "blocked" };
  }
}
