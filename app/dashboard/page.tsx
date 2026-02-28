"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user, sessionToken } = useAuth();
  const majors = useQuery(
    api.dashboard.getMyMajors,
    user && sessionToken ? { token: sessionToken } : "skip"
  );

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          مرحبا، {user.name}. {user.role === "admin" ? "لديك صلاحيات كاملة." : "اختر تخصصا لإدارة محتواه."}
        </p>
      </div>

      {/* Majors grid */}
      {majors === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
          ))}
        </div>
      ) : majors.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
            <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">لا توجد تخصصات مخصصة لك</p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">تواصل مع المدير لإضافة صلاحيات</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {majors.map((major) => (
            <Link
              key={major._id}
              href={`/dashboard/major/${major._id}`}
              className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-700"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <svg className="h-5 w-5 text-surface-300 transition-colors group-hover:text-primary-400 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">{major.name}</h3>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{major.universityName}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
