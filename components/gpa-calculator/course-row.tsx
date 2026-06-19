"use client";

import {
  GRADE_TYPE_LABELS,
  getLetterGrades,
  getScaleMaxGpa,
  type GradeType,
  type GradeScale,
} from "@/lib/gpa-utils";
import { saveGradeTypePreference } from "@/lib/gpa-preferences";
import type { CourseRowValues } from "@/lib/gpa-schemas";

const inputCls =
  "w-full rounded-lg border border-surface-300 bg-white px-2 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100";

const CREDIT_HOUR_OPTIONS = [
  1, 1.5, 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5, 6,
];

interface CourseRowProps {
  course: CourseRowValues;
  index: number;
  gradeScale: GradeScale;
  error?: string;
  onChange: (updated: CourseRowValues) => void;
  onRemove: () => void;
  canRemove: boolean;
  allowGradeTypeChange?: boolean;
}

export function CourseRow({
  course,
  index,
  gradeScale,
  error,
  onChange,
  onRemove,
  canRemove,
  allowGradeTypeChange = true,
}: CourseRowProps) {
  const letterGrades = getLetterGrades(gradeScale);
  const maxGpa = getScaleMaxGpa(gradeScale);

  const handleField = <K extends keyof CourseRowValues>(
    key: K,
    value: CourseRowValues[K],
  ) => {
    const updated = { ...course, [key]: value };
    if (key === "gradeType") {
      updated.grade = "";
      saveGradeTypePreference(value as GradeType);
    }
    onChange(updated);
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
      <div className="flex items-start gap-2">
        <span className="mt-2 shrink-0 text-xs font-medium text-surface-400 dark:text-surface-500">
          {index + 1}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div
            className={`grid grid-cols-2 gap-2 ${
              allowGradeTypeChange ? "sm:grid-cols-4" : "sm:grid-cols-3"
            }`}
          >
            {/* Course Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                اسم المادة (اختياري)
              </label>
              <input
                type="text"
                value={course.name ?? ""}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="مثال: رياضيات"
                className={inputCls}
              />
            </div>

            {/* Credit Hours */}
            <div>
              <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                الساعات
              </label>
              <select
                value={course.creditHours}
                onChange={(e) =>
                  handleField("creditHours", Number(e.target.value))
                }
                className={inputCls}
              >
                {CREDIT_HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Type */}
            {allowGradeTypeChange && (
              <div>
                <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                  نوع الدرجة
                </label>
                <div className="overflow-hidden rounded-lg border border-surface-300 dark:border-surface-600">
                  <div className="flex">
                    {Object.entries(GRADE_TYPE_LABELS).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          handleField("gradeType", type as CourseRowValues["gradeType"])
                        }
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                          course.gradeType === type
                            ? "bg-primary-600 text-white"
                            : "bg-white text-surface-600 hover:bg-surface-100 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Grade Input */}
            <div>
              <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                الدرجة
              </label>
              {course.gradeType === "letter" ? (
                <select
                  value={course.grade}
                  onChange={(e) => handleField("grade", e.target.value)}
                  className={`${inputCls}${!course.grade ? " border-red-300 dark:border-red-700" : ""}`}
                >
                  <option value="">اختر</option>
                  {letterGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={course.grade}
                  onChange={(e) => handleField("grade", e.target.value)}
                  placeholder={
                    course.gradeType === "percentage"
                      ? "0–100"
                      : `0–${maxGpa.toFixed(2)}`
                  }
                  min={0}
                  max={course.gradeType === "percentage" ? 100 : maxGpa}
                  step={course.gradeType === "percentage" ? 1 : 0.01}
                  className={`${inputCls}${!course.grade ? " border-red-300 dark:border-red-700" : ""}`}
                />
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="حذف المادة"
          className="mt-6 shrink-0 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
