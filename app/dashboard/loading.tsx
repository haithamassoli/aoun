import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-w-[18rem] flex-1 space-y-6 lg:min-w-0">
      <div className="space-y-3 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
          >
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-4 h-10 w-28" />
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-[28px] border border-surface-200 dark:border-surface-700" />
        <Skeleton className="h-80 rounded-2xl border border-surface-200 dark:border-surface-700" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-32 rounded-2xl border border-surface-200 dark:border-surface-700"
          />
        ))}
      </div>
    </div>
  );
}
