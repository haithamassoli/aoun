"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { Toast, useToast } from "@/components/toast";
import {
  DEFAULT_FOCUS_SOUND_PREFERENCES,
  FOCUS_SOUND_CATALOG,
  FOCUS_SOUND_IDS,
  loadFocusSoundPreferences,
  saveFocusSoundPreferences,
  type FocusSoundConfig,
  type FocusSoundId,
} from "@/lib/focus-sounds";
import { isStudentFacingPath } from "@/lib/public-shell";

type FocusSoundPlaybackStatus = "idle" | "paused" | "playing";

export type FocusSoundState = FocusSoundConfig & {
  volume: number;
  enabled: boolean;
  playbackStatus: FocusSoundPlaybackStatus;
  errorMessage: string | null;
};

type FocusAudioContextValue = {
  sounds: FocusSoundState[];
  activeSoundCount: number;
  isPaused: boolean;
  toggleSound: (id: FocusSoundId) => void;
  setVolume: (id: FocusSoundId, value: number) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  stopAll: () => void;
};

const FocusAudioContext = createContext<FocusAudioContextValue | null>(null);

function createFocusSoundMap<T>(
  createValue: (id: FocusSoundId) => T,
): Record<FocusSoundId, T> {
  return Object.fromEntries(
    FOCUS_SOUND_IDS.map((id) => [id, createValue(id)]),
  ) as Record<FocusSoundId, T>;
}

function createPlaybackStatusMap(
  activeSoundIds: readonly FocusSoundId[],
): Record<FocusSoundId, FocusSoundPlaybackStatus> {
  return createFocusSoundMap((id) =>
    activeSoundIds.includes(id) ? "paused" : "idle",
  );
}

function createErrorMap(): Record<FocusSoundId, string | null> {
  return createFocusSoundMap(() => null);
}

function normalizeEnabledSoundIds(soundIds: readonly FocusSoundId[]) {
  return FOCUS_SOUND_IDS.filter((id) => soundIds.includes(id));
}

function formatActiveSoundSummary(labels: string[]) {
  if (labels.length === 0) {
    return "لا توجد أصوات مفعلة الآن";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} + ${labels[1]}`;
  }

  return `${labels[0]} + ${labels[1]} + ${labels.length - 2}`;
}

export function FocusAudioProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const initialPathnameRef = useRef<string | null>(null);
  const lastStudentFacingRef = useRef<boolean | null>(null);
  const audioRefs = useRef<Partial<Record<FocusSoundId, HTMLAudioElement>>>({});
  const volumesRef = useRef(DEFAULT_FOCUS_SOUND_PREFERENCES.volumes);
  const savedEnabledSoundIdsRef = useRef<FocusSoundId[]>([]);
  const runtimeEnabledSoundIdsRef = useRef<FocusSoundId[]>([]);
  const [volumes, setVolumes] = useState(
    DEFAULT_FOCUS_SOUND_PREFERENCES.volumes,
  );
  const [savedEnabledSoundIds, setSavedEnabledSoundIds] = useState<
    FocusSoundId[]
  >([]);
  const [runtimeEnabledSoundIds, setRuntimeEnabledSoundIds] = useState<
    FocusSoundId[]
  >([]);
  const [playbackStatus, setPlaybackStatus] = useState<
    Record<FocusSoundId, FocusSoundPlaybackStatus>
  >(() => createPlaybackStatusMap([]));
  const [errors, setErrors] = useState<Record<FocusSoundId, string | null>>(
    () => createErrorMap(),
  );
  const [hasHydratedPrefs, setHasHydratedPrefs] = useState(false);

  const replaceSavedEnabledSoundIds = (
    nextSoundIds: readonly FocusSoundId[],
  ) => {
    const normalized = normalizeEnabledSoundIds(nextSoundIds);
    savedEnabledSoundIdsRef.current = normalized;
    setSavedEnabledSoundIds(normalized);
  };

  const replaceRuntimeEnabledSoundIds = (
    nextSoundIds: readonly FocusSoundId[],
  ) => {
    const normalized = normalizeEnabledSoundIds(nextSoundIds);
    runtimeEnabledSoundIdsRef.current = normalized;
    setRuntimeEnabledSoundIds(normalized);
  };

  const ensureAudio = (id: FocusSoundId) => {
    let audio = audioRefs.current[id];

    if (!audio) {
      audio = new Audio(FOCUS_SOUND_CATALOG[id].assetPath);
      audio.loop = true;
      audio.preload = "none";
      audio.addEventListener("error", () => {
        if (!runtimeEnabledSoundIdsRef.current.includes(id)) {
          return;
        }

        setPlaybackStatus((current) => ({ ...current, [id]: "paused" }));
        setErrors((current) => ({
          ...current,
          [id]: "تعذر تحميل الملف الصوتي لهذا المسار.",
        }));
      });
      audioRefs.current[id] = audio;
    }

    audio.volume = volumesRef.current[id];
    return audio;
  };

  async function playSound(
    id: FocusSoundId,
    options: {
      resetTime?: boolean;
    } = {},
  ) {
    const audio = ensureAudio(id);

    if (options.resetTime) {
      audio.currentTime = 0;
    }

    try {
      await audio.play();

      if (!runtimeEnabledSoundIdsRef.current.includes(id)) {
        audio.pause();
        audio.currentTime = 0;
        return false;
      }

      setPlaybackStatus((current) => ({ ...current, [id]: "playing" }));
      setErrors((current) =>
        current[id] === null ? current : { ...current, [id]: null },
      );
      return true;
    } catch (error) {
      if (!runtimeEnabledSoundIdsRef.current.includes(id)) {
        return false;
      }

      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "فعّل التشغيل من زر داخل الصفحة أو من المشغل العائم أولاً."
          : "تعذر تشغيل هذا الصوت حالياً. حاول مرة أخرى.";

      setPlaybackStatus((current) => ({ ...current, [id]: "paused" }));
      setErrors((current) => ({ ...current, [id]: message }));
      toast.show(`${FOCUS_SOUND_CATALOG[id].label}: ${message}`, "error");
      return false;
    }
  }

  const clearRuntimeSession = () => {
    for (const id of runtimeEnabledSoundIdsRef.current) {
      const audio = audioRefs.current[id];
      if (!audio) {
        continue;
      }

      audio.pause();
      audio.currentTime = 0;
    }

    replaceRuntimeEnabledSoundIds([]);
    setPlaybackStatus(createPlaybackStatusMap([]));
    setErrors(createErrorMap());
  };

  const restoreRuntimeSessionFromSavedPrefs = () => {
    for (const id of FOCUS_SOUND_IDS) {
      const audio = audioRefs.current[id];
      if (!audio) {
        continue;
      }

      audio.pause();
      audio.currentTime = 0;
      audio.volume = volumesRef.current[id];
    }

    replaceRuntimeEnabledSoundIds(savedEnabledSoundIdsRef.current);
    setPlaybackStatus(createPlaybackStatusMap(savedEnabledSoundIdsRef.current));
    setErrors(createErrorMap());
  };

  useEffect(() => {
    const preferences = loadFocusSoundPreferences();
    const initialPathname = initialPathnameRef.current ?? window.location.pathname;
    const studentFacing = isStudentFacingPath(initialPathname);
    const initialRuntimeSoundIds = studentFacing
      ? preferences.lastEnabledSoundIds
      : [];
    const audioRegistry = audioRefs.current;

    volumesRef.current = preferences.volumes;
    savedEnabledSoundIdsRef.current = preferences.lastEnabledSoundIds;
    runtimeEnabledSoundIdsRef.current = initialRuntimeSoundIds;
    lastStudentFacingRef.current = studentFacing;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolumes(preferences.volumes);
    setSavedEnabledSoundIds(preferences.lastEnabledSoundIds);
    setRuntimeEnabledSoundIds(initialRuntimeSoundIds);
    setPlaybackStatus(createPlaybackStatusMap(initialRuntimeSoundIds));
    setErrors(createErrorMap());
    setHasHydratedPrefs(true);

    return () => {
      for (const id of FOCUS_SOUND_IDS) {
        const audio = audioRegistry[id];
        if (!audio) {
          continue;
        }

        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedPrefs) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveFocusSoundPreferences({
        version: 1,
        volumes: volumesRef.current,
        lastEnabledSoundIds: savedEnabledSoundIdsRef.current,
      });
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasHydratedPrefs, savedEnabledSoundIds, volumes]);

  const handlePathnameChange = (pathname: string) => {
    initialPathnameRef.current ??= pathname;

    if (!hasHydratedPrefs) {
      return;
    }

    const studentFacing = isStudentFacingPath(pathname);
    const previous = lastStudentFacingRef.current;

    if (previous === null) {
      lastStudentFacingRef.current = studentFacing;
      return;
    }

    if (previous && !studentFacing) {
      clearRuntimeSession();
    }

    if (!previous && studentFacing) {
      restoreRuntimeSessionFromSavedPrefs();
    }

    lastStudentFacingRef.current = studentFacing;
  };

  const toggleSound = (id: FocusSoundId) => {
    const isEnabled = runtimeEnabledSoundIdsRef.current.includes(id);

    if (isEnabled) {
      replaceRuntimeEnabledSoundIds(
        runtimeEnabledSoundIdsRef.current.filter((soundId) => soundId !== id),
      );
      replaceSavedEnabledSoundIds(
        savedEnabledSoundIdsRef.current.filter((soundId) => soundId !== id),
      );
      setPlaybackStatus((current) => ({ ...current, [id]: "idle" }));
      setErrors((current) => ({ ...current, [id]: null }));

      const audio = audioRefs.current[id];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }

    replaceRuntimeEnabledSoundIds([...runtimeEnabledSoundIdsRef.current, id]);
    replaceSavedEnabledSoundIds([...savedEnabledSoundIdsRef.current, id]);
    setPlaybackStatus((current) => ({ ...current, [id]: "paused" }));
    setErrors((current) => ({ ...current, [id]: null }));

    void playSound(id, { resetTime: true });
  };

  const setVolume = (id: FocusSoundId, value: number) => {
    const nextValue = Math.min(1, Math.max(0, value));

    setVolumes((current) => {
      if (current[id] === nextValue) {
        return current;
      }

      const next = { ...current, [id]: nextValue };
      volumesRef.current = next;

      const audio = audioRefs.current[id];
      if (audio) {
        audio.volume = nextValue;
      }

      return next;
    });
  };

  const pauseAll = () => {
    if (runtimeEnabledSoundIdsRef.current.length === 0) {
      return;
    }

    for (const id of runtimeEnabledSoundIdsRef.current) {
      const audio = audioRefs.current[id];
      if (audio) {
        audio.pause();
      }
    }

    setPlaybackStatus((current) => {
      const next = { ...current };

      for (const id of runtimeEnabledSoundIdsRef.current) {
        next[id] = "paused";
      }

      return next;
    });
  };

  const resumeAll = () => {
    if (runtimeEnabledSoundIdsRef.current.length === 0) {
      return;
    }

    void Promise.all(
      runtimeEnabledSoundIdsRef.current.map((id) => playSound(id)),
    );
  };

  const stopAll = () => {
    for (const id of runtimeEnabledSoundIdsRef.current) {
      const audio = audioRefs.current[id];
      if (!audio) {
        continue;
      }

      audio.pause();
      audio.currentTime = 0;
    }

    replaceRuntimeEnabledSoundIds([]);
    replaceSavedEnabledSoundIds([]);
    setPlaybackStatus(createPlaybackStatusMap([]));
    setErrors(createErrorMap());
  };

  const runtimeEnabledSoundIdSet = new Set(runtimeEnabledSoundIds);
  const sounds = FOCUS_SOUND_IDS.map((id) => ({
    ...FOCUS_SOUND_CATALOG[id],
    volume: volumes[id],
    enabled: runtimeEnabledSoundIdSet.has(id),
    playbackStatus: playbackStatus[id],
    errorMessage: errors[id],
  }));
  const activeSoundCount = runtimeEnabledSoundIds.length;
  const isPaused =
    activeSoundCount > 0 &&
    !sounds.some(
      (sound) => sound.enabled && sound.playbackStatus === "playing",
    );

  return (
    <FocusAudioContext.Provider
      value={{
        sounds,
        activeSoundCount,
        isPaused,
        toggleSound,
        setVolume,
        pauseAll,
        resumeAll,
        stopAll,
      }}
    >
      {children}
      <Suspense fallback={null}>
        <FocusAudioPathnameSync onPathnameChange={handlePathnameChange} />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingFocusPlayer />
      </Suspense>
      <Toast toast={toast} />
    </FocusAudioContext.Provider>
  );
}

function FocusAudioPathnameSync({
  onPathnameChange,
}: {
  onPathnameChange: (pathname: string) => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    onPathnameChange(pathname);
  }, [onPathnameChange, pathname]);

  return null;
}

export function useFocusAudio() {
  const context = useContext(FocusAudioContext);

  if (!context) {
    throw new Error("useFocusAudio must be used within a FocusAudioProvider.");
  }

  return context;
}

function FloatingFocusPlayer() {
  const pathname = usePathname();
  const { activeSoundCount, isPaused, pauseAll, resumeAll, sounds, stopAll } =
    useFocusAudio();
  const isVisible = isStudentFacingPath(pathname) && activeSoundCount > 0;
  const activeSoundLabels = sounds
    .filter((sound) => sound.enabled)
    .map((sound) => sound.shortLabel);
  const summary = formatActiveSoundSummary(activeSoundLabels);

  return (
    <AnimatePresence initial={false}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:bottom-6 md:end-6 md:w-[24rem]"
        >
          <div className="rounded-[1.75rem] border border-surface-200/80 bg-white/94 p-3 shadow-[0_28px_70px_-32px_rgba(15,23,42,0.36)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-950/94 dark:shadow-[0_28px_70px_-28px_rgba(2,6,23,0.72)]">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                  isPaused
                    ? "border-surface-200 bg-surface-100 text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
                    : "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/70 dark:text-primary-300"
                }`}
              >
                {isPaused ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 9v6m4-6v6M6.75 6.75h10.5A2.25 2.25 0 0 1 19.5 9v6a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 15V9a2.25 2.25 0 0 1 2.25-2.25Z"
                    />
                  </svg>
                ) : (
                  <motion.span
                    animate={{ scale: [1, 1.12, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="block h-3 w-3 rounded-full bg-current"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                      جلسة التركيز
                    </p>
                    <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                      {isPaused ? "متوقفة مؤقتاً" : "تعمل الآن"} • {summary}
                    </p>
                  </div>

                  <span className="rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-[0.7rem] font-semibold text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
                    {activeSoundCount === 1
                      ? "صوت واحد"
                      : `${activeSoundCount} أصوات`}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href="/focus"
                    className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/50 dark:hover:text-primary-300"
                  >
                    <span>العودة لأصوات التركيز</span>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.25 6.75 8.25 12l6 5.25"
                      />
                    </svg>
                  </Link>

                  <button
                    type="button"
                    onClick={isPaused ? resumeAll : pauseAll}
                    className="inline-flex items-center rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:border-primary-700 dark:hover:bg-primary-950"
                  >
                    {isPaused ? "استئناف الكل" : "إيقاف مؤقت"}
                  </button>

                  <button
                    type="button"
                    onClick={stopAll}
                    className="inline-flex items-center rounded-xl border border-surface-200 px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-surface-700 dark:text-surface-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                  >
                    إيقاف الكل
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
