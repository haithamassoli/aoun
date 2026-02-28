interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://aoun.jo${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="مسار التنقل" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <svg
                  className="h-3.5 w-3.5 shrink-0 rotate-180 text-surface-400 dark:text-surface-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {item.label}
                </a>
              ) : (
                <span className="font-medium text-surface-800 dark:text-surface-100">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
