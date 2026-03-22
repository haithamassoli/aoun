"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import * as motion from "motion/react-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { getOrCreateVisitorKey } from "@/lib/visitor-analytics";
import { Toast, useToast } from "@/components/toast";

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
type ResourceVote = "useful" | "not_useful";

type CourseResource = {
  _id: string;
  category: ResourceCategory;
  contentHtml?: string;
  helpfulnessScore: number;
  notUsefulCount: number;
  order: number;
  title: string;
  totalFeedback: number;
  type: "link" | "richtext";
  usefulCount: number;
  url?: string;
};

type LiveCourseResource = {
  _id: string;
  category: ResourceCategory;
  content?: string;
  helpfulnessScore: number;
  notUsefulCount: number;
  order: number;
  title: string;
  totalFeedback: number;
  type: "link" | "richtext";
  usefulCount: number;
  url?: string;
};

type CategoryGroup = {
  icon: string;
  label: string;
  resources: CourseResource[];
  value: ResourceCategory;
};

function mapLiveResourceToCourseResource(
  resource: LiveCourseResource,
): CourseResource {
  return {
    _id: resource._id,
    category: resource.category,
    contentHtml: resource.content
      ? sanitizeRichText(resource.content)
      : undefined,
    helpfulnessScore: resource.helpfulnessScore,
    notUsefulCount: resource.notUsefulCount,
    order: resource.order,
    title: resource.title,
    totalFeedback: resource.totalFeedback,
    type: resource.type,
    usefulCount: resource.usefulCount,
    url: resource.url,
  };
}

function sortResourcesByHelpfulness(resources: CourseResource[]) {
  return resources.toSorted(
    (left, right) =>
      right.helpfulnessScore - left.helpfulnessScore ||
      right.usefulCount - left.usefulCount ||
      left.order - right.order,
  );
}

function buildCategoryGroups(resources: CourseResource[]): CategoryGroup[] {
  const grouped = new Map<ResourceCategory, CourseResource[]>();

  for (const resource of resources) {
    if (!grouped.has(resource.category)) {
      grouped.set(resource.category, []);
    }

    grouped.get(resource.category)?.push(resource);
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
        resources: sortResourcesByHelpfulness(categoryResources),
      },
    ];
  });
}

function formatScore(score: number) {
  return score > 0 ? `+${score}` : `${score}`;
}

function formatFeedbackCount(totalFeedback: number) {
  if (totalFeedback === 0) {
    return "بدون تقييمات";
  }

  return `${totalFeedback} تقييم`;
}

function VoteButton({
  active,
  disabled,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
  tone: "positive" | "negative";
}) {
  const activeClassName =
    tone === "positive"
      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-500/70 dark:bg-rose-950/40 dark:text-rose-300";

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? activeClassName
          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-surface-600 dark:hover:bg-surface-800"
      }`}
    >
      {tone === "positive" ? (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 9V5a3 3 0 00-3-3l-1 4-3 4v10h10.76a2 2 0 001.95-1.55l1.2-6A2 2 0 0018.95 10H14zM7 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h3"
          />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 15v4a3 3 0 003 3l1-4 3-4V4H6.24a2 2 0 00-1.95 1.55l-1.2 6A2 2 0 005.05 14H10zM17 2h3a2 2 0 012 2v8a2 2 0 01-2 2h-3"
          />
        </svg>
      )}
      {label}
    </button>
  );
}

function ResourceCard({
  isPending,
  onVote,
  resource,
  showCategory,
  viewerVote,
  visitorReady,
}: {
  isPending: boolean;
  onVote: (resourceId: string, vote: ResourceVote) => void;
  resource: CourseResource;
  showCategory?: boolean;
  viewerVote?: ResourceVote;
  visitorReady: boolean;
}) {
  const scoreTone =
    resource.helpfulnessScore > 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
      : resource.helpfulnessScore < 0
        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
        : "border-surface-200 bg-surface-50 text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300";

  const interactionDisabled = isPending || !visitorReady;

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900">
      {resource.type === "link" && resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 overflow-hidden p-4 text-primary-600 transition-colors hover:bg-surface-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-surface-800 dark:hover:text-primary-300 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            {showCategory ? (
              <span className="mb-3 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {categoryConfig[resource.category].label}
              </span>
            ) : null}
            <h3 className="break-words text-sm font-semibold leading-6 text-inherit [overflow-wrap:anywhere] sm:text-base">
              {resource.title}
            </h3>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              افتح المصدر في نافذة جديدة
            </p>
          </div>
          <svg
            className="mt-1 h-4 w-4 shrink-0 text-surface-400 transition-transform group-hover:-translate-x-0.5 sm:mt-0"
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
          {showCategory ? (
            <span className="mb-3 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {categoryConfig[resource.category].label}
            </span>
          ) : null}
          <h3 className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50 sm:text-base">
            {resource.title}
          </h3>
          {resource.contentHtml ? (
            <div
              className="prose prose-sm max-w-none break-words text-surface-700 [overflow-wrap:anywhere] [&_a]:break-all [&_a]:text-primary-600 [&_a]:[overflow-wrap:anywhere] dark:text-surface-300 dark:[&_a]:text-primary-400"
              style={{ direction: "rtl" }}
              dangerouslySetInnerHTML={{
                __html: resource.contentHtml,
              }}
            />
          ) : null}
        </div>
      )}

      <div className="border-t border-surface-100 px-4 py-3 dark:border-surface-800 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 font-semibold ${scoreTone}`}
            >
              النتيجة {formatScore(resource.helpfulnessScore)}
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
              {formatFeedbackCount(resource.totalFeedback)}
            </span>
            {resource.totalFeedback > 0 ? (
              <span className="text-surface-500 dark:text-surface-400">
                مفيد {resource.usefulCount} • غير مفيد {resource.notUsefulCount}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPending ? (
              <span className="text-xs font-medium text-surface-400 dark:text-surface-500">
                جارٍ التحديث...
              </span>
            ) : null}
            <VoteButton
              active={viewerVote === "useful"}
              disabled={interactionDisabled}
              label="مفيد"
              onClick={() => onVote(resource._id, "useful")}
              tone="positive"
            />
            <VoteButton
              active={viewerVote === "not_useful"}
              disabled={interactionDisabled}
              label="غير مفيد"
              onClick={() => onVote(resource._id, "not_useful")}
              tone="negative"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function CourseResourcesSection({
  courseId,
  resources,
}: {
  courseId: Id<"courses">;
  resources: CourseResource[];
}) {
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState<
    "all" | ResourceCategory
  >("all");
  const [visitorKey, setVisitorKey] = useState<string | null>(null);
  const [pendingResourceIds, setPendingResourceIds] = useState<Set<string>>(
    () => new Set(),
  );

  const liveResources = useQuery(api.resources.listByCourse, { courseId });
  const viewerVotes = useQuery(
    api.resources.getViewerVotesByCourse,
    visitorKey ? { courseId, visitorKey } : "skip",
  );
  const setVote = useMutation(api.resources.setVote);

  useEffect(() => {
    setVisitorKey(getOrCreateVisitorKey());
  }, []);

  const resolvedResources = liveResources
    ? liveResources.map(mapLiveResourceToCourseResource)
    : resources;

  const categoryGroups = buildCategoryGroups(resolvedResources);
  const allResourcesByVotes = sortResourcesByHelpfulness(resolvedResources);
  const selectedCategory =
    activeCategory === "all" ||
    categoryGroups.some((group) => group.value === activeCategory)
      ? activeCategory
      : "all";
  const visibleGroups = categoryGroups.filter(
    (group) => group.value === selectedCategory,
  );

  async function handleVote(resourceId: string, vote: ResourceVote) {
    if (!visitorKey || pendingResourceIds.has(resourceId)) {
      return;
    }

    setPendingResourceIds((current) => {
      const next = new Set(current);
      next.add(resourceId);
      return next;
    });

    try {
      await setVote({
        resourceId: resourceId as Id<"resources">,
        visitorKey,
        vote,
      });
    } catch {
      toast.show("تعذر تحديث التقييم. حاول مرة أخرى.", "error");
    } finally {
      setPendingResourceIds((current) => {
        const next = new Set(current);
        next.delete(resourceId);
        return next;
      });
    }
  }

  if (resolvedResources.length === 0) {
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

  return (
    <div className="space-y-10">
      <Toast toast={toast} />

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
          كل المصادر ({resolvedResources.length})
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

      {selectedCategory === "all" ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-800 dark:text-surface-100 sm:text-xl">
            <span className="text-xl">📊</span>
            جميع المصادر
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              {allResourcesByVotes.length}
            </span>
          </h2>

          <div className="space-y-3">
            {allResourcesByVotes.map((resource) => (
              <ResourceCard
                key={resource._id}
                isPending={pendingResourceIds.has(resource._id)}
                onVote={handleVote}
                resource={resource}
                showCategory
                viewerVote={viewerVotes?.[resource._id]}
                visitorReady={visitorKey !== null}
              />
            ))}
          </div>
        </motion.div>
      ) : null}

      {visibleGroups.map((group, groupIndex) => (
        <motion.div
          key={group.value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + groupIndex * 0.08 }}
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
              <ResourceCard
                key={resource._id}
                isPending={pendingResourceIds.has(resource._id)}
                onVote={handleVote}
                resource={resource}
                viewerVote={viewerVotes?.[resource._id]}
                visitorReady={visitorKey !== null}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
