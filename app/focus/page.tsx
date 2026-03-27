import type { Metadata } from "next";
import { FocusSoundStudio } from "@/components/focus-sound-studio";
import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";

export const metadata: Metadata = {
  title: "أصوات التركيز",
  description:
    "اختر من المطر والطبيعة والضوضاء البيضاء وأجواء السفر في أداة تركيز عربية تحفظ مستوياتك محلياً وتبقى معك أثناء التنقل.",
  openGraph: {
    title: "أصوات التركيز — عون",
    description:
      "ابنِ خليطك من أكثر من عشرين صوتاً واحتفظ بجلسة التركيز أثناء التنقل بين الصفحات العامة.",
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
        title="أصوات التركيز"
        subtitle="من المطر إلى الضوضاء البيضاء في جلسة واحدة"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
            أداة دراسة
          </p>
          <h2 className="mt-2 text-xl font-bold text-surface-900 dark:text-surface-50">
            خلفية صوتية مرنة بدون تعقيد
          </h2>
          <p className="mt-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
            اختر ما يناسب طريقتك في الدراسة من أصوات المطر والطبيعة والضوضاء
            الهادئة، واضبط كل مسار على حدة ثم أكمل تصفح المواد مع بقاء الجلسة
            جاهزة في المشغل العائم.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
              مزج متعدد
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
              أكثر من 20 صوتاً
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
              حفظ محلي
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
              يعمل بين الصفحات العامة
            </span>
          </div>
        </div>
      </MobilePageHeaderMenu>

      <FocusSoundStudio />
    </>
  );
}
