import type { Metadata } from "next";
import * as motion from "motion/react-client";
import { AcademicCalendar } from "@/components/academic-calendar/academic-calendar";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

export const instant = {
  unstable_samples: [{ cookies: [{ name: "aoun_session", value: null }] }],
};

export const metadata: Metadata = {
  title: "التقويم",
  description:
    "نظّم الامتحانات والمشاريع ومواعيد التسجيل في تقويم أكاديمي عربي محفوظ محلياً على جهازك.",
  alternates: {
    canonical: "/academic-planner",
  },
};

export default function AcademicPlannerPage() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="التقـويم"
        subtitle="نظّم الامتحـانات والمشاريع ومواعيد التسجيل"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            أداة دراسـية
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            التقـويم الأكاديمي
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            تابع المواعـيد القادمة وأضف اختباراتك ومشاريعك ومهام التسجيل في مكان
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
