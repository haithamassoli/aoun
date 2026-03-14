"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, sessionToken, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("dashboardSidebarCollapsed") === "1";
  });
  const majors = useQuery(
    api.dashboard.getMyMajors,
    user && sessionToken ? { token: sessionToken } : "skip",
  );

  const pathname = usePathname();
  const isSidebarExpanded = !isSidebarCollapsed;

  const toggleSidebar = () => {
    const nextValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextValue);
    localStorage.setItem("dashboardSidebarCollapsed", nextValue ? "1" : "0");
  };

  const closeSidebarOnSmallScreens = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
      localStorage.setItem("dashboardSidebarCollapsed", "1");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-3 text-surface-500 dark:text-surface-400">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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

  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-row gap-3 overflow-x-auto px-3 py-4 sm:gap-4 sm:px-4 sm:py-5 md:px-6 lg:gap-6 lg:px-8 lg:py-6">
      {/* Sidebar */}
      <aside
        className={`shrink-0 transition-[width] duration-200 ${isSidebarExpanded ? "w-64" : "w-20"}`}
      >
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-4 dark:border-surface-800">
            {isSidebarExpanded && (
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                لوحة التحكم
              </p>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-50"
              aria-label={
                isSidebarCollapsed
                  ? "توسيع الشريط الجانبي"
                  : "طي الشريط الجانبي"
              }
              title={isSidebarCollapsed ? "توسيع" : "طي"}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {isSidebarCollapsed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 5l7 7-7 7M5 5v14"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 19l-7-7 7-7M19 5v14"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* User info */}
          <div
            className={`mb-4 flex border-b border-surface-100 pb-4 dark:border-surface-800 ${
              isSidebarExpanded ? "items-center gap-3" : "justify-center"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {user.name.charAt(0)}
            </div>
            {isSidebarExpanded && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {user.name}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {user.role === "admin" ? "مدير" : "مساهم"}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              onClick={closeSidebarOnSmallScreens}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50"
              } ${isSidebarExpanded ? "gap-2" : "justify-center"}`}
              title="الرئيسية"
              aria-label="الرئيسية"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {isSidebarExpanded && <span>الرئيسية</span>}
            </Link>

            {/* Admin links */}
            {user.role === "admin" && (
              <div className="pt-2">
                {isSidebarExpanded && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    الإدارة
                  </p>
                )}
                {[
                  {
                    href: "/dashboard/admin/universities",
                    label: "الجامعات",
                    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                  },
                  {
                    href: "/dashboard/admin/majors",
                    label: "التخصصات",
                    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                  },
                  {
                    href: "/dashboard/admin/courses",
                    label: "المواد",
                    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                  },
                  {
                    href: "/dashboard/admin/resources",
                    label: "المصادر",
                    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
                  },
                  {
                    href: "/dashboard/admin/users",
                    label: "المستخدمون",
                    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                  },
                  {
                    href: "/dashboard/admin/notifications",
                    label: "الإشعارات",
                    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                  },
                ].map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSidebarOnSmallScreens}
                      className={`flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                          : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50"
                      } ${isSidebarExpanded ? "gap-2" : "justify-center"}`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={item.icon}
                        />
                      </svg>
                      {isSidebarExpanded && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Majors list */}
            {user.role === "contributor" && (
              <div className="pt-2">
                {isSidebarExpanded && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    التخصصات
                  </p>
                )}
                {majors === undefined ? (
                  <div
                    className={`py-2 text-xs text-surface-400 dark:text-surface-500 ${isSidebarExpanded ? "px-3 text-right" : "text-center"}`}
                  >
                    {isSidebarExpanded ? "جاري التحميل..." : "..."}
                  </div>
                ) : majors.length === 0 ? (
                  <div
                    className={`py-2 text-xs text-surface-400 dark:text-surface-500 ${isSidebarExpanded ? "px-3 text-right" : "text-center"}`}
                  >
                    {isSidebarExpanded ? "لا توجد تخصصات" : "-"}
                  </div>
                ) : (
                  majors.map((major: { _id: string; name: string }) => {
                    const isActive = pathname.startsWith(
                      `/dashboard/major/${major._id}`,
                    );
                    return (
                      <Link
                        key={major._id}
                        href={`/dashboard/major/${major._id}`}
                        onClick={closeSidebarOnSmallScreens}
                        className={`flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                            : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50"
                        } ${isSidebarExpanded ? "gap-2" : "justify-center"}`}
                        title={major.name}
                        aria-label={major.name}
                      >
                        <svg
                          className="h-3.5 w-3.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {isSidebarExpanded && (
                          <span className="truncate">{major.name}</span>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </nav>

          {/* Settings */}
          <div className="mt-2">
            <Link
              href="/dashboard/settings"
              onClick={closeSidebarOnSmallScreens}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard/settings"
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50"
              } ${isSidebarExpanded ? "gap-2" : "justify-center"}`}
              title="الإعدادات"
              aria-label="الإعدادات"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isSidebarExpanded && <span>الإعدادات</span>}
            </Link>
          </div>

          {/* Logout */}
          <div className="mt-4 border-t border-surface-100 pt-4 dark:border-surface-800">
            <button
              onClick={() => {
                closeSidebarOnSmallScreens();
                logout();
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 ${
                isSidebarExpanded ? "gap-2" : "justify-center"
              }`}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {isSidebarExpanded && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-[18rem] flex-1 lg:min-w-0">{children}</div>
    </div>
  );
}
