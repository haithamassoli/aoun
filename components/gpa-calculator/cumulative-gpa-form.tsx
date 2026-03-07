"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { GRADE_SCALES, calculateCumulativeGpa, type GradeScale } from "@/lib/gpa-utils";
import { type CourseRowValues } from "@/lib/gpa-schemas";
import { GpaResultCard } from "./gpa-result-card";
import { CourseRow } from "./course-row";
import type { GpaResult } from "@/lib/gpa-utils";

const newCourse = (): CourseRowValues => ({
  name: "",
  creditHours: 3,
  gradeType: "letter",
  grade: "",
});

const inputCls =
  "w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100";

export function CumulativeGpaForm() {
  const [courses, setCourses] = useState<CourseRowValues[]>([newCourse()]);
  const [result, setResult] = useState<GpaResult | null>(null);
  const [courseErrors, setCourseErrors] = useState<Record<number, string>>({});

  const form = useForm({
    defaultValues: {
      gradeScale: "jordan_standard" as GradeScale,
      previousGpa: "" as string | number,
      previousCreditHours: "" as string | number,
      courses: [newCourse()],
    },
    onSubmit: ({ value }) => {
      const gradeScale = value.gradeScale as GradeScale;
      const errors: Record<number, string> = {};
      let valid = true;

      courses.forEach((course, i) => {
        if (!course.grade) {
          errors[i] = "الدرجة مطلوبة";
          valid = false;
        }
      });

      if (!valid) {
        setCourseErrors(errors);
        return;
      }

      setCourseErrors({});
      const prevGpa = value.previousGpa !== "" ? Number(value.previousGpa) : undefined;
      const prevCredits = value.previousCreditHours !== "" ? Number(value.previousCreditHours) : undefined;

      const computed = calculateCumulativeGpa(courses, gradeScale, prevGpa, prevCredits);
      setResult(computed);
    },
  });

  const syncCourses = (updated: CourseRowValues[]) => {
    setCourses(updated);
    form.setFieldValue("courses", updated);
    setResult(null);
  };

  const addCourse = () => syncCourses([...courses, newCourse()]);

  const removeCourse = (i: number) =>
    syncCourses(courses.filter((_, idx) => idx !== i));

  const updateCourse = (i: number, updated: CourseRowValues) => {
    const next = courses.map((c, idx) => (idx === i ? updated : c));
    syncCourses(next);
    if (courseErrors[i]) {
      const errs = { ...courseErrors };
      delete errs[i];
      setCourseErrors(errs);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        {/* Grade Scale */}
        <div>
          <form.Field name="gradeScale">
            {(field: any) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-200">
                  سلّم الدرجات
                </label>
                <select
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value as GradeScale);
                    syncCourses(courses.map((c) => ({ ...c, grade: c.gradeType === "letter" ? "" : c.grade })));
                  }}
                  className={inputCls}
                >
                  {Object.entries(GRADE_SCALES).map(([key, scale]) => (
                    <option key={key} value={key}>
                      {scale.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
        </div>

        {/* Previous GPA */}
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
          <h3 className="mb-3 text-sm font-semibold text-surface-700 dark:text-surface-200">
            المعدل السابق (اختياري)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="previousGpa">
              {(field: any) => {
                const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <div>
                    <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                      المعدل التراكمي السابق
                    </label>
                    <input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => { field.handleChange(e.target.value); setResult(null); }}
                      onBlur={field.handleBlur}
                      placeholder="0.00"
                      min={0}
                      max={4}
                      step={0.01}
                      className={`${inputCls}${hasError ? " border-red-400 dark:border-red-600" : ""}`}
                    />
                    {hasError && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        {field.state.meta.errors
                          .map((e: unknown) =>
                            typeof e === "string" ? e : (e as { message?: string })?.message ?? String(e),
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="previousCreditHours">
              {(field: any) => {
                const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <div>
                    <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                      الساعات المعتمدة السابقة
                    </label>
                    <input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => { field.handleChange(e.target.value); setResult(null); }}
                      onBlur={field.handleBlur}
                      placeholder="0"
                      min={0}
                      className={`${inputCls}${hasError ? " border-red-400 dark:border-red-600" : ""}`}
                    />
                    {hasError && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        {field.state.meta.errors
                          .map((e: unknown) =>
                            typeof e === "string" ? e : (e as { message?: string })?.message ?? String(e),
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>
        </div>

        {/* Current Semester Courses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
              مواد الفصل الحالي
            </h3>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {courses.length} {courses.length === 1 ? "مادة" : "مواد"}
            </span>
          </div>

          <form.Field name="gradeScale">
            {(scaleField: any) => (
              <div className="space-y-2">
                {courses.map((course, i) => (
                  <CourseRow
                    key={i}
                    course={course}
                    index={i}
                    gradeScale={scaleField.state.value as GradeScale}
                    error={courseErrors[i]}
                    onChange={(updated) => updateCourse(i, updated)}
                    onRemove={() => removeCourse(i)}
                    canRemove={courses.length > 1}
                  />
                ))}
              </div>
            )}
          </form.Field>

          <button
            type="button"
            onClick={addCourse}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-300 py-3 text-sm font-medium text-surface-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-surface-600 dark:text-surface-400 dark:hover:border-primary-500 dark:hover:text-primary-400"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            إضافة مادة
          </button>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
        >
          احسب المعدل التراكمي
        </button>
      </form>

      {result && <GpaResultCard result={result} title="المعدل التراكمي" />}
    </div>
  );
}
