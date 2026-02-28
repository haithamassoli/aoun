"use client";

import { useState, useCallback } from "react";

type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

export function useToast() {
  const [state, setState] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });

  const show = useCallback((message: string, type: ToastType = "success") => {
    setState({ message, type, visible: true });
    setTimeout(() => setState((s) => ({ ...s, visible: false })), 3000);
  }, []);

  return { ...state, show };
}

export function Toast({ toast }: { toast: ReturnType<typeof useToast> }) {
  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        {toast.type === "success" ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {toast.message}
      </div>
    </div>
  );
}
