"use client";

type PublicSearchInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (nextValue: string) => void;
};

export function PublicSearchInput({
  label,
  placeholder,
  value,
  onChange,
}: PublicSearchInputProps) {
  return (
    <div className="public-search-shell public-elevated-surface rounded-[1.6rem] p-4 backdrop-blur-sm">
      <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-surface-200">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-surface-400">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m1.1-4.65a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            />
          </svg>
        </span>

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-surface-300 bg-surface-50/92 pe-11 ps-11 text-sm text-surface-800 outline-none transition-all duration-300 placeholder:text-surface-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-surface-600 dark:bg-surface-800/92 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:bg-surface-900 dark:focus:ring-primary-900"
        />

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-y-0 end-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-200"
            aria-label="مسح البحث"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
