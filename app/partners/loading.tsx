import { Skeleton } from "@/components/ui/skeleton";

export default function PartnersLoading() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto mt-3 h-4 w-64 rounded-full" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
            >
              <Skeleton className="mx-auto h-20 w-20 rounded-xl" />
              <Skeleton className="mx-auto mt-4 h-5 w-full" />
              <Skeleton className="mx-auto mt-2 h-4 w-3/4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
