import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary-600 dark:text-primary-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-surface-800 dark:text-surface-100">
          الصفحة غير موجودة
        </h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}
