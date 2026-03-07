"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = any;

const inputCls =
  "w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100";
const inputErrorCls = " border-red-400 dark:border-red-600";
const errorMsgCls = "mt-1 text-xs text-red-500 dark:text-red-400";

interface FormInputProps {
  form: AnyForm;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  dir?: string;
  disabled?: boolean;
  min?: string;
  onChangeCallback?: (value: string) => void;
}

export function FormInput({
  form,
  name,
  label,
  type = "text",
  placeholder,
  dir,
  disabled,
  min,
  onChangeCallback,
}: FormInputProps) {
  return (
    <form.Field name={name}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(field: any) => {
        const hasError =
          field.state.meta.isTouched && field.state.meta.errors.length > 0;
        return (
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              {label}
            </label>
            <input
              type={type}
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value);
                onChangeCallback?.(e.target.value);
              }}
              onBlur={field.handleBlur}
              placeholder={placeholder}
              dir={dir}
              disabled={disabled}
              min={min}
              className={`${inputCls}${hasError ? inputErrorCls : ""}`}
            />
            {hasError && (
              <p className={errorMsgCls}>
                {field.state.meta.errors
                  .map((e: unknown) =>
                    typeof e === "string"
                      ? e
                      : (e as { message?: string })?.message ?? String(e),
                  )
                  .join(", ")}
              </p>
            )}
          </div>
        );
      }}
    </form.Field>
  );
}

interface FormSelectProps {
  form: AnyForm;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function FormSelect({
  form,
  name,
  label,
  options,
  placeholder,
  disabled,
}: FormSelectProps) {
  return (
    <form.Field name={name}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(field: any) => {
        const hasError =
          field.state.meta.isTouched && field.state.meta.errors.length > 0;
        return (
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              {label}
            </label>
            <select
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={disabled}
              className={`${inputCls}${hasError ? inputErrorCls : ""}`}
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {hasError && (
              <p className={errorMsgCls}>
                {field.state.meta.errors
                  .map((e: unknown) =>
                    typeof e === "string"
                      ? e
                      : (e as { message?: string })?.message ?? String(e),
                  )
                  .join(", ")}
              </p>
            )}
          </div>
        );
      }}
    </form.Field>
  );
}
