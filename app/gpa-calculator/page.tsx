import type { Metadata } from "next";
import { GpaCalculatorTabs } from "@/components/gpa-calculator/gpa-calculator-tabs";

export const metadata: Metadata = {
  title: "حاسبة المعدل",
  description:
    "احسب معدلك الفصلي والتراكمي وخطط للفصل القادم — يدعم جميع الجامعات الأردنية",
};

export default function GpaCalculatorPage() {
  return <GpaCalculatorTabs />;
}
