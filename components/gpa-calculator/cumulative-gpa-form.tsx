"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  DEFAULT_GRADE_SCALE,
  GRADE_TYPE_LABELS,
  calculateCumulativeGpa,
  getScaleMaxGpa,
  type GradeType,
  type GpaResult,
  type GradeScale,
} from "@/lib/gpa-utils";
import {
  saveGradeTypePreference,
  useGradeTypePreference,
} from "@/lib/gpa-preferences";
import { type CourseRowValues } from "@/lib/gpa-schemas";
import { GpaResultCard } from "./gpa-result-card";
import { CourseRow } from "./course-row";

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

type NumericField = {
  state: { value: string | number };
  handleChange: (value: string) => void;
  handleBlur: () => void;
};

interface CumulativeGpaFormProps {
  onCalculated?: (result: GpaResult) => void;
  scale?: GradeScale;
}

interface CumulativeGpaFormContentProps extends CumulativeGpaFormProps {
  initialGradeType: GradeType;
}

function CumulativeGpaFormContent({
  onCalculated,
  scale = DEFAULT_GRADE_SCALE,
  initialGradeType,
}: CumulativeGpaFormContentProps) {
  const [gradeType, setGradeType] = useState<GradeType>(initialGradeType);
  const [courses, setCourses] = useState<CourseRowValues[]>([
    newCourse(initialGradeType),
  ]);
  const [result, setResult] = useState<GpaResult | null>(null);
  const [courseErrors, setCourseErrors] = useState<Record<number, string>>({});
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"previousGpa" | "previousCreditHours", string>>
  >({});
  const maxGpa = getScaleMaxGpa(scale);

  const form = useForm({
    defaultValues: {
      gradeType: initialGradeType,
      previousGpa: "" as string | number,
      previousCreditHours: "" as string | number,
      courses: [newCourse(initialGradeType)],
    },
    onSubmit: ({ value }) => {
      const errors: Record<number, string> = {};
      const nextFieldErrors: Partial<
        Record<"previousGpa" | "previousCreditHours", string>
      > = {};
      let valid = true;

      courses.forEach((course, i) => {
        if (!course.grade) {
          errors[i] = "الدرجة مطلوبة";
          valid = false;
        }
      });

      const rawPreviousGpa =
        value.previousGpa === "" ? undefined : Number(value.previousGpa);
      const rawPreviousCredits =
        value.previousCreditHours === ""
          ? undefined
          : Number(value.previousCreditHours);

      if ((rawPreviousGpa === undefined) !== (rawPreviousCredits === undefined)) {
        nextFieldErrors.previousGpa = "أدخل المعدل والساعات السابقة معاً";
        nextFieldErrors.previousCreditHours = "أدخل المعدل والساعات السابقة معاً";
        valid = false;
      }

      if (
        rawPreviousGpa !== undefined &&
        (Number.isNaN(rawPreviousGpa) ||
          rawPreviousGpa < 0 ||
          rawPreviousGpa > maxGpa)
      ) {
        nextFieldErrors.previousGpa =
          `المعدل السابق يجب أن يكون بين 0.00 و ${maxGpa.toFixed(2)}`;
        valid = false;
      }

      if (
        rawPreviousCredits !== undefined &&
        (Number.isNaN(rawPreviousCredits) || rawPreviousCredits < 0)
      ) {
        nextFieldErrors.previousCreditHours =
          "الساعات السابقة يجب أن تكون 0 أو أكثر";
        valid = false;
      }

      if (!valid) {
        setCourseErrors(errors);
        setFieldErrors(nextFieldErrors);
        setResult(null);
        return;
      }

      setCourseErrors({});
      setFieldErrors({});
      const prevGpa = rawPreviousGpa;
      const prevCredits = rawPreviousCredits;

      const computed = calculateCumulativeGpa(
        courses,
        scale,
        prevGpa,
        prevCredits,
      );
      setResult(computed);
      onCalculated?.(computed);
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
    setFieldErrors({});
    saveGradeTypePreference(nextGradeType);
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

        {/* Previous GPA */}
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
          <h3 className="mb-3 text-sm font-semibold text-surface-700 dark:text-surface-200">
            المعدل السابق (اختياري)
          </h3>
          <p className="mb-3 text-xs text-surface-500 dark:text-surface-400">
            عند إدخال المعدل السابق يجب إدخال الساعات السابقة معه.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="previousGpa">
              {(field: NumericField) => {
                const error = fieldErrors.previousGpa;
                return (
                  <div>
                    <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                      المعدل التراكمي السابق
                    </label>
                    <input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        setResult(null);
                        if (fieldErrors.previousGpa) {
                          setFieldErrors((prev) => ({ ...prev, previousGpa: undefined }));
                        }
                      }}
                      onBlur={field.handleBlur}
                      placeholder="0.00"
                      min={0}
                      max={maxGpa}
                      step={0.01}
                      className={`${inputCls}${error ? " border-red-400 dark:border-red-600" : ""}`}
                    />
                    {error && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
                    )}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="previousCreditHours">
              {(field: NumericField) => {
                const error = fieldErrors.previousCreditHours;
                return (
                  <div>
                    <label className="mb-1 block text-xs text-surface-500 dark:text-surface-400">
                      الساعات المعتمدة السابقة
                    </label>
                    <input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        setResult(null);
                        if (fieldErrors.previousCreditHours) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            previousCreditHours: undefined,
                          }));
                        }
                      }}
                      onBlur={field.handleBlur}
                      placeholder="0"
                      min={0}
                      step={0.25}
                      className={`${inputCls}${error ? " border-red-400 dark:border-red-600" : ""}`}
                    />
                    {error && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
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

          <div className="space-y-2">
            {courses.map((course, i) => (
              <CourseRow
                key={i}
                course={course}
                index={i}
                gradeScale={scale}
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

        <button
          type="submit"
          className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
        >
          احسب المعدل التراكمي
        </button>
      </form>

      {result && (
        <GpaResultCard
          result={result}
          scale={scale}
          title="المعدل التراكمي"
        />
      )}
    </div>
  );
}

export function CumulativeGpaForm(props: CumulativeGpaFormProps) {
  const initialGradeType = useGradeTypePreference();

  return (
    <CumulativeGpaFormContent
      key={initialGradeType}
      initialGradeType={initialGradeType}
      {...props}
    />
  );
}
