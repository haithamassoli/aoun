import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcademicPlannerLoading() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="التقويم"
        subtitle="نظّم الامتحانات والمشاريع ومواعيد التسجيل"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="mt-2 h-6 w-32" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
          </div>
        </div>
      </MobilePageHeaderMenu>

      <div className="px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
