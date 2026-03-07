import type { Metadata } from "next";
import { GpaCalculatorTabs } from "@/components/gpa-calculator/gpa-calculator-tabs";
import * as motion from "motion/react-client";

export const metadata: Metadata = {
  title: "حاسبة المعدل",
  description:
    "احسب معدلك الفصلي والتراكمي وخطط للفصل القادم باستخدام نماذج 4.0 الشائعة أو نظام JUST الرسمي على 4.2",
};

export default function GpaCalculatorPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GpaCalculatorTabs />
    </motion.div>
  );
}
