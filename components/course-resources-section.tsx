"use client";

import { useState } from "react";
import * as motion from "motion/react-client";

const categoryConfig = {
  course_intro: { label: "التعريف بالمادة", icon: "🧭" },
  comprehensive_post: { label: "البوست الشامل", icon: "🧩" },
  textbook: { label: "الكتاب", icon: "📘" },
  previous_years: { label: "السنوات السابقة", icon: "🗂️" },
  explanations_notebooks: { label: "الشروحات والدفاتر", icon: "📒" },
  course_drive: { label: "درايف المادة", icon: "☁️" },
  notes: { label: "ملاحظات", icon: "📝" },
  exams: { label: "امتحانات", icon: "📋" },
  videos: { label: "فيديوهات", icon: "🎬" },
  summaries: { label: "ملخصات", icon: "📖" },
  tips: { label: "نصائح", icon: "💡" },
  other: { label: "أخرى", icon: "📎" },
} as const;

const categoryOrder: (keyof typeof categoryConfig)[] = [
  "course_intro",
  "comprehensive_post",
  "textbook",
  "previous_years",
  "explanations_notebooks",
  "course_drive",
  "summaries",
  "notes",
  "exams",
  "videos",
  "tips",
  "other",
];

type ResourceCategory = keyof typeof categoryConfig;

type CourseResource = {
  _id: string;
  category: ResourceCategory;
  contentHtml?: string;
  order: number;
  title: string;
  type: "link" | "richtext";
  url?: string;
};

type CategoryGroup = {
  icon: string;
  label: string;
  resources: CourseResource[];
  value: ResourceCategory;
};

function buildCategoryGroups(resources: CourseResource[]): CategoryGroup[] {
  const grouped = new Map<ResourceCategory, CourseResource[]>();

  for (const resource of resources) {
    if (!grouped.has(resource.category)) {
      grouped.set(resource.category, []);
    }

    grouped.get(resource.category)!.push(resource);
  }

  return categoryOrder.flatMap((category) => {
    const categoryResources = grouped.get(category);

    if (!categoryResources?.length) {
      return [];
    }

    return [
      {
        value: category,
        label: categoryConfig[category].label,
        icon: categoryConfig[category].icon,
        resources: [...categoryResources].sort((a, b) => a.order - b.order),
      },
    ];
  });
}

export function CourseResourcesSection({
  resources,
}: {
  resources: CourseResource[];
}) {
  const [activeCategory, setActiveCategory] = useState<
    "all" | ResourceCategory
  >("all");

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-3xl dark:bg-surface-800">
          📚
        </div>
        <p className="text-lg font-medium text-surface-700 dark:text-surface-200">
          لا توجد مصادر بعد
        </p>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          ستُضاف المصادر قريباً. ترقبوا التحديثات!
        </p>
      </div>
    );
  }

  const categoryGroups = buildCategoryGroups(resources);
  const selectedCategory =
    activeCategory === "all" ||
    categoryGroups.some((group) => group.value === activeCategory)
      ? activeCategory
      : "all";
  const visibleGroups =
    selectedCategory === "all"
      ? categoryGroups
      : categoryGroups.filter((group) => group.value === selectedCategory);

  return (
    <div className="space-y-10">
      {/* Category filter tabs */}
      {resources.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            }`}
          >
            الكل ({resources.length})
          </button>
          {categoryGroups.map((group) => (
            <button
              key={group.value}
              type="button"
              onClick={() => setActiveCategory(group.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === group.value
                  ? "bg-primary-600 text-white"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              }`}
            >
              {group.label} ({group.resources.length})
            </button>
          ))}
        </div>
      )}

      {visibleGroups.map((group, groupIndex) => (
        <motion.div
          key={group.value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + groupIndex * 0.1 }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-800 dark:text-surface-100 sm:text-xl">
            <span className="text-xl">{group.icon}</span>
            {group.label}
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              {group.resources.length}
            </span>
          </h2>

          <div className="space-y-3">
            {group.resources.map((resource) => (
              <div
                key={resource._id}
                className="rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900"
              >
                {resource.type === "link" && resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 overflow-hidden p-4 text-primary-600 transition-colors hover:bg-surface-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-surface-800 dark:hover:text-primary-300"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <span className="min-w-0 flex-1 break-words text-sm font-medium leading-6 text-inherit [overflow-wrap:anywhere] sm:text-base">
                      {resource.title}
                    </span>
                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-surface-400 sm:mt-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ) : (
                  <div className="p-5">
                    <h3 className="mb-3 font-semibold text-surface-800 dark:text-surface-100">
                      {resource.title}
                    </h3>
                    {resource.contentHtml && (
                      <div
                        className="prose prose-sm max-w-none break-words text-surface-700 [overflow-wrap:anywhere] [&_a]:break-all [&_a]:text-primary-600 [&_a]:[overflow-wrap:anywhere] dark:text-surface-300 dark:[&_a]:text-primary-400"
                        style={{ direction: "rtl" }}
                        dangerouslySetInnerHTML={{
                          __html: resource.contentHtml,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
