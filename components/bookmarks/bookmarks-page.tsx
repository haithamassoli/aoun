"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { BookmarkIcon } from "@/components/bookmarks/bookmark-icons";
import {
  createBookmarkCollection,
  getEmptyBookmarksSnapshot,
  loadBookmarks,
  removeBookmarkCollection,
  removeBookmarkItem,
  setBookmarkCollectionMembership,
  subscribeBookmarks,
  type BookmarkCollection,
  type BookmarkItem,
} from "@/lib/bookmarks";

type ActiveFilter = "all" | "uncategorized" | string;

function formatSavedDate(timestamp: number) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
  }).format(new Date(timestamp));
}

function getItemTypeLabel(item: BookmarkItem) {
  return item.type === "course" ? "مـادة" : "مصـدر";
}

function isItemInCollection(
  collections: BookmarkCollection[],
  itemKey: string,
) {
  return collections.some((collection) => collection.itemKeys.includes(itemKey));
}

function EmptyBookmarksState() {
  return (
    <section className="rounded-[28px] border border-dashed border-primary-200 bg-gradient-to-bl from-primary-50 via-white to-surface-50 p-8 text-center shadow-sm dark:border-primary-900/70 dark:from-primary-950/40 dark:via-surface-900 dark:to-surface-950 sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-surface-900 dark:text-primary-300">
        <BookmarkIcon />
      </div>
      <h2 className="mt-5 text-xl font-bold text-surface-900 dark:text-surface-50">
        لا توجد محفوظـات بعد
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-surface-600 dark:text-surface-400">
        احفظ المـواد أو المصادر المهمة أثناء التصفح، وستظهر هنا على هذا الجهاز
        فقط.
      </p>
      <Link
        href="/courses"
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
      >
        ابدأ من بحـث المواد
      </Link>
    </section>
  );
}

function BookmarkDestination({ item }: { item: BookmarkItem }) {
  const className =
    "inline-flex items-center justify-center rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/50 dark:hover:text-primary-300";

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        فتـح المصدر
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      فتـح
    </Link>
  );
}

function BookmarkCard({
  collections,
  item,
}: {
  collections: BookmarkCollection[];
  item: BookmarkItem;
}) {
  return (
    <article className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300">
              {getItemTypeLabel(item)}
            </span>
            {item.badge ? (
              <span className="inline-flex max-w-full truncate rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-[11px] font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
                {item.badge}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 line-clamp-2 text-base font-bold text-surface-900 dark:text-surface-50 sm:text-lg">
            {item.title}
          </h2>
          {item.subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-surface-600 dark:text-surface-400">
              {item.subtitle}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-surface-500 dark:text-surface-500">
            حُفـظ في {formatSavedDate(item.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          <BookmarkDestination item={item} />
          <button
            type="button"
            onClick={() => removeBookmarkItem(item.key)}
            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/70 dark:bg-surface-900 dark:text-rose-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/30"
          >
            إزالـة
          </button>
        </div>
      </div>

      {collections.length > 0 ? (
        <div className="mt-4 border-t border-surface-100 pt-4 dark:border-surface-800">
          <p className="mb-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
            المجمـوعات
          </p>
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => {
              const checked = collection.itemKeys.includes(item.key);

              return (
                <label
                  key={collection.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    checked
                      ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                      : "border-surface-200 bg-surface-50 text-surface-600 hover:border-primary-200 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-primary-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setBookmarkCollectionMembership({
                        collectionId: collection.id,
                        included: event.target.checked,
                        itemKey: item.key,
                      })
                    }
                    className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-900"
                  />
                  <span>{collection.title}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function BookmarksPage() {
  const bookmarks = useSyncExternalStore(
    subscribeBookmarks,
    loadBookmarks,
    getEmptyBookmarksSnapshot,
  );
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [collectionTitle, setCollectionTitle] = useState("");
  const activeCollection = bookmarks.collections.find(
    (collection) => collection.id === activeFilter,
  );
  const activeCollectionItemKeys = activeCollection
    ? new Set(activeCollection.itemKeys)
    : null;
  const visibleItems = bookmarks.items.filter((item) => {
    if (activeFilter === "all") {
      return true;
    }

    if (activeFilter === "uncategorized") {
      return !isItemInCollection(bookmarks.collections, item.key);
    }

    return activeCollectionItemKeys?.has(item.key) ?? false;
  });
  const ungroupedCount = bookmarks.items.filter(
    (item) => !isItemInCollection(bookmarks.collections, item.key),
  ).length;

  const handleCreateCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = collectionTitle.trim();
    if (!title) {
      return;
    }

    createBookmarkCollection(title, bookmarks);
    setCollectionTitle("");
  };

  const handleDeleteActiveCollection = () => {
    if (!activeCollection) {
      return;
    }

    removeBookmarkCollection(activeCollection.id, bookmarks);
    setActiveFilter("all");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 hidden md:block">
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-300">
          محفوظـات محلية
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-surface-900 dark:text-surface-50">
          المحفوظـات والمجموعات
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
          رتّب المـواد والمصادر التي تحتاج الرجوع إليها بسرعة. تحفظ البيانات على
          هذا الجهاز فقط وتدخل ضمن النسخ الاحتياطي المحلي.
        </p>
      </header>

      {bookmarks.items.length === 0 ? (
        <EmptyBookmarksState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-primary-50 px-3 py-3 dark:bg-primary-950/40">
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {bookmarks.items.length}
                  </p>
                  <p className="mt-1 text-xs text-primary-700/80 dark:text-primary-300/80">
                    محفوظـة
                  </p>
                </div>
                <div className="rounded-xl bg-surface-50 px-3 py-3 dark:bg-surface-800">
                  <p className="text-2xl font-bold text-surface-800 dark:text-surface-100">
                    {bookmarks.collections.length}
                  </p>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                    مجمـوعة
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
              <h2 className="text-sm font-bold text-surface-900 dark:text-surface-50">
                إنشاء مجمـوعة
              </h2>
              <form onSubmit={handleCreateCollection} className="mt-3 space-y-2">
                <input
                  type="text"
                  value={collectionTitle}
                  onChange={(event) => setCollectionTitle(event.target.value)}
                  placeholder="مثال: امتحـانات قريبة"
                  className="h-11 w-full rounded-xl border border-surface-300 bg-white px-3 text-sm text-surface-900 outline-none transition-colors placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-surface-600 dark:bg-surface-950 dark:text-surface-100 dark:focus:ring-primary-900/30"
                />
                <button
                  type="submit"
                  disabled={collectionTitle.trim().length === 0}
                  className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-surface-300 dark:disabled:bg-surface-700"
                >
                  إضافة مجمـوعة
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-surface-200 bg-white p-3 shadow-sm dark:border-surface-700 dark:bg-surface-900">
              <h2 className="px-2 pb-2 text-sm font-bold text-surface-900 dark:text-surface-50">
                التصفـية
              </h2>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                    activeFilter === "all"
                      ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                      : "text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800"
                  }`}
                >
                  <span>كل المحفوظـات</span>
                  <span>{bookmarks.items.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("uncategorized")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                    activeFilter === "uncategorized"
                      ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                      : "text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800"
                  }`}
                >
                  <span>بدون مجمـوعة</span>
                  <span>{ungroupedCount}</span>
                </button>
                {bookmarks.collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => setActiveFilter(collection.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                      activeFilter === collection.id
                        ? "bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                        : "text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800"
                    }`}
                  >
                    <span className="truncate">{collection.title}</span>
                    <span>{collection.itemKeys.length}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {activeCollection?.title ??
                      (activeFilter === "uncategorized"
                        ? "بدون مجمـوعة"
                        : "كل المحفوظـات")}
                  </h2>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    {visibleItems.length} عنصـر ظاهر
                  </p>
                </div>
                {activeCollection ? (
                  <button
                    type="button"
                    onClick={handleDeleteActiveCollection}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/70 dark:bg-surface-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    حذف المجمـوعة
                  </button>
                ) : null}
              </div>
            </div>

            {visibleItems.length > 0 ? (
              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <BookmarkCard
                    key={item.key}
                    collections={bookmarks.collections}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-surface-200 bg-white p-8 text-center dark:border-surface-700 dark:bg-surface-900">
                <p className="text-base font-semibold text-surface-800 dark:text-surface-100">
                  لا توجد عناصـر هنا حالياً
                </p>
                <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                  غيّر التصفـية أو أضف عناصر لهذه المجموعة من بطاقات المحفوظات.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
