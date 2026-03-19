import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div>
      <section className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-900 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Skeleton className="mx-auto h-16 w-48 rounded-2xl bg-white/18 dark:bg-white/12" />
          <Skeleton className="mx-auto mt-6 h-6 w-full max-w-3xl rounded-full bg-white/16 dark:bg-white/10" />
          <Skeleton className="mx-auto mt-3 h-6 w-4/5 max-w-2xl rounded-full bg-white/14 dark:bg-white/10" />
          <Skeleton className="mx-auto mt-5 h-4 w-44 rounded-full bg-white/14 dark:bg-white/8" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function UniversityPageSkeleton() {
  return (
    <div>
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-xl sm:h-20 sm:w-20" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-56 sm:w-72" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
            >
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-5 h-10 w-32 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function MajorPageSkeleton() {
  return (
    <div>
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-10 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-10 w-64 max-w-full" />
              <Skeleton className="h-5 w-48 rounded-full" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-36 rounded-xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-28 rounded-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"
              >
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-5 flex gap-2">
                  <Skeleton className="h-9 w-24 rounded-xl" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-row gap-3 overflow-x-auto px-3 py-4 sm:gap-4 sm:px-4 sm:py-5 md:px-6 lg:gap-6 lg:px-8 lg:py-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <div className="mb-4 flex items-center justify-between border-b border-surface-100 pb-4 dark:border-surface-800">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-11 w-11 rounded-lg" />
          </div>
          <div className="mb-4 flex items-center gap-3 border-b border-surface-100 pb-4 dark:border-surface-800">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-6">
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
          <div className="rounded-[28px] border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-3 h-4 w-56 rounded-full" />
            <Skeleton className="mt-6 h-80 w-full rounded-[24px]" />
          </div>
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900">
            <Skeleton className="h-6 w-40" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
