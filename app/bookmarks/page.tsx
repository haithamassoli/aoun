import type { Metadata } from "next";
import { BookmarksPage } from "@/components/bookmarks/bookmarks-page";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

export const metadata: Metadata = {
  title: "المحفوظات والمجموعات",
  description:
    "احفظ المواد والمصادر المهمة محلياً ونظمها في مجموعات على هذا الجهاز.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="المحفوظـات"
        subtitle="مواد ومصادر محفوظـة محلياً على هذا الجهاز"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            حفـظ وتنظيم
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            المحفوظـات والمجموعات
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            احفظ ما تحتاجه من مواد ومصادر، ثم رتبها في مجموعـات للمذاكرة أو
            المتابعة السريعة.
          </p>
        </div>
      </MobilePageHeaderMenu>
      <BookmarksPage />
    </div>
  );
}
