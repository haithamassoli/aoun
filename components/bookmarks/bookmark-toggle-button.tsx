"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import { BookmarkIcon } from "@/components/bookmarks/bookmark-icons";
import {
  addBookmarkItem,
  getBookmarkItemKey,
  getEmptyBookmarksSnapshot,
  loadBookmarks,
  removeBookmarkItem,
  subscribeBookmarks,
  type BookmarkItemInput,
} from "@/lib/bookmarks";

type BookmarkToggleButtonProps = {
  item: BookmarkItemInput;
  className?: string;
  menuCheckbox?: boolean;
  showLabel?: boolean;
  stopPropagation?: boolean;
};

const defaultClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-semibold text-surface-600 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/50 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950";

const activeClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-all hover:border-primary-400 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-primary-700 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:border-primary-600 dark:hover:bg-primary-950 dark:focus-visible:ring-offset-surface-950";

export function BookmarkToggleButton({
  item,
  className,
  menuCheckbox = false,
  showLabel = false,
  stopPropagation = false,
}: BookmarkToggleButtonProps) {
  const bookmarks = useSyncExternalStore(
    subscribeBookmarks,
    loadBookmarks,
    getEmptyBookmarksSnapshot,
  );
  const itemKey = getBookmarkItemKey(item.type, item.id);
  const isSaved = bookmarks.items.some((bookmark) => bookmark.key === itemKey);

  const toggleBookmark = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (isSaved) {
      removeBookmarkItem(itemKey, bookmarks);
      return;
    }

    addBookmarkItem(item, bookmarks);
  };

  return (
    <button
      type="button"
      role={menuCheckbox ? "menuitemcheckbox" : undefined}
      aria-checked={menuCheckbox ? isSaved : undefined}
      aria-pressed={menuCheckbox ? undefined : isSaved}
      aria-label={isSaved ? "إزالة من المحفوظات" : "حفظ في المحفوظات"}
      title={isSaved ? "إزالة من المحفوظات" : "حفظ في المحفوظات"}
      onClick={toggleBookmark}
      className={className ?? (isSaved ? activeClassName : defaultClassName)}
    >
      <BookmarkIcon filled={isSaved} />
      {showLabel ? (
        <span>{isSaved ? "محفوظ" : "حفظ"}</span>
      ) : null}
    </button>
  );
}
