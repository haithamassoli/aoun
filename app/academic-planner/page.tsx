import type { Metadata } from "next";
import * as motion from "motion/react-client";
import { AcademicCalendar } from "@/components/academic-calendar/academic-calendar";

export const metadata: Metadata = {
  title: "المخطط الأكاديمي",
  description:
    "نظّم الامتحانات والمشاريع ومواعيد التسجيل في تقويم أكاديمي عربي محفوظ محلياً على جهازك.",
};

export default function AcademicPlannerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[linear-gradient(180deg,var(--color-primary-50),rgba(248,250,252,0.8)_18%,var(--color-surface-50)_42%)] px-4 py-10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.94)_22%,rgba(2,6,23,1)_58%)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.24em] text-primary-600 uppercase dark:text-primary-300">
            Academic Planner
          </p>
          <h1 className="mt-3 text-3xl font-bold text-surface-950 dark:text-surface-50 sm:text-4xl">
            تقويم شخصي للمواعيد الأكاديمية المهمة
          </h1>
          <p className="mt-4 text-sm leading-8 text-surface-600 dark:text-surface-300 sm:text-base">
            أضف مواعيد الامتحانات، فترات التسجيل، السحب والإضافة، وتسليم
            المشاريع في تقويم واحد واضح. البيانات تبقى على جهازك فقط، بدون حساب
            أو مزامنة إلزامية.
          </p>
        </div>

        <AcademicCalendar />
      </div>
    </motion.div>
  );
}
