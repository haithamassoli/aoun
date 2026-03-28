import {
  STUDY_TIMER_HISTORY_STORAGE_KEY,
  STUDY_TIMER_RUNTIME_STORAGE_KEY,
  STUDY_TIMER_SETTINGS_STORAGE_KEY,
} from "@/lib/local-storage-keys";

export type StudyTimerPhase = "work" | "shortBreak" | "longBreak";
export type StudyTimerStatus = "idle" | "running" | "paused";

export type StudyTimerSettings = {
  version: 1;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsPerCycle: number;
};

export type StudyTimerRuntime = {
  version: 1;
  status: StudyTimerStatus;
  phase: StudyTimerPhase;
  completedWorkSessionsInCycle: number;
  phaseEndsAt: number | null;
  pausedRemainingMs: number | null;
  lastReconciledAt: number | null;
};

export type StudyTimerHistory = Record<string, number>;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const LOCAL_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_PHASES = new Set<StudyTimerPhase>([
  "work",
  "shortBreak",
  "longBreak",
]);
const VALID_STATUSES = new Set<StudyTimerStatus>(["idle", "running", "paused"]);

export const DEFAULT_STUDY_TIMER_SETTINGS: StudyTimerSettings = {
  version: 1,
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsPerCycle: 4,
};

export const STUDY_TIMER_LIMITS = {
  workMinutes: 120,
  shortBreakMinutes: 60,
  longBreakMinutes: 90,
  sessionsPerCycle: 12,
} as const;

function canUseStorage() {
  return typeof window !== "undefined";
}

function getStorage(storage?: StorageLike) {
  if (storage) {
    return storage;
  }

  return canUseStorage() ? window.localStorage : null;
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sanitizeStudyTimerSettings(
  value: unknown,
): StudyTimerSettings {
  if (!isRecord(value)) {
    return DEFAULT_STUDY_TIMER_SETTINGS;
  }

  return {
    version: 1,
    workMinutes: clampInteger(
      value.workMinutes,
      1,
      STUDY_TIMER_LIMITS.workMinutes,
      DEFAULT_STUDY_TIMER_SETTINGS.workMinutes,
    ),
    shortBreakMinutes: clampInteger(
      value.shortBreakMinutes,
      1,
      STUDY_TIMER_LIMITS.shortBreakMinutes,
      DEFAULT_STUDY_TIMER_SETTINGS.shortBreakMinutes,
    ),
    longBreakMinutes: clampInteger(
      value.longBreakMinutes,
      1,
      STUDY_TIMER_LIMITS.longBreakMinutes,
      DEFAULT_STUDY_TIMER_SETTINGS.longBreakMinutes,
    ),
    sessionsPerCycle: clampInteger(
      value.sessionsPerCycle,
      1,
      STUDY_TIMER_LIMITS.sessionsPerCycle,
      DEFAULT_STUDY_TIMER_SETTINGS.sessionsPerCycle,
    ),
  };
}

export function createIdleStudyTimerRuntime(): StudyTimerRuntime {
  return {
    version: 1,
    status: "idle",
    phase: "work",
    completedWorkSessionsInCycle: 0,
    phaseEndsAt: null,
    pausedRemainingMs: null,
    lastReconciledAt: null,
  };
}

export function sanitizeStudyTimerRuntime(value: unknown): StudyTimerRuntime {
  if (!isRecord(value)) {
    return createIdleStudyTimerRuntime();
  }

  const status = VALID_STATUSES.has(value.status as StudyTimerStatus)
    ? (value.status as StudyTimerStatus)
    : "idle";
  const phase = VALID_PHASES.has(value.phase as StudyTimerPhase)
    ? (value.phase as StudyTimerPhase)
    : "work";
  const completedWorkSessionsInCycle = clampInteger(
    value.completedWorkSessionsInCycle,
    0,
    STUDY_TIMER_LIMITS.sessionsPerCycle,
    0,
  );
  const phaseEndsAt = normalizeTimestamp(value.phaseEndsAt);
  const pausedRemainingMs = normalizeTimestamp(value.pausedRemainingMs);
  const lastReconciledAt = normalizeTimestamp(value.lastReconciledAt);

  if (status === "running" && phaseEndsAt && lastReconciledAt) {
    return {
      version: 1,
      status,
      phase,
      completedWorkSessionsInCycle,
      phaseEndsAt,
      pausedRemainingMs: null,
      lastReconciledAt,
    };
  }

  if (status === "paused" && pausedRemainingMs) {
    return {
      version: 1,
      status,
      phase,
      completedWorkSessionsInCycle,
      phaseEndsAt: null,
      pausedRemainingMs,
      lastReconciledAt,
    };
  }

  if (status === "idle") {
    return createIdleStudyTimerRuntime();
  }

  return createIdleStudyTimerRuntime();
}

export function sanitizeStudyTimerHistory(value: unknown): StudyTimerHistory {
  if (!isRecord(value)) {
    return {};
  }

  const next: StudyTimerHistory = {};

  for (const [dateKey, rawDuration] of Object.entries(value)) {
    if (!LOCAL_DATE_KEY_PATTERN.test(dateKey)) {
      continue;
    }

    if (
      typeof rawDuration !== "number" ||
      !Number.isFinite(rawDuration) ||
      rawDuration <= 0
    ) {
      continue;
    }

    next[dateKey] = Math.round(rawDuration);
  }

  return next;
}

export function loadStudyTimerSettings(storage?: StorageLike) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return DEFAULT_STUDY_TIMER_SETTINGS;
  }

  try {
    const rawValue = resolvedStorage.getItem(STUDY_TIMER_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_STUDY_TIMER_SETTINGS;
    }

    return sanitizeStudyTimerSettings(JSON.parse(rawValue));
  } catch {
    return DEFAULT_STUDY_TIMER_SETTINGS;
  }
}

export function saveStudyTimerSettings(
  settings: StudyTimerSettings,
  storage?: StorageLike,
) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return;
  }

  try {
    resolvedStorage.setItem(
      STUDY_TIMER_SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitizeStudyTimerSettings(settings)),
    );
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function loadStudyTimerRuntime(storage?: StorageLike) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return createIdleStudyTimerRuntime();
  }

  try {
    const rawValue = resolvedStorage.getItem(STUDY_TIMER_RUNTIME_STORAGE_KEY);

    if (!rawValue) {
      return createIdleStudyTimerRuntime();
    }

    return sanitizeStudyTimerRuntime(JSON.parse(rawValue));
  } catch {
    return createIdleStudyTimerRuntime();
  }
}

export function saveStudyTimerRuntime(
  runtime: StudyTimerRuntime,
  storage?: StorageLike,
) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return;
  }

  try {
    const sanitizedRuntime = sanitizeStudyTimerRuntime(runtime);

    if (sanitizedRuntime.status === "idle") {
      resolvedStorage.removeItem(STUDY_TIMER_RUNTIME_STORAGE_KEY);
      return;
    }

    resolvedStorage.setItem(
      STUDY_TIMER_RUNTIME_STORAGE_KEY,
      JSON.stringify(sanitizedRuntime),
    );
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function loadStudyTimerHistory(storage?: StorageLike) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return {};
  }

  try {
    const rawValue = resolvedStorage.getItem(STUDY_TIMER_HISTORY_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    return sanitizeStudyTimerHistory(JSON.parse(rawValue));
  } catch {
    return {};
  }
}

export function saveStudyTimerHistory(
  history: StudyTimerHistory,
  storage?: StorageLike,
) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage) {
    return;
  }

  try {
    const sanitizedHistory = sanitizeStudyTimerHistory(history);

    if (Object.keys(sanitizedHistory).length === 0) {
      resolvedStorage.removeItem(STUDY_TIMER_HISTORY_STORAGE_KEY);
      return;
    }

    resolvedStorage.setItem(
      STUDY_TIMER_HISTORY_STORAGE_KEY,
      JSON.stringify(sanitizedHistory),
    );
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function getStudyTimerPhaseDurationMs(
  settings: StudyTimerSettings,
  phase: StudyTimerPhase,
) {
  switch (phase) {
    case "work":
      return settings.workMinutes * 60_000;
    case "shortBreak":
      return settings.shortBreakMinutes * 60_000;
    case "longBreak":
      return settings.longBreakMinutes * 60_000;
  }
}

export function getStudyTimerRemainingMs(
  runtime: StudyTimerRuntime,
  settings: StudyTimerSettings,
  now: number,
) {
  if (runtime.status === "running" && runtime.phaseEndsAt) {
    return Math.max(0, runtime.phaseEndsAt - now);
  }

  if (runtime.status === "paused" && runtime.pausedRemainingMs) {
    return runtime.pausedRemainingMs;
  }

  return getStudyTimerPhaseDurationMs(settings, runtime.phase);
}

export function getStudyTimerPendingWorkMs(
  runtime: StudyTimerRuntime,
  now: number,
) {
  if (
    runtime.status !== "running" ||
    runtime.phase !== "work" ||
    !runtime.phaseEndsAt ||
    !runtime.lastReconciledAt
  ) {
    return 0;
  }

  const pendingUntil = Math.min(now, runtime.phaseEndsAt);
  return Math.max(0, pendingUntil - runtime.lastReconciledAt);
}

export function getLocalDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextLocalDayTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  ).getTime();
}

export function addStudyDurationToHistory(
  history: StudyTimerHistory,
  startedAt: number,
  endedAt: number,
) {
  if (endedAt <= startedAt) {
    return history;
  }

  const nextHistory = { ...history };
  let cursor = startedAt;

  while (cursor < endedAt) {
    const nextBoundary = getNextLocalDayTimestamp(cursor);
    const segmentEnd = Math.min(endedAt, nextBoundary);
    const dateKey = getLocalDateKey(cursor);
    nextHistory[dateKey] = (nextHistory[dateKey] ?? 0) + (segmentEnd - cursor);
    cursor = segmentEnd;
  }

  return nextHistory;
}

export function getStudyTimerDayTotalMs(
  history: StudyTimerHistory,
  dateKey: string,
) {
  return history[dateKey] ?? 0;
}

export function getStudyTimerRollingWeekTotalMs(
  history: StudyTimerHistory,
  now: number,
) {
  let total = 0;

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    total += history[getLocalDateKey(date.getTime())] ?? 0;
  }

  return total;
}
