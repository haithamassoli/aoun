import type { Metadata } from "next";
import { FocusSoundStudio } from "@/components/focus-sound-studio";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

export const instant = {
  unstable_samples: [{ cookies: [{ name: "aoun_session", value: null }] }],
};

export const metadata: Metadata = {
  title: "مؤقت الدراسة وأصوات التركيز",
  description:
    "استخدم مؤقت بومودورو مع أصوات المطر والطبيعة والضوضاء البيضاء في مساحة تركيز عربية تحفظ جلستك محلياً أثناء التنقل.",
  openGraph: {
    title: "مؤقت الدراسة وأصوات التركيز — عون",
    description:
      "ابدأ جلسة بومودورو، امزج أكثر من عشرين صوتاً، واحتفظ بتركيزك أثناء التنقل بين الصفحات العامة.",
    url: "/focus",
    type: "website",
  },
  alternates: {
    canonical: "/focus",
  },
};

export default function FocusPage() {
  return (
    <>
      <MobilePageHeaderMenu
        title="مؤقـت الدراسة وأصوات التركيز"
        subtitle="عدّاد بومـودورو وصوتيات هادئة في جلسة واحدة"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            أداة دراسـة
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            ركّز بالمؤقـت والصوت من نفس الصفحة
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            ابدأ جلسة بومـودورو، راقب إجمالي اليوم والأسبوع، ثم امزج ما يناسبك
            من المطر والطبيعة والضوضاء الهادئة مع بقاء المؤقت والأصوات متاحين
            أثناء التنقل.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
              مؤقـت بومودورو
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
              مزج متعـدد
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
              أكثر من 20 صوتـاً
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
              حفـظ محلي عبر الصفحات
            </span>
          </div>
        </div>
      </MobilePageHeaderMenu>

      <FocusSoundStudio />
    </>
  );
}
