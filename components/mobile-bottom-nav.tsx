"use client";

import { useAuth } from "@/components/auth-provider";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  {
    ssr: false,
    loading: () => <div className="h-9 w-9" aria-hidden="true" />,
  },
);

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
  icon: React.ReactNode;
};

function HomeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.75 12 3l9 7.75v8.25a2 2 0 0 1-2 2h-4.5v-5.5h-5V21H5a2 2 0 0 1-2-2z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3v3m8-3v3M4.75 9.25h14.5M5.5 5.5h13a1.75 1.75 0 0 1 1.75 1.75v11A1.75 1.75 0 0 1 18.5 20h-13a1.75 1.75 0 0 1-1.75-1.75v-11A1.75 1.75 0 0 1 5.5 5.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"
      />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3.75h10A2.25 2.25 0 0 1 19.25 6v12A2.25 2.25 0 0 1 17 20.25H7A2.25 2.25 0 0 1 4.75 18V6A2.25 2.25 0 0 1 7 3.75Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7.75h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 12h.01" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 15.75h.01M12 15.75h.01M15.5 15.75h.01"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.75 5.75A1.75 1.75 0 0 1 6.5 4h4A1.75 1.75 0 0 1 12.25 5.75v4A1.75 1.75 0 0 1 10.5 11.5h-4a1.75 1.75 0 0 1-1.75-1.75Zm7 0A1.75 1.75 0 0 1 13.5 4h4A1.75 1.75 0 0 1 19.25 5.75v4A1.75 1.75 0 0 1 17.5 11.5h-4a1.75 1.75 0 0 1-1.75-1.75Zm-7 8.5A1.75 1.75 0 0 1 6.5 12.5h4a1.75 1.75 0 0 1 1.75 1.75v4A1.75 1.75 0 0 1 10.5 20h-4a1.75 1.75 0 0 1-1.75-1.75Zm7 0a1.75 1.75 0 0 1 1.75-1.75h4a1.75 1.75 0 0 1 1.75 1.75v4A1.75 1.75 0 0 1 17.5 20h-4a1.75 1.75 0 0 1-1.75-1.75Z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { sessionToken } = useAuth();
  const isAuthenticated = Boolean(sessionToken);

  const items: NavItem[] = [
    {
      href: "/",
      label: "الرئيسية",
      isActive: (currentPath) => currentPath === "/",
      icon: <HomeIcon />,
    },
    {
      href: "/academic-planner",
      label: "التقويم",
      isActive: (currentPath) => currentPath.startsWith("/academic-planner"),
      icon: <CalendarIcon />,
    },
    {
      href: "/gpa-calculator",
      label: "المعدل",
      isActive: (currentPath) => currentPath.startsWith("/gpa-calculator"),
      icon: <CalculatorIcon />,
    },
    {
      href: "/settings",
      label: "الإعدادات",
      isActive: (currentPath) => currentPath.startsWith("/settings"),
      icon: <SettingsIcon />,
    },
    {
      href: isAuthenticated ? "/dashboard" : "/login",
      label: isAuthenticated ? "لوحتي" : "الدخول",
      isActive: (currentPath) =>
        isAuthenticated
          ? isDashboardPath(currentPath)
          : currentPath === "/login",
      icon: <DashboardIcon />,
    },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="fixed bottom-[calc(5.42rem+env(safe-area-inset-bottom))] left-4 z-40 md:hidden">
        <div className="rounded-full border border-surface-200/80 bg-white/92 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-950/92 dark:shadow-[0_12px_30px_rgba(2,6,23,0.42)]">
          <ThemeToggle />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent_0%,rgba(248,250,252,0.86)_38%,rgba(248,250,252,0.98)_100%)] dark:bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.86)_38%,rgba(2,6,23,0.98)_100%)]" />
      <div className="relative px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-2 rounded-[1.75rem] border border-surface-200/80 bg-white/92 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-950/92 dark:shadow-[0_18px_45px_rgba(2,6,23,0.45)]">
          {items.map((item) => {
            const active = item.isActive(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[0.7rem] font-semibold transition-all ${
                  active
                    ? "bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(59,130,246,0.08))] text-primary-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.26),rgba(59,130,246,0.1))] dark:text-primary-300"
                    : "text-surface-500 hover:bg-surface-100/90 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/90 dark:hover:text-surface-100"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                    active
                      ? "text-primary-700 dark:text-primary-300"
                      : "bg-transparent"
                  }`}
                >
                  {item.icon}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
