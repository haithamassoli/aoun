export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75v15.5L12 17.1l-5.25 3.15V4.75Z"
      />
    </svg>
  );
}
