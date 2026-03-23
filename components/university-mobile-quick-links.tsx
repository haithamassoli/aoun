type UniversityQuickLinksProps = {
  links?: Array<{
    title: string;
    url: string;
  }>;
};

export function UniversityMobileQuickLinks({
  links,
}: UniversityQuickLinksProps) {
  const items = links ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 items-center gap-2 pb-1">
        {items.map((link) => (
          <a
            key={`${link.title}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex justify-between min-h-11 items-center gap-2 rounded-full border border-surface-200 bg-white/90 px-4 py-2 text-sm font-medium text-surface-700 shadow-sm transition duration-200 hover:border-primary-300 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:text-primary-300 dark:focus-visible:ring-offset-surface-950"
          >
            <span className="truncate">{link.title}</span>
            <svg
              className="h-4 w-4 shrink-0 text-surface-400 transition-colors group-hover:text-primary-500 dark:group-hover:text-primary-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 13.5V18a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 18v-7.5A1.5 1.5 0 016 9h4.5"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
