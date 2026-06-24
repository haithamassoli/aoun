import Link from "next/link";
import type { MouseEventHandler } from "react";
import { BookmarkIcon } from "@/components/bookmarks/bookmark-icons";

export function BookmarksNavLink({
  className,
  onClick,
  showLabel = false,
}: {
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  showLabel?: boolean;
}) {
  return (
    <Link
      href="/bookmarks"
      aria-label="المحفوظات والمجموعات"
      onClick={onClick}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200 dark:focus-visible:ring-offset-surface-950"
      }
    >
      <BookmarkIcon />
      {showLabel ? <span>المحفـوظات</span> : null}
    </Link>
  );
}
