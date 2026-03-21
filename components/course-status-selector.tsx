"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CourseProgressStatus } from "@/lib/student-progress";

type CourseStatusSelectorProps = {
  value: CourseProgressStatus;
  onChange: (status: CourseProgressStatus) => void;
  ariaLabel: string;
  compact?: boolean;
};

type CourseStatusOption = {
  value: CourseProgressStatus;
  label: string;
  compactLabel: string;
  dotClassName: string;
};

type CourseStatusMenuProps = {
  value: CourseProgressStatus;
  onChange: (status: CourseProgressStatus) => void;
  ariaLabel: string;
};

export const courseStatusOptions: CourseStatusOption[] = [
  {
    value: "none",
    label: "بدون حالة",
    compactLabel: "بدون",
    dotClassName: "bg-surface-400 dark:bg-surface-500",
  },
  {
    value: "in_progress",
    label: "قيد الدراسة",
    compactLabel: "قيد",
    dotClassName: "bg-amber-500",
  },
  {
    value: "completed",
    label: "مكتمل",
    compactLabel: "مكتمل",
    dotClassName: "bg-emerald-500",
  },
  {
    value: "hidden",
    label: "مخفي من الخطة",
    compactLabel: "مخفي",
    dotClassName: "bg-slate-500",
  },
];

const courseStatusOptionsByValue: Record<
  CourseProgressStatus,
  CourseStatusOption
> = {
  none: courseStatusOptions[0],
  in_progress: courseStatusOptions[1],
  completed: courseStatusOptions[2],
  hidden: courseStatusOptions[3],
};

export function getCourseStatusOption(value: CourseProgressStatus) {
  return courseStatusOptionsByValue[value];
}

function getSelectorClassName(compact: boolean) {
  if (compact) {
    return "grid grid-cols-2 gap-1 rounded-xl border border-surface-200/80 bg-surface-100/80 p-1 dark:border-surface-700 dark:bg-surface-950/50 sm:grid-cols-4";
  }

  return "grid grid-cols-1 gap-1.5 rounded-2xl border border-surface-200/80 bg-surface-50/80 p-1.5 dark:border-surface-700 dark:bg-surface-900/70 sm:grid-cols-4";
}

function getButtonClassName(isActive: boolean, compact: boolean) {
  if (compact) {
    const baseClassName =
      "inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-lg border px-1.5 py-1 text-[10px] font-semibold leading-4 tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-950";

    if (isActive) {
      return `${baseClassName} border-primary-200 bg-white text-primary-700 shadow-[0_6px_14px_-10px_rgba(37,99,235,0.7)] dark:border-primary-700 dark:bg-surface-900 dark:text-primary-300`;
    }

    return `${baseClassName} border-transparent bg-transparent text-surface-500 hover:border-surface-200 hover:bg-white/70 hover:text-surface-700 dark:text-surface-400 dark:hover:border-surface-800 dark:hover:bg-surface-900/70 dark:hover:text-surface-200`;
  }

  const sizeClassName =
    "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold leading-5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-950";

  if (isActive) {
    return `${sizeClassName} border-primary-200 bg-white text-primary-700 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.75)] dark:border-primary-700 dark:bg-surface-900 dark:text-primary-300`;
  }

  return `${sizeClassName} border-transparent bg-transparent text-surface-500 hover:border-surface-200 hover:bg-white/80 hover:text-surface-700 dark:text-surface-400 dark:hover:border-surface-800 dark:hover:bg-surface-900/80 dark:hover:text-surface-200`;
}

function getMenuItemClassName(isActive: boolean) {
  const baseClassName =
    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-right text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-950";

  if (isActive) {
    return `${baseClassName} border-primary-200 bg-primary-50/80 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300`;
  }

  return `${baseClassName} border-transparent bg-transparent text-surface-600 hover:border-surface-200 hover:bg-surface-50 hover:text-surface-800 dark:text-surface-300 dark:hover:border-surface-700 dark:hover:bg-surface-900 dark:hover:text-surface-100`;
}

export function CourseStatusSelector({
  value,
  onChange,
  ariaLabel,
  compact = false,
}: CourseStatusSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={getSelectorClassName(compact)}
    >
      {courseStatusOptions.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={getButtonClassName(isActive, compact)}
            title={option.label}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${option.dotClassName}`}
              aria-hidden="true"
            />
            {compact ? option.compactLabel : option.label}
          </button>
        );
      })}
    </div>
  );
}

export function CourseStatusMenu({
  value,
  onChange,
  ariaLabel,
}: CourseStatusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-4 w-4 sm:h-9 sm:w-9 items-center justify-center rounded-xl sm:border border-surface-200/80 sm:bg-surface-50 text-surface-500 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-surface-700 dark:sm:bg-surface-800/80 dark:text-surface-400 dark:hover:border-primary-600 dark:hover:bg-primary-950/60 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950"
      >
        <span className="sr-only">تغيير الحالة</span>
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="10" cy="4" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="10" cy="16" r="1.75" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          className="absolute end-0 bottom-full z-20 mb-2 w-44 rounded-2xl border border-surface-200/80 bg-white/98 p-1.5 shadow-[0_22px_44px_-26px_rgba(15,23,42,0.5)] backdrop-blur-sm dark:border-surface-700 dark:bg-surface-900/98 dark:shadow-none"
        >
          {courseStatusOptions.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={getMenuItemClassName(isActive)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${option.dotClassName}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </span>

                {isActive ? (
                  <svg
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 10.5l3 3 7-7"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
