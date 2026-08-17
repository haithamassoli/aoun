import type { Metadata } from "next";
import { GpaCalculatorTabs } from "@/components/gpa-calculator/gpa-calculator-tabs";
import * as motion from "motion/react-client";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "حاسبة المعدل",
  description:
    "احسب معدلك الفصلي والتراكمي وخطط للفصل القادم باستخدام نماذج 4.0 الشائعة أو نظام JUST الرسمي على 4.2",
  alternates: {
    canonical: "/gpa-calculator",
  },
};

export default function GpaCalculatorPage() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="حاسبـة المعدل"
        subtitle="احسب المعـدل الفصلي والتراكمي وخطط للفصل القادم"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            أداة حسـاب
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            المعـدل الفصلي والتراكمي
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            اختر طريقة الحسـاب المناسبة لجامعتك، ثم راقب النتائج بالنقاط والنسبة
            المئوية مع سجل محفوظ محلياً.
          </p>
        </div>
      </MobilePageHeaderMenu>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GpaCalculatorTabs />
      </motion.div>
    </div>
  );
}
