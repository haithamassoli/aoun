"use client";

import { motion } from "motion/react";
import { useFocusAudio } from "@/components/focus-audio-provider";
import type { FocusSoundIcon } from "@/lib/focus-sounds";



function FocusSoundIcon({ icon }: { icon: FocusSoundIcon }) {
  if (icon === "rain") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 9a4.5 4.5 0 0 1 8.62-1.66A3.3 3.3 0 0 1 16.75 14H7.75a3.75 3.75 0 1 1-.25-7.5"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.75 16-.75 2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m12 16-.75 2.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.25 16-.75 2" />
      </svg>
    );
  }

  if (icon === "storm") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.25 9.5a4.75 4.75 0 0 1 9.15-1.74A3.35 3.35 0 0 1 16.9 14.5H7.8a3.8 3.8 0 1 1-.55-7.56"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m12.75 13.5-2.25 3.75h2l-1 3.25 3-4.75h-2.05l1-2.25Z"
        />
      </svg>
    );
  }

  if (icon === "waves") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.75 10.5c1.2 0 1.2 1.5 2.4 1.5s1.2-1.5 2.4-1.5 1.2 1.5 2.4 1.5 1.2-1.5 2.4-1.5 1.2 1.5 2.4 1.5 1.2-1.5 2.4-1.5 1.2 1.5 2.45 1.5"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.75 15c1.2 0 1.2 1.5 2.4 1.5s1.2-1.5 2.4-1.5 1.2 1.5 2.4 1.5 1.2-1.5 2.4-1.5 1.2 1.5 2.4 1.5 1.2-1.5 2.4-1.5 1.2 1.5 2.45 1.5"
        />
      </svg>
    );
  }

  if (icon === "water") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3.25c-2 3.05-5 5.98-5 9a5 5 0 1 0 10 0c0-3.02-3-5.95-5-9Z"
        />
      </svg>
    );
  }

  if (icon === "forest") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.75v-8" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m12 4.25-4 5.1h2.5l-2 2.9h3.5m0-8 4 5.1h-2.5l2 2.9H12m-4.5 7.5h9"
        />
      </svg>
    );
  }

  if (icon === "wind") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 9.25h10.5a2.25 2.25 0 1 0-2.25-2.25"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.75h15.25A2.25 2.25 0 1 1 16 16"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.25h8.5" />
      </svg>
    );
  }

  if (icon === "fire") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12.8 4c.22 2.3 2.64 3.17 2.64 5.93 0 1.07-.46 1.96-1.35 2.9-.72-1.07-1.74-1.92-2.86-2.43-1.14 1.34-2.48 2.63-2.48 4.74 0 2.7 1.96 4.86 4.4 4.86s4.4-2.16 4.4-4.86c0-3.37-2-5.63-4.03-7.66-.24-.24-.47-.48-.72-.73Z"
        />
      </svg>
    );
  }

  if (icon === "coffee") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.5v3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 4.5v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5.5v3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.75 9.5h10.5v4.25a3.5 3.5 0 0 1-3.5 3.5h-3.5a3.5 3.5 0 0 1-3.5-3.5V9.5Zm10.5 1.25h1a2.5 2.5 0 0 1 0 5h-1"
        />
      </svg>
    );
  }

  if (icon === "city") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V9l5-2.25V19.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.5 19.5V4.5L19.5 8v11.5M12.5 9.5h.01M12.5 12.5h.01M12.5 15.5h.01M16 10.5h.01M16 13.5h.01"
        />
      </svg>
    );
  }

  if (icon === "travel") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m3.75 12 15-4.5 1.5 1.5-5.75 3.25 2.5 2-.75 1-3.25-1-2.5 4-.9-.35.75-4.15-4.6-.75Z"
        />
      </svg>
    );
  }

  if (icon === "noise") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 16h14" />
        <circle cx="9" cy="8" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="11" cy="16" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (icon === "night") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.75 4.25a7 7 0 1 0 5 12.1 7.25 7.25 0 1 1-5-12.1Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m17.5 6.5.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
      </svg>
    );
  }

  if (icon === "space") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="2.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 13c0-2.75 3.35-5 7.5-5s7.5 2.25 7.5 5-3.35 5-7.5 5-7.5-2.25-7.5-5Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 8.5 1.5-1" />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v3.5l2.5 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 19.5h11" />
    </svg>
  );
}

export function FocusSoundStudio() {
  const {
    sounds,
    activeSoundCount,
    isPaused,
    pauseAll,
    resumeAll,
    setVolume,
    stopAll,
    toggleSound,
  } = useFocusAudio();

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Control Bar */}
        {activeSoundCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <svg
                  className="h-5 w-5 text-primary-600 dark:text-primary-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v18m0-18c4.97 0 9 4.03 9 9s-4.03 9-9 9m0-18c-4.97 0-9 4.03-9 9s4.03 9 9 9" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {activeSoundCount === 1
                    ? "صوت واحد نشط"
                    : activeSoundCount === 2
                      ? "صوتان نشطان"
                      : `${activeSoundCount} أصوات نشطة`}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {isPaused ? "متوقف مؤقتاً" : "يعمل الآن"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={isPaused ? resumeAll : pauseAll}
                className="flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                {isPaused ? (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="hidden sm:inline">استئناف</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    <span className="hidden sm:inline">إيقاف</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={stopAll}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-300 bg-white text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Sound Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sounds.map((sound, index) => (
            <motion.article
              key={sound.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                delay: index * 0.02,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`group relative overflow-hidden rounded-2xl border transition-all ${
                sound.enabled
                  ? "border-surface-300 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900"
                  : "border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-950"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all"
                    style={{
                      borderColor: sound.enabled
                        ? sound.accentColor
                        : "rgb(226 232 240)",
                      backgroundColor: sound.enabled
                        ? `${sound.accentColor}12`
                        : "transparent",
                      color: sound.enabled ? sound.accentColor : "rgb(148 163 184)",
                    }}
                  >
                    <FocusSoundIcon icon={sound.icon} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-surface-900 dark:text-surface-50">
                      {sound.label}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {sound.categoryLabel}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSound(sound.id)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    sound.enabled
                      ? "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                      : "bg-surface-900 text-white hover:bg-surface-800 dark:bg-surface-50 dark:text-surface-950 dark:hover:bg-surface-200"
                  }`}
                  aria-label={sound.enabled ? `إيقاف ${sound.label}` : `تشغيل ${sound.label}`}
                >
                  {sound.enabled ? "إيقاف" : "تشغيل"}
                </button>
              </div>

              {/* Description */}
              <p className="px-4 pb-4 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {sound.description}
              </p>

              {/* Volume Control - Only show when enabled */}
              {sound.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-surface-200 bg-surface-50/50 p-4 dark:border-surface-800 dark:bg-surface-950/50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={`مستوى صوت ${sound.label}`}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(sound.volume * 100)}
                      onChange={(event) =>
                        setVolume(sound.id, Number(event.target.value) / 100)
                      }
                      className="h-2 flex-1 cursor-pointer rounded-full"
                      style={{ accentColor: sound.accentColor }}
                    />
                    <span
                      className="min-w-[3ch] text-sm font-semibold tabular-nums"
                      style={{ color: sound.accentColor }}
                    >
                      {Math.round(sound.volume * 100)}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        sound.playbackStatus === "playing" ? "animate-pulse" : ""
                      }`}
                      style={{ backgroundColor: sound.accentColor }}
                    />
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      {sound.playbackStatus === "playing"
                        ? "يعمل الآن"
                        : "متوقف مؤقتاً"}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {sound.errorMessage && (
                <div className="border-t border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {sound.errorMessage}
                  </p>
                </div>
              )}
            </motion.article>
          ))}
        </div>

        {/* Empty State */}
        {activeSoundCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-2xl border border-dashed border-surface-300 bg-surface-50/50 p-8 text-center dark:border-surface-700 dark:bg-surface-950/50"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
              <svg
                className="h-8 w-8 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-surface-50">
              اختر صوتاً للبدء
            </h3>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
              اضغط على "تشغيل" في أي بطاقة لبدء جلسة التركيز
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
