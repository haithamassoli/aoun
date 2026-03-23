"use client";

import {
  getGpaColors,
  getGpaLabel,
  getGpaLetter,
  getScaleMaxGpa,
  type GpaResult,
  type GradeScale,
} from "@/lib/gpa-utils";

interface GpaResultCardProps {
  result: GpaResult;
  scale: GradeScale;
  title?: string;
}

export function GpaResultCard({
  result,
  scale,
  title = "نتيجة الحساب",
}: GpaResultCardProps) {
  const colors = getGpaColors(result.gpa);
  const label = getGpaLabel(result.gpa);
  const letter = getGpaLetter(result.gpa, scale);
  const maxGpa = getScaleMaxGpa(scale);
  const percentage = maxGpa > 0 ? (result.gpa / maxGpa) * 100 : 0;

  return (
    <div
      className={`rounded-2xl border-2 p-6 ${colors.bg} ${colors.border} transition-all`}
    >
      <p className="mb-3 text-center text-sm font-medium text-surface-500 dark:text-surface-400">
        {title}
      </p>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-end sm:gap-3">
          <span className={`text-5xl font-bold tabular-nums sm:text-6xl ${colors.text}`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="text-lg font-semibold tabular-nums text-surface-700 dark:text-surface-200">
            {result.gpa.toFixed(2)} / {maxGpa.toFixed(2)}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          {label}
        </span>
        <span className="rounded-full border border-surface-200 bg-white px-3 py-1 text-sm font-semibold text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200">
          {letter}
        </span>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          النسبة المكافئة والمعدل بالنقاط مع الدرجة الحرفية
        </p>
      </div>
      <div className="mt-4 flex justify-center gap-6 border-t border-current/10 pt-4 text-sm text-surface-500 dark:text-surface-400">
        <div className="text-center">
          <p className="font-semibold text-surface-700 dark:text-surface-200">
            {result.totalCredits}
          </p>
          <p>ساعة معتمدة</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-surface-700 dark:text-surface-200">
            {result.totalPoints.toFixed(2)}
          </p>
          <p>مجموع النقاط</p>
        </div>
      </div>
    </div>
  );
}
