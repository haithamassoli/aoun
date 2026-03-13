import type { Doc } from "@/convex/_generated/dataModel";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";

export type NewsWithAuthor = Doc<"news"> & {
  authorName: string;
};

type NewsCardProps = {
  news: NewsWithAuthor;
  featured?: boolean;
};

function formatDate(timestamp: number, featured: boolean) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: featured ? "full" : "medium",
  }).format(new Date(timestamp));
}

export function NewsCard({ news, featured = false }: NewsCardProps) {
  const publishedLabel = formatDate(news.createdAt, featured);
  const containerClass = featured
    ? "relative overflow-hidden rounded-[28px] border border-primary-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,1),_rgba(248,250,252,0.98)_46%,_rgba(239,246,255,0.96))] p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)] dark:border-primary-800/80 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_34%),linear-gradient(135deg,_rgba(2,6,23,1),_rgba(15,23,42,0.96)_52%,_rgba(30,41,59,0.95))]"
    : "relative overflow-hidden rounded-[24px] border border-surface-200/80 bg-white/95 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-surface-300 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] dark:border-surface-700/80 dark:bg-surface-900/90 dark:hover:border-surface-600";

  return (
    <article className={containerClass} dir="rtl" lang="ar">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-amber-400" />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-surface-500 dark:text-surface-400">
        <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-primary-700 shadow-sm dark:bg-surface-900/80 dark:text-primary-300">
          {featured ? "آخر الأخبار" : "خبر"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-100/90 px-3 py-1 dark:bg-surface-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {publishedLabel}
        </span>
      </div>

      <h2
        className={
          featured
            ? "text-2xl font-bold leading-tight text-surface-950 dark:text-white sm:text-3xl"
            : "text-xl font-semibold leading-tight text-surface-950 dark:text-surface-50"
        }
      >
        {news.title}
      </h2>

      <div
        className={
          featured
            ? "mt-5 space-y-3 text-[1.02rem] leading-8 text-surface-700 [&_a]:break-all [&_a]:text-primary-700 [&_a]:underline [&_blockquote]:border-r-4 [&_blockquote]:border-primary-300 [&_blockquote]:pr-4 [&_blockquote]:text-surface-600 [&_code]:rounded-md [&_code]:bg-surface-900/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_li]:mb-1.5 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:leading-8 [&_p]:text-balance [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-surface-950 [&_pre]:p-4 [&_pre]:text-surface-50 [&_ul]:list-disc [&_ul]:pr-5 dark:text-surface-200 dark:[&_a]:text-primary-300 dark:[&_blockquote]:border-primary-700 dark:[&_blockquote]:text-surface-300 dark:[&_code]:bg-white/10]"
            : "mt-4 space-y-3 text-sm leading-7 text-surface-700 [&_a]:break-all [&_a]:text-primary-600 [&_a]:underline [&_blockquote]:border-r-4 [&_blockquote]:border-primary-200 [&_blockquote]:pr-4 [&_blockquote]:text-surface-600 [&_code]:rounded-md [&_code]:bg-surface-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_li]:mb-1.5 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:leading-7 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-surface-950 [&_pre]:p-4 [&_pre]:text-surface-50 [&_ul]:list-disc [&_ul]:pr-5 dark:text-surface-300 dark:[&_a]:text-primary-400 dark:[&_blockquote]:border-primary-800 dark:[&_blockquote]:text-surface-300 dark:[&_code]:bg-surface-800]"
        }
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(news.content) }}
      />

      <footer className="mt-6 flex flex-wrap items-center gap-3 border-t border-surface-200/80 pt-4 text-sm text-surface-500 dark:border-surface-700/80 dark:text-surface-400">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1.5 dark:bg-surface-800">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          بواسطة {news.authorName}
        </span>
        {news.updatedAt > news.createdAt && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm dark:bg-surface-900">
            تم التحديث لاحقاً
          </span>
        )}
      </footer>
    </article>
  );
}
