import { Skeleton } from "@/components/ui/skeleton";

function MobilePageHeaderSkeleton() {
  return (
    <section className="sticky top-0 z-40 border-b border-surface-200 bg-white/90 backdrop-blur-xl md:hidden dark:border-surface-700 dark:bg-surface-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-40 rounded-full" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
      </div>
    </section>
  );
}

function MobileActionRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-white px-4 py-3 shadow-sm dark:border-primary-800 dark:bg-primary-950/40">
      <Skeleton className="h-4 w-36 max-w-[65%] rounded-full" />
      <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
    </div>
  );
}

function MobileCourseLinkRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 shadow-sm dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300">
      <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-36 max-w-[62vw] rounded-full" />
    </div>
  );
}

function MobileSocialLinksSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-11 rounded-full border border-surface-200 bg-white/90 dark:border-surface-700 dark:bg-surface-900/80"
        />
      ))}
    </div>
  );
}

function MobileQuickLinksSkeleton() {
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 items-center gap-2 pb-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="inline-flex min-h-11 rounded-full border border-surface-200 bg-white/90 px-4 py-2 dark:border-surface-700 dark:bg-surface-900/80"
          />
        ))}
      </div>
    </div>
  );
}

function MobilePillGridSkeleton({
  count,
  className,
  pillClassName,
}: {
  count: number;
  className?: string;
  pillClassName?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={pillClassName ?? "h-10 w-full rounded-full"}
        />
      ))}
    </div>
  );
}

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
        <div className="mb-8 space-y-4">
          <Skeleton className="mx-auto h-10 w-36" />
          <div className="mx-auto max-w-2xl">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-4 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-700 dark:bg-surface-900"
            >
              <Skeleton className="h-20 w-20 rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-surface-200 bg-surface-50 px-4 py-12 dark:border-surface-700 dark:bg-surface-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900"
              >
                <Skeleton className="mx-auto h-40 w-32 rounded-lg" />
              </div>
            ))}
          </div>
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

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="max-w-2xl">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
            >
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
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
      <MobilePageHeaderSkeleton />

      <section className="px-4 pb-10 pt-4 md:hidden">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:from-surface-900 dark:to-primary-950/40 dark:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3.5 w-16 rounded-full" />
                <Skeleton className="h-8 w-44 max-w-full" />
                <Skeleton className="h-4 w-28 rounded-full" />
              </div>
              <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
            </div>
          </div>

          <div className="space-y-3">
            <MobileActionRowSkeleton />
            <MobileActionRowSkeleton />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>

          <div className="rounded-2xl border border-primary-200/80 bg-white/90 px-4 py-3 shadow-sm dark:border-primary-800/80 dark:bg-primary-950/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-7 w-14 rounded-full" />
                <Skeleton className="h-5 w-40 max-w-[60vw] rounded-full" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-11 flex-1 min-w-28 rounded-full" />
              ))}
            </div>
            <MobilePillGridSkeleton
              count={4}
              className="grid grid-cols-2 gap-2"
              pillClassName="h-10 rounded-full"
            />
          </div>
        </div>
      </section>

      <section className="hidden border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-10 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-14 lg:px-8 md:block">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-10 w-72 max-w-full sm:h-12" />
              <Skeleton className="h-5 w-48 rounded-full" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-full sm:h-10 sm:w-28 sm:rounded-full" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-xl border border-surface-200/80 bg-white/90 px-4 py-2.5 shadow-sm dark:border-surface-700/80 dark:bg-surface-900/70"
                >
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-full" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-11 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-primary-200/80 bg-white/90 px-4 py-3 shadow-sm dark:border-primary-800/80 dark:bg-primary-950/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-7 w-14 rounded-full" />
                <Skeleton className="h-5 w-64 max-w-[60vw]" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-4 w-44 rounded-full" />
              </div>
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="flex min-w-max items-center gap-2 pb-1">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-32 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:block">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="rounded-[32px] border border-surface-200 bg-white/80 p-4 dark:border-surface-700 dark:bg-surface-900/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-6 w-56 rounded-full" />
                <Skeleton className="h-4 w-80 max-w-full rounded-full" />
              </div>
              <Skeleton className="h-11 w-32 rounded-2xl" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-44 rounded-full" />
              </div>
              <div className="space-y-2 sm:text-left">
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
              <Skeleton className="h-full w-[35%] rounded-none" variant="pulse" />
              <Skeleton className="h-full w-[25%] rounded-none" variant="pulse" />
              <Skeleton className="h-full w-[40%] rounded-none" variant="pulse" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>

          <div className="max-w-5xl space-y-3 md:flex md:items-start md:gap-3 md:space-y-0">
            <div className="w-full md:max-w-sm lg:max-w-lg">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="flex-1 rounded-xl border border-surface-200/80 bg-surface-50/80 p-3 dark:border-surface-700 dark:bg-surface-900 md:w-[320px] md:shrink-0 lg:w-[360px]">
              <Skeleton className="mb-2 h-4 w-32 rounded-full" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-surface-200/80 bg-white/90 px-4 py-3 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.55)] dark:border-surface-700/80 dark:bg-surface-900/90 dark:shadow-none">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2.5 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="rounded-2xl border border-surface-200/80 bg-white/95 p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] dark:border-surface-700/80 dark:bg-surface-900/95 dark:shadow-none sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-2.5 w-2.5 rounded-full" variant="pulse" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <Skeleton className="h-4 w-1/2 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CoursePageSkeleton() {
  return (
    <div>
      <MobilePageHeaderSkeleton />

      <section className="px-4 pb-10 pt-4 md:hidden">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-surface-700 dark:from-surface-900 dark:to-primary-950/40 dark:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3.5 w-16 rounded-full" />
                <Skeleton className="h-8 w-48 max-w-full" />
                <Skeleton className="h-4 w-36 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
            </div>
          </div>

          <div className="space-y-3">
            <MobileCourseLinkRowSkeleton />
            <MobileCourseLinkRowSkeleton />
          </div>

          <MobileSocialLinksSkeleton />

          <div className="rounded-2xl border border-primary-200/80 bg-white/90 px-4 py-3 shadow-sm dark:border-primary-800/80 dark:bg-primary-950/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-7 w-14 rounded-full" />
                <Skeleton className="h-5 w-40 max-w-[60vw] rounded-full" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>

          <MobileQuickLinksSkeleton />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-6 w-40 rounded-full" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" variant="pulse" />
                      <Skeleton className="h-5 w-3/4 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-16 rounded-full" />
                      <Skeleton className="h-7 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-[28px] border border-dashed border-primary-200 bg-gradient-to-bl from-primary-50 via-white to-surface-50 p-5 shadow-sm dark:border-primary-900/70 dark:from-primary-950/50 dark:via-surface-900 dark:to-surface-950">
              <div className="space-y-3">
                <Skeleton className="h-5 w-40 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-4/5 rounded-full" />
                <Skeleton className="h-11 w-44 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 lg:px-8 md:block">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-72 max-w-full sm:h-12 sm:w-96" />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-5 w-52 rounded-full" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="hidden mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 md:block">
        <div className="space-y-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-lg" />
            ))}
          </div>

          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={groupIndex}>
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, resourceIndex) => (
                  <div
                    key={resourceIndex}
                    className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-5 flex-1" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function MajorNewsPageSkeleton() {
  return (
    <div>
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-10 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-20 rounded-full" />
            ))}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-10 w-56 max-w-full" />
              <Skeleton className="h-5 w-40 rounded-full" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="mb-4 h-4 w-24 rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-surface-200 bg-white/90 p-5 dark:border-surface-700 dark:bg-surface-900"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 space-y-1.5">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                  <div className="mt-1 h-10 w-px shrink-0 bg-surface-200 dark:bg-surface-700" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2 rounded-full" />
                  </div>
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
