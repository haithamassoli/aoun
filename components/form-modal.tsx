"use client";

import { useEffect } from "react";

type FormModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function FormModal({ open, title, onClose, children }: FormModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-surface-950/45 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-modal-title"
          className="w-full max-w-2xl rounded-[28px] border border-surface-200 bg-white shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:bg-surface-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4 dark:border-surface-800">
            <h2
              id="form-modal-title"
              className="text-base font-semibold text-surface-900 dark:text-surface-50"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
              aria-label="إغلاق"
            >
              <svg
                className="h-5 w-5"
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
          </div>
          {/* Body */}
          <div className="px-6 pb-6 pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
