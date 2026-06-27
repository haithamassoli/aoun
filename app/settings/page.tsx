import type { Metadata } from "next";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { LocalDataSettings } from "@/components/settings/local-data-settings";

export const instant = {
  unstable_samples: [{ cookies: [{ name: "aoun_session", value: null }] }],
};

export const metadata: Metadata = {
  title: "الإعدادات",
  description:
    "صدّر واستورد بياناتك المحلية المحفوظة على هذا الجهاز، بما في ذلك السمة، سجل المعدل، والخطة الدراسية.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="الإعـدادات"
        subtitle="صدّر واستورد بياناتك المحلـية المحفوظة على هذا الجهاز"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            تفضـيلات وبيانات
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            إدارة النسخ المحلـية
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            صدّر نسخة احتياطـية من بياناتك أو استعد نسخة سابقة مع الحفاظ على
            الوصول السريع للأدوات الأساسية.
          </p>
        </div>
      </MobilePageHeaderMenu>

      <LocalDataSettings />
    </div>
  );
}
