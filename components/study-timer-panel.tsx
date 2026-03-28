"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useStudyTimer } from "@/components/study-timer-provider";
import {
  STUDY_TIMER_LIMITS,
  type StudyTimerPhase,
  type StudyTimerSettings,
} from "@/lib/study-timer";

type SettingFieldKey = Exclude<keyof StudyTimerSettings, "version">;

const SETTING_FIELD_CONFIG: Array<{
  key: SettingFieldKey;
  label: string;
  max: number;
  min: number;
  unit: string;
}> = [
  {
    key: "workMinutes",
    label: "دقائق العمل",
    min: 1,
    max: STUDY_TIMER_LIMITS.workMinutes,
    unit: "دقيقة",
  },
  {
    key: "shortBreakMinutes",
    label: "الاستراحة القصيرة",
    min: 1,
    max: STUDY_TIMER_LIMITS.shortBreakMinutes,
    unit: "دقيقة",
  },
  {
    key: "longBreakMinutes",
    label: "الاستراحة الطويلة",
    min: 1,
    max: STUDY_TIMER_LIMITS.longBreakMinutes,
    unit: "دقيقة",
  },
  {
    key: "sessionsPerCycle",
    label: "جلسات لكل دورة",
    min: 1,
    max: STUDY_TIMER_LIMITS.sessionsPerCycle,
    unit: "جلسة",
  },
];

export function StudyTimerPanel() {
  const {
    remainingMs,
    resetTimer,
    resumeTimer,
    rollingWeekTotalMs,
    runtime,
    settings,
    startTimer,
    todayTotalMs,
    updateSettings,
    pauseTimer,
  } = useStudyTimer();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const completedSessions = Math.min(
    runtime.completedWorkSessionsInCycle,
    settings.sessionsPerCycle,
  );

  const handleSettingChange = (key: SettingFieldKey, value: string) => {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    updateSettings({ [key]: parsedValue });
  };

  return (
    <motion.section
      id="study-timer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5"
    >
      {/* Main Timer Display */}
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-center gap-3 px-4 sm:gap-4">
        {/* Progress Circle */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm dark:bg-white/10 sm:h-24 sm:w-24"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-surface-900 dark:text-white sm:text-3xl">
              {completedSessions}
            </p>
            <p className="text-xs font-medium text-surface-700 dark:text-white/80 sm:text-sm">
              /{settings.sessionsPerCycle}
            </p>
          </div>
        </motion.div>

        {/* Timer Display */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative flex flex-1 items-center justify-center gap-3 rounded-full bg-white/90 px-6 py-5 backdrop-blur-sm dark:bg-white/10 sm:gap-4 sm:px-8 sm:py-6"
        >
          {runtime.status !== "idle" && (
            <>
              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen((current) => !current)}
                className="absolute start-4 flex h-10 w-10 items-center justify-center rounded-full text-surface-700 transition-all hover:bg-surface-200 hover:text-surface-900 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-white sm:start-6"
                aria-label="الإعدادات"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={resetTimer}
                className="absolute end-4 flex h-10 w-10 items-center justify-center rounded-full text-surface-700 transition-all hover:bg-surface-200 hover:text-surface-900 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-white sm:end-6"
                aria-label="إعادة ضبط"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
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
            </>
          )}

          {/* Timer Text */}
          <div className="text-center" aria-live="polite">
            <p className="text-4xl font-bold tracking-tight text-surface-900 tabular-nums dark:text-white sm:text-5xl md:text-6xl">
              {formatTimerClock(remainingMs)}
            </p>
            {runtime.status !== "idle" && (
              <>
                <p className="mt-1 text-xs font-medium text-surface-700 dark:text-white/80 sm:text-sm">
                  {getPhaseLabel(runtime.phase)}
                </p>
                <span className="sr-only">
                  يصدر المؤقت تنبيهاً صوتياً عند انتهاء المرحلة الحالية.
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Play/Pause Button */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          type="button"
          onClick={
            runtime.status === "idle"
              ? startTimer
              : runtime.status === "running"
                ? pauseTimer
                : resumeTimer
          }
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/90 text-surface-900 backdrop-blur-sm transition-all hover:bg-white active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:h-24 sm:w-24"
          aria-label={
            runtime.status === "idle"
              ? "ابدأ الجلسة"
              : runtime.status === "running"
                ? "إيقاف مؤقت"
                : "استئناف"
          }
        >
          {runtime.status === "running" ? (
            <svg
              className="h-7 w-7 sm:h-8 sm:w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z" />
            </svg>
          ) : (
            <svg
              className="h-7 w-7 sm:h-8 sm:w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence initial={false}>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-auto max-w-4xl px-4">
              <div className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-sm dark:border-white/20 dark:bg-white/5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {SETTING_FIELD_CONFIG.map((field) => (
                    <label
                      key={field.key}
                      className="rounded-xl bg-white/90 p-3 dark:bg-white/10"
                    >
                      <span className="text-xs font-medium text-surface-700 dark:text-white/90">
                        {field.label}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={1}
                          value={settings[field.key]}
                          onChange={(event) =>
                            handleSettingChange(field.key, event.target.value)
                          }
                          className="w-full rounded-lg border border-surface-300 bg-white px-2.5 py-2 text-sm font-medium text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-white/20 dark:bg-white/10 dark:text-white"
                        />
                        <span className="shrink-0 text-xs font-medium text-surface-600 dark:text-white/70">
                          {field.unit}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mx-auto mt-6 max-w-4xl px-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <StudyTimerStat
            label="التقدم"
            value={`${completedSessions}/${settings.sessionsPerCycle}`}
          />
          <StudyTimerStat
            label="اليوم"
            value={formatStudyDuration(todayTotalMs)}
          />
          <StudyTimerStat
            label="7 أيام"
            value={formatStudyDuration(rollingWeekTotalMs)}
          />
        </div>
      </motion.div>
    </motion.section>
  );
}

function StudyTimerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/30 bg-white/80 px-4 py-3 text-center backdrop-blur-sm dark:border-white/20 dark:bg-white/5">
      <p className="text-xs font-medium text-surface-600 dark:text-white/70">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-surface-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function formatTimerClock(durationMs: number) {
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

function formatStudyDuration(durationMs: number) {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} د`;
  }

  if (minutes === 0) {
    return `${hours} س`;
  }

  return `${hours} س ${minutes} د`;
}

function getPhaseLabel(phase: StudyTimerPhase) {
  switch (phase) {
    case "work":
      return "جلسة عمل";
    case "shortBreak":
      return "استراحة قصيرة";
    case "longBreak":
      return "استراحة طويلة";
  }
}
