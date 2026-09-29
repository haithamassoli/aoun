"use client";

import { useRef, useState } from "react";

export function ShowreelButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
        aria-label="تشغيل العرض التعريفي"
        title="تشغيل العرض التعريفي"
        className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M10 8l6 4-6 4z" fill="currentColor" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto aspect-video max-h-[90vh] w-[min(92vw,1280px)] overflow-hidden rounded-2xl bg-black p-0 backdrop:bg-black/80"
      >
        {/* Mounted only while open so the reel restarts each time and costs nothing otherwise */}
        {open && <iframe src="/showreel" title="العرض التعريفي لعون" className="h-full w-full border-0" />}
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="إغلاق"
          className="absolute end-3 top-3 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </dialog>
    </>
  );
}
