"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-3">
        لا يوجد اتصال بالإنترنت
      </h1>
      <p className="text-surface-600 dark:text-surface-400 max-w-md mb-6">
        يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
