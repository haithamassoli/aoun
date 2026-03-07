import type { Metadata } from "next";
import { GpaCalculatorTabs } from "@/components/gpa-calculator/gpa-calculator-tabs";

export const metadata: Metadata = {
  title: "حاسبة المعدل",
  description:
    "احسب معدلك الفصلي والتراكمي وخطط للفصل القادم باستخدام نماذج 4.0 الشائعة أو نظام JUST الرسمي على 4.2",
};

export default function GpaCalculatorPage() {
  return <GpaCalculatorTabs />;
}
