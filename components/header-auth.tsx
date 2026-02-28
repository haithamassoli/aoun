"use client";

import { useAuth } from "./auth-provider";

export function HeaderAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    return (
      <a
        href="/dashboard"
        className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900"
      >
        لوحة التحكم
      </a>
    );
  }

  return (
    <a
      href="/login"
      className="text-sm font-medium text-surface-500 transition-colors hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400"
    >
      تسجيل الدخول
    </a>
  );
}
