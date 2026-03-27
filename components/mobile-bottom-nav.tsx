"use client";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

function SearchIcon() {
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
        d="M21 21l-4.35-4.35m1.1-4.65a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
      />
    </svg>
  );
}

function FocusIcon() {
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
        d="M12 6v.01M12 12v.01M12 18v.01M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"
      />
      <circle cx="12" cy="12" r="2.5" strokeWidth={1.9} />
    </svg>
  );
}

function isFocusPath(pathname: string) {
  return pathname === "/focus" || pathname.startsWith("/focus/");
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { sessionToken } = useAuth();
  const isAuthenticated = Boolean(sessionToken);
  const isHomePage = pathname === "/";

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
      href: "/courses",
      label: "البحث",
      isActive: (currentPath) => currentPath.startsWith("/courses"),
      icon: <SearchIcon />,
    },
    {
      href: "/gpa-calculator",
      label: "المعدل",
      isActive: (currentPath) => currentPath.startsWith("/gpa-calculator"),
      icon: <CalculatorIcon />,
    },
    {
      href: "/focus",
      label: "التركيز",
      isActive: (currentPath) => isFocusPath(currentPath),
      icon: <FocusIcon />,
    },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-40 overflow-x-hidden md:hidden"
    >
      {isHomePage ? (
        <div className="fixed bottom-[calc(5.42rem+env(safe-area-inset-bottom))] left-4 z-40 md:hidden">
          <div className="rounded-full border border-surface-200/80 bg-white/92 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-950/92 dark:shadow-[0_12px_30px_rgba(2,6,23,0.42)]">
            <ThemeToggle />
          </div>
        </div>
      ) : null}
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
                className={`relative flex h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[0.7rem] font-semibold transition-all duration-300 ${
                  active
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-surface-500 hover:bg-surface-100/90 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/90 dark:hover:text-surface-100"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                      mass: 0.72,
                    }}
                    className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(59,130,246,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_16px_30px_-24px_rgba(37,99,235,0.6)] dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.26),rgba(59,130,246,0.12))]"
                  />
                ) : null}
                <span
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                    active
                      ? "text-primary-700 dark:text-primary-300"
                      : "bg-transparent"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
