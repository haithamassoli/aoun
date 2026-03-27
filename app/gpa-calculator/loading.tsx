import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function GpaCalculatorLoading() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="حاسبة المعدل"
        subtitle="احسب المعدل الفصلي والتراكمي وخطط للفصل القادم"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="mt-2 h-6 w-40" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
          </div>
        </div>
      </MobilePageHeaderMenu>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
            <Skeleton className="h-10 w-28 rounded-t-lg rounded-b-none" />
            <Skeleton className="h-10 w-28 rounded-t-lg rounded-b-none" />
            <Skeleton className="h-10 w-28 rounded-t-lg rounded-b-none" />
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900">
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-surface-200 p-4 dark:border-surface-700">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                  </div>
                </div>
              ))}

              <Skeleton className="mt-6 h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
