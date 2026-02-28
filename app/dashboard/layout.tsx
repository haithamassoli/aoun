"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, sessionToken, logout } = useAuth();
  const majors = useQuery(
    api.dashboard.getMyMajors,
    sessionToken ? { token: sessionToken } : "skip"
  );

  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-3 text-surface-500">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
          {/* User info */}
          <div className="mb-4 flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-surface-900">{user.name}</p>
              <p className="text-xs text-surface-500">
                {user.role === "admin" ? "مدير" : "مساهم"}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-primary-50 text-primary-700"
                  : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              الرئيسية
            </Link>

            {/* Majors list */}
            <div className="pt-2">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                التخصصات
              </p>
              {majors === undefined ? (
                <div className="px-3 py-2 text-xs text-surface-400">جاري التحميل...</div>
              ) : majors.length === 0 ? (
                <div className="px-3 py-2 text-xs text-surface-400">لا توجد تخصصات</div>
              ) : (
                majors.map((major) => {
                  const isActive = pathname.startsWith(`/dashboard/major/${major._id}`);
                  return (
                    <Link
                      key={major._id}
                      href={`/dashboard/major/${major._id}`}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="truncate">{major.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </nav>

          {/* Logout */}
          <div className="mt-4 border-t border-surface-100 pt-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
