"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import * as motion from "motion/react-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CATEGORIES, type CategoryValue } from "@/constant/resource-categories";
import { FormModal } from "@/components/form-modal";
import { Toast, useToast } from "@/components/toast";
import { publicResourceRequestSchema } from "@/lib/schemas";
import {
  REQUEST_KIND_OPTIONS,
  type RequestKind,
} from "@/lib/resource-requests";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { getOrCreateVisitorKey } from "@/lib/visitor-analytics";
import { BookmarkToggleButton } from "@/components/bookmarks/bookmark-toggle-button";
import { captureAnalyticsEvent } from "@/lib/analytics-events";

const categoryConfig = {
  course_intro: { label: "التعريف بالمـادة", icon: "🧭" },
  comprehensive_post: { label: "البوست الشـامل", icon: "🧩" },
  textbook: { label: "الكـتاب", icon: "📘" },
  previous_years: { label: "السـنوات السابقة", icon: "🗂️" },
  explanations_notebooks: { label: "الشـروحات والدفاتر", icon: "📒" },
  course_drive: { label: "درايف المـادة", icon: "☁️" },
  notes: { label: "ملاحظـات", icon: "📝" },
  exams: { label: "امتحـانات", icon: "📋" },
  videos: { label: "فيديوهـات", icon: "🎬" },
  summaries: { label: "ملخـصات", icon: "📖" },
  tips: { label: "نصائـح", icon: "💡" },
  other: { label: "أخـرى", icon: "📎" },
} as const;

const categoryOrder: CategoryValue[] = [
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

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({
  value: category.value,
  label: categoryConfig[category.value].label,
}));
const REQUEST_CTA_COPY = "اطلب مصدر لهذه المـادة او اقترح مصدر جديد";

type ResourceCategory = CategoryValue;
type ResourceVote = "useful" | "not_useful";
type RequestFormValues = {
  kind: RequestKind;
  category: "" | CategoryValue;
  note: string;
  suggestedUrl: string;
};
type RequestFormField = keyof RequestFormValues;
type RequestFormErrors = Partial<Record<RequestFormField, string>>;

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

function buildRequestFieldErrors(
  issues: Array<{
    path: (string | number)[];
    message: string;
  }>,
): RequestFormErrors {
  const nextErrors: RequestFormErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      nextErrors[field as RequestFormField] === undefined
    ) {
      nextErrors[field as RequestFormField] = issue.message;
    }
  }

  return nextErrors;
}

function getResourceRequestErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "تعذر إرسال الطـلب. حاول مرة أخرى.";
  }

  if (error.message.includes("RESOURCE_REQUEST_DUPLICATE")) {
    return "تم إرسال هذا الطـلب مسبقاً لهذه المادة.";
  }

  if (error.message.includes("RESOURCE_REQUEST_LIMIT_REACHED")) {
    return "يمكنك إرسال 3 طـلبات مفتوحة كحد أقصى لهذه المادة.";
  }

  if (
    error.message.includes("INVALID_URL") ||
    error.message.includes("INVALID_URL_PROTOCOL")
  ) {
    return "الرابط المقـترح غير صالح.";
  }

  if (error.message.includes("INVALID_VISITOR_KEY")) {
    return "تعذر تهيئة الطـلب. أعد تحميل الصفحة وحاول مرة أخرى.";
  }

  return "تعذر إرسال الطـلب. حاول مرة أخرى.";
}

function ResourceCard({
  courseHref,
  courseName,
  isPending,
  onVote,
  resource,
  showCategory,
  viewerVote,
  visitorReady,
}: {
  courseHref: string;
  courseName: string;
  isPending: boolean;
  onVote: (resourceId: string, vote: ResourceVote) => void;
  resource: CourseResource;
  showCategory?: boolean;
  viewerVote?: ResourceVote;
  visitorReady: boolean;
}) {
  const interactionDisabled = isPending || !visitorReady;
  const categoryLabel = categoryConfig[resource.category].label;
  const bookmarkItem = {
    id: resource._id,
    type: "resource" as const,
    title: resource.title,
    href: resource.type === "link" && resource.url ? resource.url : courseHref,
    subtitle: `${categoryLabel} · ${courseName}`,
    badge: categoryLabel,
    external: resource.type === "link" && Boolean(resource.url),
  };

  return (
    <article
      id={`resource-${resource._id}`}
      className="group relative overflow-hidden rounded-xl border border-surface-200/80 bg-white transition-all hover:border-surface-300 hover:shadow-sm dark:border-surface-700/50 dark:bg-surface-900 dark:hover:border-surface-600"
    >
      {/* Voting buttons - top left for RTL */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
        <BookmarkToggleButton
          item={bookmarkItem}
          stopPropagation
          className="rounded-lg bg-white/90 p-1.5 text-surface-400 backdrop-blur-sm transition-all hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-surface-800/90 dark:text-surface-500 dark:hover:bg-primary-950/50 dark:hover:text-primary-400 [&_svg]:h-4 [&_svg]:w-4"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onVote(resource._id, "useful");
          }}
          disabled={interactionDisabled}
          aria-label="مفيد"
          title={`مفيد (${resource.usefulCount})`}
          className={`rounded-lg p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            viewerVote === "useful"
              ? "bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950/70 dark:text-emerald-400"
              : "bg-white/90 text-surface-400 backdrop-blur-sm hover:bg-emerald-50 hover:text-emerald-600 dark:bg-surface-800/90 dark:text-surface-500 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={viewerVote === "useful" ? "currentColor" : "none"}
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
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onVote(resource._id, "not_useful");
          }}
          disabled={interactionDisabled}
          aria-label="غير مفيد"
          title={`غير مفيد (${resource.notUsefulCount})`}
          className={`rounded-lg p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            viewerVote === "not_useful"
              ? "bg-rose-100 text-rose-600 shadow-sm dark:bg-rose-950/70 dark:text-rose-400"
              : "bg-white/90 text-surface-400 backdrop-blur-sm hover:bg-rose-50 hover:text-rose-600 dark:bg-surface-800/90 dark:text-surface-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={viewerVote === "not_useful" ? "currentColor" : "none"}
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
        </button>
      </div>

      {resource.type === "link" && resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            captureAnalyticsEvent("resource_opened", {
              courseHref,
              courseName,
              resourceId: resource._id,
              resourceCategory: resource.category,
              resourceType: resource.type,
            });
          }}
          className="block p-4 pl-28 transition-colors hover:bg-surface-50/50 dark:hover:bg-surface-800/50"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              {showCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-surface-500 dark:text-surface-400">
                  {categoryConfig[resource.category].icon}
                  <span>{categoryLabel}</span>
                </span>
              )}
              <h3 className="break-words text-sm font-semibold leading-snug text-surface-900 [overflow-wrap:anywhere] dark:text-surface-50">
                {resource.title}
              </h3>
            </div>
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-surface-400 transition-transform group-hover:-translate-x-1 dark:text-surface-500"
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
          </div>
        </a>
      ) : (
        <div className="space-y-2 p-4 pl-28">
          {showCategory && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-surface-500 dark:text-surface-400">
              {categoryConfig[resource.category].icon}
              <span>{categoryLabel}</span>
            </span>
          )}
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {resource.title}
          </h3>
          {resource.contentHtml && (
            <div
              className="prose prose-sm max-w-none break-words text-surface-600 [overflow-wrap:anywhere] [&_a]:break-all [&_a]:text-primary-600 [&_a]:[overflow-wrap:anywhere] dark:text-surface-400 dark:[&_a]:text-primary-400"
              style={{ direction: "rtl" }}
              dangerouslySetInnerHTML={{
                __html: resource.contentHtml,
              }}
            />
          )}
        </div>
      )}
    </article>
  );
}

function ResourceRequestCtaCard({
  hasResources,
  onOpen,
  visitorReady,
}: {
  hasResources: boolean;
  onOpen: () => void;
  visitorReady: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-primary-200 bg-gradient-to-bl from-primary-50 via-white to-surface-50 p-5 shadow-sm dark:border-primary-900/70 dark:from-primary-950/50 dark:via-surface-900 dark:to-surface-950 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            هل تحتاج مصدراً إضافـياً؟
          </p>
          <p className="mt-1 text-sm leading-7 text-surface-600 dark:text-surface-300">
            {hasResources
              ? "إذا كان هناك مصـدر ناقص أو لديك اقتراح مفيد، أرسله مباشرة ليظهر في قائمة الطلبات لدى المساهمين."
              : "هذه المـادة لا تحتوي على مصادر حالياً. يمكنك طلب مصدر لها أو اقتراح رابط مناسب ليتم مراجعته وإضافته."}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={!visitorReady}
          className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {REQUEST_CTA_COPY}
        </button>
      </div>
    </div>
  );
}

export function CourseResourcesSection({
  courseId,
  courseHref,
  courseName,
  resources,
}: {
  courseId: Id<"courses">;
  courseHref: string;
  courseName: string;
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
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestValues, setRequestValues] = useState<RequestFormValues>({
    kind: "missing_resource",
    category: "",
    note: "",
    suggestedUrl: "",
  });
  const [requestErrors, setRequestErrors] = useState<RequestFormErrors>({});

  const liveResources = useQuery(api.resources.listByCourse, { courseId });
  const viewerVotes = useQuery(
    api.resources.getViewerVotesByCourse,
    visitorKey ? { courseId, visitorKey } : "skip",
  );
  const setVote = useMutation(api.resources.setVote);
  const submitResourceRequest = useMutation(api.resourceRequests.submitPublic);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisitorKey(getOrCreateVisitorKey());
    }, 0);

    return () => window.clearTimeout(timeoutId);
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

  function resetRequestForm() {
    setRequestValues({
      kind: "missing_resource",
      category: "",
      note: "",
      suggestedUrl: "",
    });
    setRequestErrors({});
    setShowRequestForm(false);
    setIsSubmittingRequest(false);
  }

  function updateRequestField<Field extends RequestFormField>(
    field: Field,
    value: RequestFormValues[Field],
  ) {
    setRequestValues((current) => ({
      ...current,
      [field]: value,
    }));
    setRequestErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

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
      captureAnalyticsEvent("resource_vote_submitted", {
        courseHref,
        courseName,
        resourceId,
        vote,
      });
    } catch {
      toast.show("تعذر تحديث التقـييم. حاول مرة أخرى.", "error");
    } finally {
      setPendingResourceIds((current) => {
        const next = new Set(current);
        next.delete(resourceId);
        return next;
      });
    }
  }

  async function handleSubmitResourceRequest(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const result = publicResourceRequestSchema.safeParse(requestValues);
    if (!result.success) {
      setRequestErrors(
        buildRequestFieldErrors(
          result.error.issues.map((issue) => ({
            path: issue.path.filter(
              (p): p is string | number => typeof p !== "symbol",
            ),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    if (!visitorKey) {
      toast.show("تعذر تهيئة الطـلب. أعد تحميل الصفحة وحاول مرة أخرى.", "error");
      return;
    }

    setIsSubmittingRequest(true);

    try {
      await submitResourceRequest({
        courseId,
        visitorKey,
        kind: result.data.kind,
        category: result.data.category || undefined,
        note: result.data.note,
        suggestedUrl:
          result.data.kind === "resource_suggestion"
            ? result.data.suggestedUrl.trim() || undefined
            : undefined,
      });
      captureAnalyticsEvent("resource_request_submitted", {
        courseHref,
        courseName,
        kind: result.data.kind,
        category: result.data.category || null,
        hasSuggestedUrl: Boolean(result.data.suggestedUrl.trim()),
      });
      toast.show("تم إرسال الطلب بنجـاح", "success");
      resetRequestForm();
    } catch (error) {
      toast.show(getResourceRequestErrorMessage(error), "error");
      setIsSubmittingRequest(false);
    }
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {resolvedResources.length === 0 ? (
        <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-3xl dark:bg-surface-800">
            📚
          </div>
          <p className="text-lg font-medium text-surface-700 dark:text-surface-200">
            لا توجد مصـادر بعد
          </p>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            ستُضاف المصـادر قريباً. ترقبوا التحديثات!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
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
              كل المصـادر ({resolvedResources.length})
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
                جميع المصـادر
                <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                  {allResourcesByVotes.length}
                </span>
              </h2>

              <div className="space-y-3">
                {allResourcesByVotes.map((resource) => (
                  <ResourceCard
                    courseHref={courseHref}
                    courseName={courseName}
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
                    courseHref={courseHref}
                    courseName={courseName}
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
      )}

      <ResourceRequestCtaCard
        hasResources={resolvedResources.length > 0}
        onOpen={() => setShowRequestForm(true)}
        visitorReady={visitorKey !== null}
      />

      <FormModal
        open={showRequestForm}
        title="اطلب مصدراً أو اقترح مصدراً جديـداً"
        onClose={resetRequestForm}
      >
        <form onSubmit={handleSubmitResourceRequest} className="space-y-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              نوع الطـلب
            </label>
            <select
              value={requestValues.kind}
              onChange={(event) => {
                const nextKind = event.target.value as RequestKind;
                updateRequestField("kind", nextKind);
                if (nextKind !== "resource_suggestion") {
                  updateRequestField("suggestedUrl", "");
                }
              }}
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
            >
              {REQUEST_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {requestErrors.kind ? (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {requestErrors.kind}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              التصنـيف
              <span className="ms-1 text-surface-400">اختيـاري</span>
            </label>
            <select
              value={requestValues.category}
              onChange={(event) =>
                updateRequestField(
                  "category",
                  event.target.value as RequestFormValues["category"],
                )
              }
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
            >
              <option value="">اختر تصنـيفاً إن رغبت</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {requestErrors.category ? (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {requestErrors.category}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              تفاصيل الطـلب
            </label>
            <textarea
              value={requestValues.note}
              onChange={(event) =>
                updateRequestField("note", event.target.value)
              }
              rows={4}
              placeholder="اكتب ما الذي تحتاجه أو ما الذي تقترحه لهذه المـادة"
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
            />
            {requestErrors.note ? (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {requestErrors.note}
              </p>
            ) : null}
          </div>

          {requestValues.kind === "resource_suggestion" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
                الرابط المقـترح
                <span className="ms-1 text-surface-400">اختيـاري</span>
              </label>
              <input
                type="url"
                value={requestValues.suggestedUrl}
                onChange={(event) =>
                  updateRequestField("suggestedUrl", event.target.value)
                }
                dir="ltr"
                placeholder="https://example.com/resource"
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              />
              {requestErrors.suggestedUrl ? (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {requestErrors.suggestedUrl}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl bg-surface-50 px-4 py-3 text-xs leading-6 text-surface-500 dark:bg-surface-800/80 dark:text-surface-300">
            سيصل الطـلب إلى قائمة داخلية لدى المساهمين في هذا التخصص، ولن يظهر
            للعامة.
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-surface-700">
            <button
              type="button"
              onClick={resetRequestForm}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغـاء
            </button>
            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {isSubmittingRequest ? "جارٍ الإرسـال..." : "إرسال الطـلب"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
