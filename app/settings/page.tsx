import type { Metadata } from "next";
import Link from "next/link";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { LocalDataSettings } from "@/components/settings/local-data-settings";

export const metadata: Metadata = {
  title: "الإعدادات",
  description:
    "صدّر واستورد بياناتك المحلية المحفوظة على هذا الجهاز، بما في ذلك السمة، سجل المعدل، والخطة الدراسية.",
};

export default function SettingsPage() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="الإعدادات"
        subtitle="صدّر واستورد بياناتك المحلية المحفوظة على هذا الجهاز"
      >
        <div className="rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:from-surface-900 dark:to-primary-950/40 dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            تفضيلات وبيانات
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            إدارة النسخ المحلية
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            صدّر نسخة احتياطية من بياناتك أو استعد نسخة سابقة مع الحفاظ على
            الوصول السريع للأدوات الأساسية.
          </p>
        </div>
      </MobilePageHeaderMenu>

      <LocalDataSettings />
    </div>
  );
}
