"use client";

import { useId, useState, type FormEvent } from "react";
import { FormModal } from "@/components/form-modal";
import type { AcademicCalendarCategory } from "./academic-calendar-storage";

export type AcademicCalendarFormValues = {
  title: string;
  category: AcademicCalendarCategory;
  date: string;
  hasTime: boolean;
  startTime: string;
  endTime: string;
};

type AcademicCalendarFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: AcademicCalendarFormValues;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (values: AcademicCalendarFormValues) => void;
};

const CATEGORY_OPTIONS: { value: AcademicCalendarCategory; label: string }[] = [
  { value: "exam", label: "امتحـان" },
  { value: "registration", label: "تسجـيل" },
  { value: "add_drop", label: "سحب وإضـافة" },
  { value: "project", label: "مشـروع" },
];

const FIELD_CLASS_NAME =
  "w-full rounded-2xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-50 dark:focus:border-primary-400 dark:focus:ring-primary-900/40";

function normalizeTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

export function AcademicCalendarForm({
  open,
  mode,
  initialValues,
  onClose,
  onDelete,
  onSubmit,
}: AcademicCalendarFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errorMessage, setErrorMessage] = useState("");
  const titleId = useId();
  const categoryId = useId();
  const dateId = useId();
  const hasTimeId = useId();
  const startTimeId = useId();
  const endTimeId = useId();

  const updateValues = (nextValues: Partial<AcademicCalendarFormValues>) => {
    setValues((current) => ({ ...current, ...nextValues }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = normalizeTitle(values.title);

    if (normalizedTitle.length < 2) {
      setErrorMessage("أدخل عنواناً واضحاً للموعد.");
      return;
    }

    if (!values.date) {
      setErrorMessage("اختر تاريخ الموعد أولاً.");
      return;
    }

    if (values.hasTime && !values.startTime) {
      setErrorMessage("حدد وقت البداية أو احفظ الموعد كتاريخ فقط.");
      return;
    }

    if (
      values.hasTime &&
      values.startTime &&
      values.endTime &&
      values.endTime <= values.startTime
    ) {
      setErrorMessage("وقت النهاية يجب أن يكون بعد وقت البداية.");
      return;
    }

    onSubmit({
      ...values,
      title: normalizedTitle,
    });
  };

  return (
    <FormModal
      open={open}
      title={mode === "create" ? "إضافة موعـد أكاديمي" : "تعديل الموعـد"}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-[1.4fr_0.8fr]">
          <div>
            <label
              htmlFor={titleId}
              className="mb-2 block text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase dark:text-surface-400"
            >
              العنـوان
            </label>
            <input
              id={titleId}
              value={values.title}
              onChange={(event) => updateValues({ title: event.target.value })}
              placeholder="مثال: امتحـان ميد 2 - تفاضل"
              className={FIELD_CLASS_NAME}
              maxLength={80}
            />
          </div>

          <div>
            <label
              htmlFor={categoryId}
              className="mb-2 block text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase dark:text-surface-400"
            >
              الفئـة
            </label>
            <select
              id={categoryId}
              value={values.category}
              onChange={(event) =>
                updateValues({
                  category: event.target.value as AcademicCalendarCategory,
                })
              }
              className={FIELD_CLASS_NAME}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label
              htmlFor={dateId}
              className="mb-2 block text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase dark:text-surface-400"
            >
              التـاريخ
            </label>
            <input
              id={dateId}
              type="date"
              value={values.date}
              onChange={(event) => updateValues({ date: event.target.value })}
              className={FIELD_CLASS_NAME}
            />
          </div>

          <label
            htmlFor={hasTimeId}
            className="inline-flex items-center gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 dark:border-surface-700 dark:bg-surface-800/60 dark:text-surface-200"
          >
            <input
              id={hasTimeId}
              type="checkbox"
              checked={values.hasTime}
              onChange={(event) =>
                updateValues({
                  hasTime: event.target.checked,
                  startTime: event.target.checked ? values.startTime : "",
                  endTime: event.target.checked ? values.endTime : "",
                })
              }
              className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-600"
            />
            موعد بوقت محـدد
          </label>
        </div>

        {values.hasTime ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor={startTimeId}
                className="mb-2 block text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase dark:text-surface-400"
              >
                وقت البدايـة
              </label>
              <input
                id={startTimeId}
                type="time"
                value={values.startTime}
                onChange={(event) =>
                  updateValues({ startTime: event.target.value })
                }
                className={FIELD_CLASS_NAME}
              />
            </div>

            <div>
              <label
                htmlFor={endTimeId}
                className="mb-2 block text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase dark:text-surface-400"
              >
                وقت النهايـة
              </label>
              <input
                id={endTimeId}
                type="time"
                value={values.endTime}
                onChange={(event) =>
                  updateValues({ endTime: event.target.value })
                }
                className={FIELD_CLASS_NAME}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50 px-4 py-3 text-sm leading-7 text-surface-500 dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-400">
            سيتم حفظ الموعـد كحدث طوال اليوم ليظهر كموعد نهائي أو تذكير عام.
          </div>
        )}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-surface-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-surface-800">
          <div>
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                حذف الموعـد
              </button>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-600 transition hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              إلغـاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
            >
              {mode === "create" ? "حفظ الموعـد" : "تحديث الموعـد"}
            </button>
          </div>
        </div>
      </form>
    </FormModal>
  );
}
