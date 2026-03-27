import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <>
      <MobilePageHeaderMenu
        title="البحث عن المواد"
        subtitle="ابحث في جميع الجامعات الأردنية من صفحة واحدة"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="mt-2 h-6 w-28" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        </div>
      </MobilePageHeaderMenu>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />

          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"
              >
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-4 w-32 rounded-full" />
                <Skeleton className="mt-3 h-4 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
