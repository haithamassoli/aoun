"use client";

import { useState } from "react";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import type { Id } from "@/convex/_generated/dataModel";

type NotificationToggleProps = {
  majorId: Id<"majors">;
};

export function NotificationToggle({ majorId }: NotificationToggleProps) {
  const { isSupported, isLoading, subscribe, unsubscribe, isSubscribedToMajor } =
    usePushSubscription();
  const [error, setError] = useState<string | null>(null);

  if (!isSupported) return null;

  const isSubscribed = isSubscribedToMajor(majorId);
  const isDenied =
    typeof window !== "undefined" && Notification.permission === "denied";

  async function handleToggle() {
    setError(null);
    try {
      if (isSubscribed) {
        await unsubscribe(majorId);
      } else {
        const success = await subscribe(majorId);
        if (!success) {
          setError("يرجى السماح بالإشعارات من إعدادات المتصفح");
        }
      }
    } catch {
      setError("حدث خطأ أثناء تحديث الإشعارات");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading || isDenied}
        title={
          isDenied
            ? "الإشعارات محظورة — فعّلها من إعدادات المتصفح"
            : isSubscribed
              ? "إيقاف الإشعارات"
              : "تفعيل الإشعارات"
        }
        className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
          isDenied
            ? "cursor-not-allowed border-surface-200 bg-surface-100 text-surface-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-500"
            : isSubscribed
              ? "border-primary-300 bg-primary-50 text-primary-700 shadow-sm hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:bg-primary-950"
              : "border-surface-300 bg-white text-surface-700 shadow-sm hover:border-primary-300 hover:text-primary-700 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:text-primary-300"
        }`}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4"
            fill={isSubscribed ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={isSubscribed ? 0 : 1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        )}
        <span className="hidden sm:inline">
          {isDenied
            ? "الإشعارات محظورة"
            : isSubscribed
              ? "الإشعارات مفعّلة"
              : "تفعيل الإشعارات"}
        </span>
      </button>
      {error && (
        <p className="absolute top-full mt-1 whitespace-nowrap text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
