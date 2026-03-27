import type { Metadata } from "next";
import { LocalDataSettings } from "@/components/settings/local-data-settings";

export const metadata: Metadata = {
  title: "الإعدادات",
  description:
    "صدّر واستورد بياناتك المحلية المحفوظة على هذا الجهاز، بما في ذلك السمة، سجل المعدل، والخطة الدراسية.",
};

export default function SettingsPage() {
  return <LocalDataSettings />;
}
