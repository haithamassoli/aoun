"use client";

import { getGpaColors, getGpaLabel, type GpaResult } from "@/lib/gpa-utils";

interface GpaResultCardProps {
  result: GpaResult;
  title?: string;
}

export function GpaResultCard({ result, title = "نتيجة الحساب" }: GpaResultCardProps) {
  const colors = getGpaColors(result.gpa);
  const label = getGpaLabel(result.gpa);

  return (
    <div
      className={`rounded-2xl border-2 p-6 ${colors.bg} ${colors.border} transition-all`}
    >
      <p className="mb-3 text-center text-sm font-medium text-surface-500 dark:text-surface-400">
        {title}
      </p>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-6xl font-bold tabular-nums ${colors.text}`}>
          {result.gpa.toFixed(2)}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          {label}
        </span>
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
