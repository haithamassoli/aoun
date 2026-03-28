"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFocusAudio } from "@/components/focus-audio-provider";
import { isStudentFacingPath } from "@/lib/public-shell";
import {
  addStudyDurationToHistory,
  createIdleStudyTimerRuntime,
  DEFAULT_STUDY_TIMER_SETTINGS,
  getLocalDateKey,
  getStudyTimerPendingWorkMs,
  getStudyTimerPhaseDurationMs,
  getStudyTimerRemainingMs,
  getStudyTimerRollingWeekTotalMs,
  getStudyTimerDayTotalMs,
  loadStudyTimerHistory,
  loadStudyTimerRuntime,
  loadStudyTimerSettings,
  sanitizeStudyTimerSettings,
  saveStudyTimerHistory,
  saveStudyTimerRuntime,
  saveStudyTimerSettings,
  type StudyTimerHistory,
  type StudyTimerPhase,
  type StudyTimerRuntime,
  type StudyTimerSettings,
} from "@/lib/study-timer";

type StudyTimerContextValue = {
  hasHydrated: boolean;
  settings: StudyTimerSettings;
  runtime: StudyTimerRuntime;
  remainingMs: number;
  todayTotalMs: number;
  rollingWeekTotalMs: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  updateSettings: (patch: Partial<Omit<StudyTimerSettings, "version">>) => void;
};

type StudyTimerSnapshot = {
  history: StudyTimerHistory;
  runtime: StudyTimerRuntime;
  settings: StudyTimerSettings;
};

const STUDY_TIMER_PANEL_ID = "study-timer";
const StudyTimerContext = createContext<StudyTimerContextValue | null>(null);

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.AudioContext ??
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ??
    null
  );
}

function createRunningRuntime(
  phase: StudyTimerPhase,
  completedWorkSessionsInCycle: number,
  settings: StudyTimerSettings,
  startedAt: number,
): StudyTimerRuntime {
  return {
    version: 1,
    status: "running",
    phase,
    completedWorkSessionsInCycle,
    phaseEndsAt: startedAt + getStudyTimerPhaseDurationMs(settings, phase),
    pausedRemainingMs: null,
    lastReconciledAt: startedAt,
  };
}

function getNextRuntimeAfterCompletedPhase(
  runtime: StudyTimerRuntime,
  settings: StudyTimerSettings,
  completedAt: number,
) {
  if (runtime.phase === "work") {
    const completedWorkSessionsInCycle =
      runtime.completedWorkSessionsInCycle + 1;
    const shouldStartLongBreak =
      completedWorkSessionsInCycle >= settings.sessionsPerCycle;

    return createRunningRuntime(
      shouldStartLongBreak ? "longBreak" : "shortBreak",
      completedWorkSessionsInCycle,
      settings,
      completedAt,
    );
  }

  if (runtime.phase === "shortBreak") {
    return createRunningRuntime(
      "work",
      runtime.completedWorkSessionsInCycle,
      settings,
      completedAt,
    );
  }

  return createRunningRuntime("work", 0, settings, completedAt);
}

function reconcileStudyTimerSnapshot(
  snapshot: StudyTimerSnapshot,
  now: number,
): StudyTimerSnapshot {
  if (snapshot.runtime.status !== "running" || !snapshot.runtime.phaseEndsAt) {
    return snapshot;
  }

  let nextHistory = snapshot.history;
  let nextRuntime = snapshot.runtime;

  while (
    nextRuntime.status === "running" &&
    nextRuntime.phaseEndsAt !== null &&
    nextRuntime.phaseEndsAt <= now
  ) {
    if (nextRuntime.phase === "work" && nextRuntime.lastReconciledAt) {
      nextHistory = addStudyDurationToHistory(
        nextHistory,
        nextRuntime.lastReconciledAt,
        nextRuntime.phaseEndsAt,
      );
    }

    nextRuntime = getNextRuntimeAfterCompletedPhase(
      nextRuntime,
      snapshot.settings,
      nextRuntime.phaseEndsAt,
    );
  }

  if (
    nextRuntime.status === "running" &&
    nextRuntime.phase === "work" &&
    nextRuntime.lastReconciledAt &&
    nextRuntime.phaseEndsAt
  ) {
    const flushUntil = Math.min(now, nextRuntime.phaseEndsAt);

    if (flushUntil > nextRuntime.lastReconciledAt) {
      nextHistory = addStudyDurationToHistory(
        nextHistory,
        nextRuntime.lastReconciledAt,
        flushUntil,
      );
      nextRuntime = {
        ...nextRuntime,
        lastReconciledAt: flushUntil,
      };
    }
  }

  if (nextHistory === snapshot.history && nextRuntime === snapshot.runtime) {
    return snapshot;
  }

  return {
    ...snapshot,
    history: nextHistory,
    runtime: nextRuntime,
  };
}

function didCompleteStudyTimerPhase(
  previousRuntime: StudyTimerRuntime,
  nextRuntime: StudyTimerRuntime,
  now: number,
) {
  if (
    previousRuntime.status !== "running" ||
    previousRuntime.phaseEndsAt === null ||
    previousRuntime.phaseEndsAt > now
  ) {
    return false;
  }

  return (
    previousRuntime.phase !== nextRuntime.phase ||
    previousRuntime.completedWorkSessionsInCycle !==
      nextRuntime.completedWorkSessionsInCycle ||
    previousRuntime.phaseEndsAt !== nextRuntime.phaseEndsAt ||
    previousRuntime.status !== nextRuntime.status
  );
}

export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_STUDY_TIMER_SETTINGS);
  const [runtime, setRuntime] = useState(createIdleStudyTimerRuntime);
  const [history, setHistory] = useState<StudyTimerHistory>({});
  const [now, setNow] = useState(() => Date.now());
  const [hasHydrated, setHasHydrated] = useState(false);
  const settingsRef = useRef(settings);
  const runtimeRef = useRef(runtime);
  const historyRef = useRef(history);
  const completionAudioContextRef = useRef<AudioContext | null>(null);
  const lastNotifiedPhaseEndRef = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const commitSnapshot = (snapshot: StudyTimerSnapshot) => {
    settingsRef.current = snapshot.settings;
    runtimeRef.current = snapshot.runtime;
    historyRef.current = snapshot.history;
    setSettings(snapshot.settings);
    setRuntime(snapshot.runtime);
    setHistory(snapshot.history);
  };

  const ensureCompletionAudioReady = useCallback(async () => {
    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return null;
    }

    let audioContext = completionAudioContextRef.current;

    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      completionAudioContextRef.current = audioContext;
    }

    if (audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch {
        return null;
      }
    }

    return audioContext.state === "running" ? audioContext : null;
  }, []);

  const playCompletionSound = useCallback(async () => {
    const audioContext = await ensureCompletionAudioReady();

    if (!audioContext) {
      return;
    }

    const startAt = audioContext.currentTime + 0.01;
    const output = audioContext.createGain();

    output.gain.setValueAtTime(0.0001, startAt);
    output.gain.exponentialRampToValueAtTime(0.14, startAt + 0.03);
    output.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.68);
    output.connect(audioContext.destination);

    for (const [index, note] of [
      { frequency: 784, duration: 0.16 },
      { frequency: 1047, duration: 0.28 },
    ].entries()) {
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain();
      const noteStart = startAt + index * 0.18;
      const noteEnd = noteStart + note.duration;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(note.frequency, noteStart);
      oscillator.frequency.exponentialRampToValueAtTime(
        note.frequency * 1.015,
        noteEnd,
      );

      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(1, noteStart + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(noteGain);
      noteGain.connect(output);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    }

    window.setTimeout(() => {
      output.disconnect();
    }, 1000);
  }, [ensureCompletionAudioReady]);

  const synchronizeSnapshot = useCallback((
    currentNow: number,
    options: { notifyOnCompletedPhase?: boolean } = {},
  ) => {
    const currentSnapshot = {
      settings: settingsRef.current,
      runtime: runtimeRef.current,
      history: historyRef.current,
    };

    const nextSnapshot = reconcileStudyTimerSnapshot(currentSnapshot, currentNow);

    if (
      options.notifyOnCompletedPhase &&
      currentSnapshot.runtime.phaseEndsAt !== null &&
      lastNotifiedPhaseEndRef.current !== currentSnapshot.runtime.phaseEndsAt &&
      didCompleteStudyTimerPhase(
        currentSnapshot.runtime,
        nextSnapshot.runtime,
        currentNow,
      )
    ) {
      lastNotifiedPhaseEndRef.current = currentSnapshot.runtime.phaseEndsAt;
      void playCompletionSound();
    }

    return nextSnapshot;
  }, [playCompletionSound]);

  const withSynchronizedSnapshot = (
    mutate: (
      snapshot: StudyTimerSnapshot,
      currentNow: number,
    ) => StudyTimerSnapshot,
  ) => {
    const currentNow = Date.now();
    const nextSnapshot = mutate(
      synchronizeSnapshot(currentNow, { notifyOnCompletedPhase: true }),
      currentNow,
    );
    commitSnapshot(nextSnapshot);
    startTransition(() => setNow(currentNow));
  };

  useEffect(() => {
    return () => {
      const audioContext = completionAudioContextRef.current;

      if (!audioContext) {
        return;
      }

      void audioContext.close();
      completionAudioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const hydratedSettings = loadStudyTimerSettings();
    const hydratedNow = Date.now();
    const hydratedSnapshot = reconcileStudyTimerSnapshot(
      {
        settings: hydratedSettings,
        runtime: loadStudyTimerRuntime(),
        history: loadStudyTimerHistory(),
      },
      hydratedNow,
    );

    settingsRef.current = hydratedSnapshot.settings;
    runtimeRef.current = hydratedSnapshot.runtime;
    historyRef.current = hydratedSnapshot.history;
    const timeoutId = window.setTimeout(() => {
      setSettings(hydratedSnapshot.settings);
      setRuntime(hydratedSnapshot.runtime);
      setHistory(hydratedSnapshot.history);
      setHasHydrated(true);
      startTransition(() => setNow(hydratedNow));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveStudyTimerSettings(settingsRef.current);
      saveStudyTimerRuntime(runtimeRef.current);
      saveStudyTimerHistory(historyRef.current);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasHydrated, history, runtime, settings]);

  useEffect(() => {
    if (!hasHydrated || runtime.status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      const currentNow = Date.now();
      const nextSnapshot = synchronizeSnapshot(currentNow, {
        notifyOnCompletedPhase: true,
      });

      if (
        nextSnapshot.history !== historyRef.current ||
        nextSnapshot.runtime !== runtimeRef.current
      ) {
        commitSnapshot(nextSnapshot);
      }

      startTransition(() => setNow(currentNow));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasHydrated, runtime.status, synchronizeSnapshot]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        commitSnapshot(synchronizeSnapshot(Date.now()));
        return;
      }

      const currentNow = Date.now();
      commitSnapshot(synchronizeSnapshot(currentNow));
      startTransition(() => setNow(currentNow));
    };

    const handlePageHide = () => {
      commitSnapshot(synchronizeSnapshot(Date.now()));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [hasHydrated, runtime.status, synchronizeSnapshot]);

  const startTimer = () => {
    withSynchronizedSnapshot((snapshot, currentNow) => {
      if (snapshot.runtime.status !== "idle") {
        return snapshot;
      }

      return {
        ...snapshot,
        runtime: createRunningRuntime("work", 0, snapshot.settings, currentNow),
      };
    });
  };

  const pauseTimer = () => {
    withSynchronizedSnapshot((snapshot, currentNow) => {
      if (
        snapshot.runtime.status !== "running" ||
        snapshot.runtime.phaseEndsAt === null
      ) {
        return snapshot;
      }

      return {
        ...snapshot,
        runtime: {
          ...snapshot.runtime,
          status: "paused",
          phaseEndsAt: null,
          pausedRemainingMs: Math.max(
            0,
            snapshot.runtime.phaseEndsAt - currentNow,
          ),
          lastReconciledAt: currentNow,
        },
      };
    });
  };

  const resumeTimer = () => {
    withSynchronizedSnapshot((snapshot, currentNow) => {
      if (
        snapshot.runtime.status !== "paused" ||
        snapshot.runtime.pausedRemainingMs === null
      ) {
        return snapshot;
      }

      return {
        ...snapshot,
        runtime: {
          ...snapshot.runtime,
          status: "running",
          phaseEndsAt: currentNow + snapshot.runtime.pausedRemainingMs,
          pausedRemainingMs: null,
          lastReconciledAt: currentNow,
        },
      };
    });
  };

  const resetTimer = () => {
    withSynchronizedSnapshot((snapshot) => ({
      ...snapshot,
      runtime: createIdleStudyTimerRuntime(),
    }));
  };

  const updateSettings = (
    patch: Partial<Omit<StudyTimerSettings, "version">>,
  ) => {
    withSynchronizedSnapshot((snapshot) => {
      const nextSettings = sanitizeStudyTimerSettings({
        ...snapshot.settings,
        ...patch,
      });

      if (snapshot.runtime.status === "running") {
        return {
          ...snapshot,
          settings: nextSettings,
        };
      }

      if (snapshot.runtime.status === "paused") {
        return {
          history: snapshot.history,
          settings: nextSettings,
          runtime: {
            ...snapshot.runtime,
            pausedRemainingMs: getStudyTimerPhaseDurationMs(
              nextSettings,
              snapshot.runtime.phase,
            ),
          },
        };
      }

      return {
        history: snapshot.history,
        settings: nextSettings,
        runtime: createIdleStudyTimerRuntime(),
      };
    });
  };

  const displayHistory = useMemo(() => {
    const pendingWorkMs = getStudyTimerPendingWorkMs(runtime, now);

    if (pendingWorkMs === 0 || !runtime.lastReconciledAt) {
      return history;
    }

    return addStudyDurationToHistory(
      history,
      runtime.lastReconciledAt,
      runtime.lastReconciledAt + pendingWorkMs,
    );
  }, [history, now, runtime]);

  const remainingMs = getStudyTimerRemainingMs(runtime, settings, now);
  const todayTotalMs = getStudyTimerDayTotalMs(
    displayHistory,
    getLocalDateKey(now),
  );
  const rollingWeekTotalMs = getStudyTimerRollingWeekTotalMs(
    displayHistory,
    now,
  );

  return (
    <StudyTimerContext.Provider
      value={{
        hasHydrated,
        settings,
        runtime,
        remainingMs,
        todayTotalMs,
        rollingWeekTotalMs,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        updateSettings,
      }}
    >
      {children}
      <FloatingStudyTimerPill />
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const context = useContext(StudyTimerContext);

  if (!context) {
    throw new Error("useStudyTimer must be used within a StudyTimerProvider.");
  }

  return context;
}

function FloatingStudyTimerPill() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeSoundCount } = useFocusAudio();
  const {
    hasHydrated,
    remainingMs,
    resetTimer,
    resumeTimer,
    runtime,
    settings,
    pauseTimer,
  } = useStudyTimer();
  const isVisible =
    hasHydrated && isStudentFacingPath(pathname) && runtime.status !== "idle";
  const hasFloatingAudio = activeSoundCount > 0;
  const progressLabel = `${Math.min(
    runtime.completedWorkSessionsInCycle,
    settings.sessionsPerCycle,
  )}/${settings.sessionsPerCycle}`;
  const positionClass = hasFloatingAudio
    ? "bottom-[calc(16rem+env(safe-area-inset-bottom))] md:bottom-48"
    : "bottom-[calc(6.8rem+env(safe-area-inset-bottom))] md:bottom-6";
  const formattedRemaining = formatStudyTimerClock(remainingMs);

  const handleOpenTimer = () => {
    if (pathname === "/focus") {
      document.getElementById(STUDY_TIMER_PANEL_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.history.replaceState(null, "", `#${STUDY_TIMER_PANEL_ID}`);
      return;
    }

    router.push(`/focus#${STUDY_TIMER_PANEL_ID}`);
  };

  return (
    <AnimatePresence initial={false}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed inset-x-4 z-50 md:inset-x-auto md:end-6 md:w-auto ${positionClass}`}
        >
          <div className="flex items-center gap-2 rounded-full bg-white/40 p-2 shadow-lg backdrop-blur-xl dark:bg-white/10 sm:gap-3 sm:p-2.5">
            {/* Progress Circle */}
            <button
              type="button"
              onClick={handleOpenTimer}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/50 text-surface-900 transition-all hover:bg-white/70 dark:bg-white/20 dark:text-white dark:hover:bg-white/30 sm:h-16 sm:w-16"
              aria-label="فتح مؤقت الدراسة"
            >
              <div className="text-center">
                <p className="text-base font-bold sm:text-lg">
                  {progressLabel}
                </p>
              </div>
            </button>

            {/* Timer Display */}
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white/50 px-4 py-3 dark:bg-white/20 sm:gap-3 sm:px-6 sm:py-3.5">
              <button
                type="button"
                onClick={handleOpenTimer}
                className="min-w-0 text-center"
              >
                <p className="text-xl font-bold tracking-tight text-surface-900 tabular-nums dark:text-white sm:text-2xl">
                  {formattedRemaining}
                </p>
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-surface-700 transition-all hover:bg-white/50 hover:text-surface-900 dark:text-white/80 dark:hover:bg-white/20 dark:hover:text-white sm:h-9 sm:w-9"
                aria-label="إعادة ضبط"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={runtime.status === "running" ? pauseTimer : resumeTimer}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/50 text-surface-900 transition-all hover:bg-white/70 active:scale-95 dark:bg-white/20 dark:text-white dark:hover:bg-white/30 sm:h-16 sm:w-16"
              aria-label={
                runtime.status === "running"
                  ? "إيقاف المؤقت مؤقتاً"
                  : "استئناف المؤقت"
              }
            >
              {runtime.status === "running" ? (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatStudyTimerClock(durationMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(
      2,
      "0",
    )}`;
  }

  return `${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`;
}
