import type { Metadata } from "next";
import Link from "next/link";
import * as motion from "motion/react-client";
import { AcademicCalendar } from "@/components/academic-calendar/academic-calendar";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

export const metadata: Metadata = {
  title: "التقويم",
  description:
    "نظّم الامتحانات والمشاريع ومواعيد التسجيل في تقويم أكاديمي عربي محفوظ محلياً على جهازك.",
};

export default function AcademicPlannerPage() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="التقويم"
        subtitle="نظّم الامتحانات والمشاريع ومواعيد التسجيل"
      >
        <div className="rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:from-surface-900 dark:to-primary-950/40 dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            أداة دراسية
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            التقويم الأكاديمي
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            تابع المواعيد القادمة وأضف اختباراتك ومشاريعك ومهام التسجيل في مكان
            واحد محفوظ محلياً على جهازك.
          </p>
        </div>
      </MobilePageHeaderMenu>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-4 py-8 sm:px-6 lg:px-8"
        dir="rtl"
      >
        <div className="mx-auto max-w-5xl">
          <AcademicCalendar />
        </div>
      </motion.div>
    </div>
  );
}
