"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/hooks/use-scroll-lock";

type FormModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

const FORM_MODAL_SCROLL_LOCK = {
  body: {
    overflow: "hidden",
    width: "100%",
  },
  documentElement: {
    overflow: "hidden",
  },
} as const;

export function FormModal({ open, title, onClose, children }: FormModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef(0);

  useScrollLock(open, FORM_MODAL_SCROLL_LOCK);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    scrollPositionRef.current = window.scrollY;

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      overlayRef.current?.scrollTo({ top: 0, behavior: "auto" });
      dialogRef.current?.scrollIntoView({ block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" });
    };
  }, [open]);

  if (!open) return null;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-surface-950/45 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-8">
        <div
          ref={dialogRef}
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
    </div>,
    document.body,
  );
}
