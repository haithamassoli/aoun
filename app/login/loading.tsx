import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-14 w-16 rounded-2xl" />
          <Skeleton className="mx-auto h-7 w-32" />
          <Skeleton className="mx-auto mt-2 h-4 w-64 rounded-full" />
        </div>

        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-8">
          <div className="space-y-5">
            <div>
              <Skeleton className="mb-1.5 h-4 w-28 rounded-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <div>
              <Skeleton className="mb-1.5 h-4 w-20 rounded-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        <Skeleton className="mx-auto mt-6 h-4 w-56 rounded-full" />
      </div>
    </div>
  );
}
