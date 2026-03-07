"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  DEFAULT_GRADE_SCALE,
  GRADE_TYPE_LABELS,
  calculateSemesterGpa,
  type GradeType,
} from "@/lib/gpa-utils";
import { type CourseRowValues } from "@/lib/gpa-schemas";
import { GpaResultCard } from "./gpa-result-card";
import { CourseRow } from "./course-row";
import type { GpaResult } from "@/lib/gpa-utils";

const newCourse = (gradeType: GradeType): CourseRowValues => ({
  name: "",
  creditHours: 3,
  gradeType,
  grade: "",
});

const inputCls =
  "w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100";

type GradeTypeField = {
  state: { value: GradeType };
  handleChange: (value: GradeType) => void;
};

export function SemesterGpaForm() {
  const [gradeType, setGradeType] = useState<GradeType>("letter");
  const [courses, setCourses] = useState<CourseRowValues[]>([newCourse("letter")]);
  const [result, setResult] = useState<GpaResult | null>(null);
  const [courseErrors, setCourseErrors] = useState<Record<number, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      gradeType: "letter" as GradeType,
      courses: [newCourse("letter")],
    },
    onSubmit: () => {
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
        setGlobalError(null);
        return;
      }

      setCourseErrors({});
      setGlobalError(null);
      const computed = calculateSemesterGpa(courses, DEFAULT_GRADE_SCALE);
      setResult(computed);
    },
  });

  const syncCourses = (updated: CourseRowValues[]) => {
    setCourses(updated);
    form.setFieldValue("courses", updated);
    setResult(null);
  };

  const addCourse = () => syncCourses([...courses, newCourse(gradeType)]);

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

  const handleGradeTypeChange = (nextGradeType: GradeType) => {
    setGradeType(nextGradeType);
    form.setFieldValue("gradeType", nextGradeType);
    setGlobalError(null);
    syncCourses(
      courses.map((course) => ({
        ...course,
        gradeType: nextGradeType,
        grade: "",
      })),
    );
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
        {/* Grade Type */}
        <div>
          <form.Field name="gradeType">
            {(field: GradeTypeField) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-200">
                  نوع الدرجة
                </label>
                <select
                  value={field.state.value}
                  onChange={(e) => {
                    const nextGradeType = e.target.value as GradeType;
                    field.handleChange(nextGradeType);
                    handleGradeTypeChange(nextGradeType);
                  }}
                  className={inputCls}
                >
                  {Object.entries(GRADE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  النوع المختار سيُطبّق على جميع المواد في هذا النموذج.
                </p>
              </div>
            )}
          </form.Field>
        </div>

        {/* Course List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
              المواد الدراسية
            </h3>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {courses.length} {courses.length === 1 ? "مادة" : "مواد"}
            </span>
          </div>

          <div className="space-y-2">
            {courses.map((course, i) => (
              <CourseRow
                key={i}
                course={course}
                index={i}
                gradeScale={DEFAULT_GRADE_SCALE}
                error={courseErrors[i]}
                onChange={(updated) => updateCourse(i, updated)}
                onRemove={() => removeCourse(i)}
                canRemove={courses.length > 1}
                allowGradeTypeChange={false}
              />
            ))}
          </div>

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

        {globalError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {globalError}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
        >
          احسب المعدل
        </button>
      </form>

      {result && (
        <GpaResultCard
          result={result}
          scale={DEFAULT_GRADE_SCALE}
          title="معدل الفصل الدراسي"
        />
      )}
    </div>
  );
}
