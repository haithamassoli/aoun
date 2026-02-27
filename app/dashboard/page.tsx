"use client";

import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-3 text-surface-500">
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Dashboard Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
            لوحة التحكم
          </h1>
          <p className="mt-1 text-surface-500">
            مرحباً، {user.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
            {user.role === "admin" ? "مدير" : "مساهم"}
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-surface-300 bg-white px-4 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl">
          🏗️
        </div>
        <p className="text-lg font-medium text-surface-700">
          لوحة التحكم قيد الإنشاء
        </p>
        <p className="mt-1 text-sm text-surface-500">
          ستُضاف أدوات إدارة المحتوى في المرحلة القادمة.
        </p>
      </div>
    </div>
  );
}
