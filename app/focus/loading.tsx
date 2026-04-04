import { MobilePageHeaderMenu } from "@/components/mobile-page-header-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function FocusLoading() {
  return (
    <>
      <MobilePageHeaderMenu
        title="التركيز"
        subtitle="عدّاد بومودورو وصوتيات هادئة في جلسة واحدة"
      >
        <div className="public-elevated-surface rounded-[28px] p-4">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="mt-2 h-6 w-44" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
      </MobilePageHeaderMenu>

      <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-[2rem] border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
            <div className="space-y-3 border-b border-surface-200 px-5 py-5 dark:border-surface-800 sm:px-6">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
              <div className="rounded-[1.7rem] border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-950">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="mt-3 h-14 w-40 rounded-2xl" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-12 w-28 rounded-2xl" />
                    <Skeleton className="h-12 w-28 rounded-2xl" />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-28 w-full rounded-[1.4rem]" />
                  <Skeleton className="h-28 w-full rounded-[1.4rem]" />
                  <Skeleton className="h-28 w-full rounded-[1.4rem]" />
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-4 w-72 rounded-full" />
                </div>
                <Skeleton className="h-11 w-36 rounded-2xl" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-32 w-full rounded-[1.4rem]" />
                <Skeleton className="h-32 w-full rounded-[1.4rem]" />
                <Skeleton className="h-32 w-full rounded-[1.4rem]" />
                <Skeleton className="h-32 w-full rounded-[1.4rem]" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-900 sm:p-6">
            <div className="space-y-3 border-b border-surface-200 pb-5 dark:border-surface-800">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
            </div>

            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.7rem] border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-950 sm:p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-14 w-14 rounded-[1.35rem]" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-52 rounded-full" />
                          <Skeleton className="h-4 w-44 rounded-full" />
                        </div>
                      </div>
                      <Skeleton className="h-11 w-32 rounded-2xl" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <Skeleton className="h-3 w-20 rounded-full" />
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="h-4 w-10 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
