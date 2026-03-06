"use client";

import type { CourseProgressStatus } from "@/lib/student-progress";

type CourseStatusSelectorProps = {
  value: CourseProgressStatus;
  onChange: (status: CourseProgressStatus) => void;
  ariaLabel: string;
  compact?: boolean;
};

const statusOptions: {
  value: CourseProgressStatus;
  label: string;
  dotClassName: string;
}[] = [
  {
    value: "none",
    label: "بدون حالة",
    dotClassName: "bg-surface-400 dark:bg-surface-500",
  },
  {
    value: "in_progress",
    label: "قيد الدراسة",
    dotClassName: "bg-amber-500",
  },
  {
    value: "completed",
    label: "مكتمل",
    dotClassName: "bg-emerald-500",
  },
];

function getButtonClassName(isActive: boolean, compact: boolean) {
  const sizeClassName = compact
    ? "px-2.5 py-1 text-[11px]"
    : "px-3 py-1.5 text-xs";

  if (isActive) {
    return `${sizeClassName} inline-flex items-center gap-1.5 rounded-full border border-primary-300 bg-primary-50 font-semibold text-primary-700 transition-colors dark:border-primary-600 dark:bg-primary-900/40 dark:text-primary-300`;
  }

  return `${sizeClassName} inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white text-surface-500 transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:border-primary-700 dark:hover:text-primary-300`;
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
      className="flex flex-wrap items-center gap-2"
    >
      {statusOptions.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={getButtonClassName(isActive, compact)}
          >
            <span
              className={`h-2 w-2 rounded-full ${option.dotClassName}`}
              aria-hidden="true"
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
