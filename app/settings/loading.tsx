import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <MobilePageHeaderMenu
        title="الإعدادات"
        subtitle="صدّر واستورد بياناتك المحلية المحفوظة على هذا الجهاز"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-2 h-6 w-36" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        </div>
      </MobilePageHeaderMenu>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900">
            <Skeleton className="h-6 w-32" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900">
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
