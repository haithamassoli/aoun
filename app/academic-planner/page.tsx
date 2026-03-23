import type { Metadata } from "next";
import * as motion from "motion/react-client";
import { AcademicCalendar } from "@/components/academic-calendar/academic-calendar";

export const metadata: Metadata = {
  title: "التقويم",
  description:
    "نظّم الامتحانات والمشاريع ومواعيد التسجيل في تقويم أكاديمي عربي محفوظ محلياً على جهازك.",
};

export default function AcademicPlannerPage() {
  return (
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
  );
}
