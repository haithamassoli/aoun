"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  DEFAULT_GRADE_SCALE,
  calculateRequiredGpa,
  getGpaColors,
  getScaleMaxGpa,
} from "@/lib/gpa-utils";
import { createGpaPlannerSchema } from "@/lib/gpa-schemas";

const inputCls =
  "w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100";

type PlannerResult = {
  requiredGpa: number;
  isAchievable: boolean;
  message: string;
};

type FieldErrors = Partial<
  Record<
    "currentGpa" | "currentCreditHours" | "targetGpa" | "plannedCreditHours",
    string
  >
>;

interface GpaPlannerFormProps {
  onCalculated?: (result: PlannerResult) => void;
}

export type { PlannerResult };

export function GpaPlannerForm({ onCalculated }: GpaPlannerFormProps) {
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const maxGpa = getScaleMaxGpa(DEFAULT_GRADE_SCALE);

  const form = useForm({
    defaultValues: {
      currentGpa: "",
      currentCreditHours: "",
      targetGpa: "",
      plannedCreditHours: "",
    },
    onSubmit: ({ value }) => {
      const parsed = createGpaPlannerSchema(maxGpa).safeParse(value);
      if (!parsed.success) {
        const errors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof FieldErrors;
          if (key && !errors[key]) errors[key] = issue.message;
        }
        setFieldErrors(errors);
        return;
      }

      setFieldErrors({});
      const { currentGpa, currentCreditHours, targetGpa, plannedCreditHours } =
        parsed.data;

      const required = calculateRequiredGpa(
        currentGpa,
        currentCreditHours,
        targetGpa,
        plannedCreditHours,
      );

      const isAchievable = required <= maxGpa && required >= 0;

      let message: string;
      if (required > maxGpa) {
        message = `تحتاج معدل ${required.toFixed(2)} في الفصل القادم لتحقيق هدفك، وهذا أعلى من الحد الأقصى (${maxGpa.toFixed(2)}). قد تحتاج لتعديل هدفك أو زيادة الساعات المخططة.`;
      } else if (required < 0) {
        message =
          "معدلك الحالي يتجاوز هدفك بالفعل! يمكنك تخفيف الحمل الدراسي.";
      } else if (required <= 2.0) {
        message = `تحتاج معدل ${required.toFixed(2)} فقط في الفصل القادم — هدفك قابل للتحقيق بسهولة!`;
      } else if (required <= 3.0) {
        message = `تحتاج معدل ${required.toFixed(2)} في الفصل القادم — هدف معقول وقابل للتحقيق.`;
      } else {
        message = `تحتاج معدل ${required.toFixed(2)} في الفصل القادم — هدف طموح يحتاج جهداً إضافياً.`;
      }

      const nextResult = { requiredGpa: required, isAchievable, message };
      setResult(nextResult);
      onCalculated?.(nextResult);
    },
  });

  const renderField = (
    name: "currentGpa" | "currentCreditHours" | "targetGpa" | "plannedCreditHours",
    label: string,
    placeholder: string,
    max?: number,
    step?: number,
  ) => (
    <form.Field name={name}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(field: any) => {
        const error = fieldErrors[name];
        return (
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-200">
              {label}
            </label>
            <input
              type="number"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value);
                setResult(null);
                if (fieldErrors[name]) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                  });
                }
              }}
              onBlur={field.handleBlur}
              placeholder={placeholder}
              min={0}
              max={max}
              step={step ?? 0.01}
              className={`${inputCls}${error ? " border-red-400 dark:border-red-600" : ""}`}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        );
      }}
    </form.Field>
  );

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300">
        <p className="font-medium">كيف يعمل مخطط المعدل؟</p>
        <p className="mt-1 text-xs opacity-80">
          أدخل معدلك الحالي وعدد الساعات المعتمدة، ثم حدد هدفك والساعات المخططة
          للفصل القادم — وسنخبرك بالمعدل المطلوب لتحقيق هدفك.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-xs text-surface-500 dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-400">
          المخطط يعتمد سلّم 4.20 كحد أعلى للمعدل مع دعم A+ افتراضياً.
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {renderField(
            "currentGpa",
            "المعدل التراكمي الحالي",
            "مثال: 2.80",
            maxGpa,
            0.01,
          )}
          {renderField(
            "currentCreditHours",
            "الساعات المعتمدة الحالية",
            "مثال: 60",
            undefined,
            0.25,
          )}
          {renderField(
            "targetGpa",
            "المعدل المستهدف",
            "مثال: 3.20",
            maxGpa,
            0.01,
          )}
          {renderField(
            "plannedCreditHours",
            "ساعات الفصل القادم",
            "مثال: 18",
            undefined,
            0.25,
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
        >
          احسب المعدل المطلوب
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-2xl border-2 p-6 text-center ${
              result.isAchievable
                ? `${getGpaColors(result.requiredGpa).bg} ${getGpaColors(result.requiredGpa).border}`
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            }`}
          >
            <p className="mb-2 text-sm text-surface-500 dark:text-surface-400">
              المعدل المطلوب في الفصل القادم
            </p>
            {result.isAchievable ? (
              <>
                <span
                  className={`text-6xl font-bold tabular-nums ${getGpaColors(result.requiredGpa).text}`}
                >
                  {result.requiredGpa.toFixed(2)}
                </span>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  من أصل {maxGpa.toFixed(2)}
                </p>
              </>
            ) : (
              <span className="text-5xl font-bold text-red-600 dark:text-red-400">
                {result.requiredGpa > maxGpa
                  ? `>${result.requiredGpa.toFixed(2)}`
                  : result.requiredGpa.toFixed(2)}
              </span>
            )}
          </div>

          <div
            className={`rounded-xl border p-4 text-sm ${
              result.isAchievable
                ? "border-surface-200 bg-surface-50 text-surface-700 dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
            }`}
          >
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}
