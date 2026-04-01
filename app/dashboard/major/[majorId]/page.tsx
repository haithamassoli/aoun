"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CATEGORIES, type CategoryValue } from "@/constant/resource-categories";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Toast, useToast } from "@/components/toast";
import { FormInput } from "@/components/form-field";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import { contributorCourseSchema, contributorMajorSchema } from "@/lib/schemas";
import { motion } from "motion/react";
import { NewsList } from "@/components/dashboard/news-list";
import { NewsForm } from "@/components/dashboard/news-form";
import { SendNotificationForm } from "@/components/dashboard/send-notification-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormModal } from "@/components/form-modal";
import { generateSlug, normalizeSlug } from "@/lib/slug";
import { normalizeAlias } from "@/lib/alias";
import { formatCourseSemesterLabel } from "@/lib/course-semester";
import { REQUEST_KIND_LABELS, type RequestKind } from "@/lib/resource-requests";

type CourseListItem = {
  _id: Id<"courses">;
  name: string;
  slug: string;
  credits: number;
  courseCode?: string;
  semester?: string;
  order: number;
  resourceCount: number;
  alias?: string;
};

type OpenResourceRequest = {
  _id: Id<"resourceRequests">;
  courseId: Id<"courses">;
  majorId: Id<"majors">;
  kind: RequestKind;
  category?: CategoryValue;
  note: string;
  suggestedUrl?: string;
  createdAt: number;
  courseName: string;
};

type ActiveTab = "courses" | "news" | "requests" | "notifications";

const CATEGORY_LABELS: Record<CategoryValue, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.label]),
) as Record<CategoryValue, string>;
const REQUEST_KIND_TONES: Record<RequestKind, string> = {
  missing_resource:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  resource_suggestion:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
};
const requestDateFormatter = new Intl.DateTimeFormat("ar-JO", {
  dateStyle: "medium",
  timeStyle: "short",
});

function buildSocialLinks(value: {
  instagram: string;
  facebook: string;
  facebookGroup: string;
  faculty: string;
  telegram: string;
}) {
  const socialLinks = {
    instagram: value.instagram.trim() || undefined,
    facebook: value.facebook.trim() || undefined,
    facebookGroup: value.facebookGroup.trim() || undefined,
    faculty: value.faculty.trim() || undefined,
    telegram: value.telegram.trim() || undefined,
  };

  return Object.values(socialLinks).some(Boolean) ? socialLinks : undefined;
}

function buildRequestGroups(requests: OpenResourceRequest[]) {
  const grouped = new Map<
    string,
    {
      courseId: Id<"courses">;
      courseName: string;
      newestCreatedAt: number;
      requests: OpenResourceRequest[];
    }
  >();

  for (const request of requests) {
    const existingGroup = grouped.get(request.courseId);

    if (!existingGroup) {
      grouped.set(request.courseId, {
        courseId: request.courseId,
        courseName: request.courseName,
        newestCreatedAt: request.createdAt,
        requests: [request],
      });
      continue;
    }

    existingGroup.requests.push(request);
    existingGroup.newestCreatedAt = Math.max(
      existingGroup.newestCreatedAt,
      request.createdAt,
    );
  }

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      requests: group.requests.toSorted(
        (left, right) => right.createdAt - left.createdAt,
      ),
    }))
    .toSorted((left, right) => right.newestCreatedAt - left.newestCreatedAt);
}

function formatRequestDate(timestamp: number) {
  return requestDateFormatter.format(new Date(timestamp));
}

export default function MajorCoursesPage() {
  const { user, sessionToken } = useAuth();
  const { majorId } = useParams<{ majorId: string }>();
  const toast = useToast();
  const search = useDebouncedPublicSearch();
  const majorIdValue = majorId as Id<"majors">;

  const major = useQuery(
    api.dashboard.getMajorWithUniversity,
    user && sessionToken
      ? { token: sessionToken, majorId: majorIdValue }
      : "skip",
  );
  const courses = useQuery(
    api.dashboard.getCoursesForMajor,
    user && sessionToken
      ? { token: sessionToken, majorId: majorIdValue }
      : "skip",
  );
  const searchedCourses = useQuery(
    api.courses.searchByMajor,
    search.isEmpty ? "skip" : { majorId: majorIdValue, query: search.query },
  );
  const newsCount = useQuery(api.news.countByMajor, { majorId: majorIdValue });
  const openResourceRequests = useQuery(
    api.resourceRequests.listOpenForMajor,
    user && sessionToken
      ? { token: sessionToken, majorId: majorIdValue }
      : "skip",
  );

  const addCourse = useMutation(api.courses.add);
  const updateCourse = useMutation(api.courses.update);
  const removeNews = useMutation(api.news.remove);
  const markResourceRequestFulfilled = useMutation(
    api.resourceRequests.markFulfilled,
  );
  const updateMajorTreeDiagramUrl = useMutation(
    api.dashboard.updateMajorTreeDiagramUrl,
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("courses");
  const [showForm, setShowForm] = useState(false);
  const [showMajorLinkForm, setShowMajorLinkForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // News state
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsFormValues, setNewsFormValues] = useState<
    | {
        title: string;
        content: string;
      }
    | undefined
  >(undefined);
  const [deletingNews, setDeletingNews] = useState<string | null>(null);
  const [pendingDeleteNews, setPendingDeleteNews] = useState<{
    _id: Id<"news">;
    title: string;
  } | null>(null);
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showSlugInfo, setShowSlugInfo] = useState(false);
  const [showAliasInfo, setShowAliasInfo] = useState(false);
  const [showOrderInfo, setShowOrderInfo] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      credits: "3",
      courseCode: "",
      semester: "1",
      order: "0",
      alias: "",
    },
    validators: { onChange: contributorCourseSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        if (editingId) {
          await updateCourse({
            token: sessionToken,
            courseId: editingId as Id<"courses">,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            credits: Number(value.credits),
            courseCode: value.courseCode.trim() || undefined,
            semester: value.semester,
            order: Number(value.order) || 0,
            alias: normalizeAlias(value.alias) || undefined,
          });
          toast.show("تم تحديث المادة بنجاح", "success");
        } else {
          await addCourse({
            token: sessionToken,
            majorId: majorIdValue,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            credits: Number(value.credits),
            courseCode: value.courseCode.trim() || undefined,
            semester: value.semester,
            order: Number(value.order) || 0,
            alias: normalizeAlias(value.alias) || undefined,
          });
          toast.show("تم إضافة المادة بنجاح", "success");
        }
        formApi.reset();
        setEditingId(null);
        setShowForm(false);
      } catch {
        toast.show("حدث خطأ أثناء الحفظ", "error");
      }
    },
  });

  const majorLinkForm = useForm({
    defaultValues: {
      treeDiagramUrl: "",
      instagram: "",
      facebook: "",
      facebookGroup: "",
      faculty: "",
      telegram: "",
    },
    validators: { onChange: contributorMajorSchema },
    onSubmit: async ({ value }) => {
      if (!sessionToken) return;
      try {
        await updateMajorTreeDiagramUrl({
          token: sessionToken,
          majorId: majorIdValue,
          treeDiagramUrl: value.treeDiagramUrl.trim() || undefined,
          socialLinks: buildSocialLinks(value),
        });
        toast.show("تم حفظ الروابط بنجاح", "success");
        setShowMajorLinkForm(false);
      } catch {
        toast.show("حدث خطأ أثناء حفظ الروابط", "error");
      }
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (course: CourseListItem) => {
    form.reset(
      {
        name: course.name,
        slug: course.slug,
        credits: course.credits.toString(),
        courseCode: course.courseCode ?? "",
        semester: course.semester ?? "",
        order: course.order.toString(),
        alias: normalizeAlias(course.alias ?? ""),
      },
      { keepDefaultValues: true },
    );
    setEditingId(course._id);
    setShowForm(true);
  };

  const handleNewsEdit = (news: {
    _id: Id<"news">;
    title: string;
    content: string;
  }) => {
    setNewsFormValues({ title: news.title, content: news.content });
    setEditingNewsId(news._id);
    setShowNewsForm(true);
  };

  const handleNewsDelete = async () => {
    if (!sessionToken) return;
    if (!pendingDeleteNews) return;

    setDeletingNews(pendingDeleteNews._id);
    try {
      await removeNews({ token: sessionToken, newsId: pendingDeleteNews._id });
      toast.show("تم حذف الخبر", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeletingNews(null);
      setPendingDeleteNews(null);
    }
  };

  const resetNewsForm = () => {
    setShowNewsForm(false);
    setEditingNewsId(null);
    setNewsFormValues(undefined);
  };

  const handleMarkRequestFulfilled = async (
    requestId: Id<"resourceRequests">,
  ) => {
    if (!sessionToken || pendingRequestIds.has(requestId)) {
      return;
    }

    setPendingRequestIds((current) => {
      const next = new Set(current);
      next.add(requestId);
      return next;
    });

    try {
      await markResourceRequestFulfilled({
        token: sessionToken,
        requestId,
      });
      toast.show("تم تحديث الطلب", "success");
    } catch {
      toast.show("حدث خطأ أثناء تحديث الطلب", "error");
    } finally {
      setPendingRequestIds((current) => {
        const next = new Set(current);
        next.delete(requestId);
        return next;
      });
    }
  };

  const openMajorLinkForm = () => {
    if (major) {
      majorLinkForm.setFieldValue("treeDiagramUrl", major.treeDiagramUrl ?? "");
      majorLinkForm.setFieldValue(
        "instagram",
        major.socialLinks?.instagram ?? "",
      );
      majorLinkForm.setFieldValue(
        "facebook",
        major.socialLinks?.facebook ?? "",
      );
      majorLinkForm.setFieldValue(
        "facebookGroup",
        major.socialLinks?.facebookGroup ?? "",
      );
      majorLinkForm.setFieldValue("faculty", major.socialLinks?.faculty ?? "");
      majorLinkForm.setFieldValue(
        "telegram",
        major.socialLinks?.telegram ?? "",
      );
    }
    setShowMajorLinkForm(true);
  };

  if (major === undefined || courses === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
        <div className="h-64 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
      </div>
    );
  }

  if (!major) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          التخصص غير موجود
        </p>
      </div>
    );
  }

  const baseCourses = courses as CourseListItem[];
  const courseLookup = new Map(
    baseCourses.map((course) => [course._id, course]),
  );
  const activeCourses: CourseListItem[] = search.isEmpty
    ? baseCourses
    : (searchedCourses ?? []).map((course) => {
        const existingCourse = courseLookup.get(course._id);

        if (existingCourse) {
          return existingCourse;
        }

        return {
          ...course,
          resourceCount: 0,
        };
      });
  const isSearchLoading =
    !search.isEmpty && (search.isDebouncing || searchedCourses === undefined);
  const isNoSearchResults =
    !search.isEmpty && !isSearchLoading && activeCourses.length === 0;
  const requestGroups = buildRequestGroups(openResourceRequests ?? []);

  return (
    <div>
      <Toast toast={toast} />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
        <Link
          href="/dashboard"
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          لوحة التحكم
        </Link>
        <svg
          className="h-3.5 w-3.5 rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-surface-900 dark:text-surface-50">
          {major.name}
        </span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            {major.name}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {major.universityName}
          </p>
        </div>
        {activeTab === "courses" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openMajorLinkForm}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-surface-600 dark:hover:bg-surface-800"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              إعدادات التخصص
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              إضافة مادة
            </button>
          </div>
        ) : activeTab === "news" ? (
          <button
            onClick={() => {
              resetNewsForm();
              setShowNewsForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            إضافة خبر
          </button>
        ) : null}
      </motion.div>

      <FormModal
        open={showMajorLinkForm}
        title="إعدادات التخصص"
        onClose={() => setShowMajorLinkForm(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            majorLinkForm.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Tree Diagram Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <svg
                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="16" y="16" width="6" height="6" rx="1.5" />
                  <rect x="2" y="16" width="6" height="6" rx="1.5" />
                  <rect x="9" y="2" width="6" height="6" rx="1.5" />
                  <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                  <path d="M12 12V8" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                شجرة المسار الدراسي
              </h3>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              رابط مخطط المواد والمتطلبات الدراسية للتخصص
            </p>
            <FormInput
              form={majorLinkForm}
              name="treeDiagramUrl"
              label="رابط شجرة المسار"
              placeholder="https://drive.google.com/..."
              dir="ltr"
            />
            {major.treeDiagramUrl && (
              <a
                href={major.treeDiagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0"
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
                معاينة الرابط الحالي
              </a>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-surface-200 dark:border-surface-700" />

          {/* Social Links Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <svg
                  className="h-4 w-4 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                حسابات التواصل الاجتماعي
              </h3>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              روابط حسابات التخصص على منصات التواصل الاجتماعي
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput
                form={majorLinkForm}
                name="instagram"
                label="Instagram"
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
              <FormInput
                form={majorLinkForm}
                name="facebook"
                label="Facebook Page"
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
              <FormInput
                form={majorLinkForm}
                name="facebookGroup"
                label="Facebook Group"
                placeholder="https://facebook.com/groups/..."
                dir="ltr"
              />
              <FormInput
                form={majorLinkForm}
                name="faculty"
                label="الهيئة التدريسية"
                placeholder="https://..."
                dir="ltr"
              />
              <FormInput
                form={majorLinkForm}
                name="telegram"
                label="Telegram"
                placeholder="https://t.me/..."
                dir="ltr"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-surface-700">
            <button
              type="button"
              onClick={() => setShowMajorLinkForm(false)}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغاء
            </button>
            <majorLinkForm.Subscribe
              selector={(s) => [s.canSubmit, s.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      حفظ التغييرات
                    </>
                  )}
                </button>
              )}
            </majorLinkForm.Subscribe>
          </div>
        </form>
      </FormModal>

      {/* Tab bar */}
      <div className="mb-4 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab("courses")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "courses"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          المواد ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "news"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          <span>الأخبار</span>
          {typeof newsCount === "number" && (
            <span
              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                activeTab === "news"
                  ? "bg-white/20 text-white"
                  : "bg-white text-primary-700 dark:bg-surface-900 dark:text-primary-300"
              }`}
            >
              {newsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "requests"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          <span>الطلبات</span>
          {typeof openResourceRequests?.length === "number" ? (
            <span
              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                activeTab === "requests"
                  ? "bg-white/20 text-white"
                  : "bg-white text-primary-700 dark:bg-surface-900 dark:text-primary-300"
              }`}
            >
              {openResourceRequests.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "notifications"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          الإشعارات
        </button>
      </div>

      {/* Courses tab content */}
      {activeTab === "courses" && (
        <>
          <FormModal
            open={showForm}
            title={editingId ? "تعديل المادة" : "إضافة مادة جديدة"}
            onClose={resetForm}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  form={form}
                  name="name"
                  label="اسم المادة *"
                  onChangeCallback={(val) => {
                    if (!editingId)
                      form.setFieldValue("slug", generateSlug(val));
                  }}
                />
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <label className="text-xs font-medium text-surface-700 dark:text-surface-200">
                      الرابط (slug) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSlugInfo(!showSlugInfo)}
                      className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label="معلومات عن الرابط"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  {showSlugInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full z-10 mt-1 w-full rounded-xl border border-primary-200 bg-primary-50 p-3 shadow-lg dark:border-primary-800 dark:bg-primary-950/90"
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-primary-900 dark:text-primary-100">
                            الرابط هو معرّف فريد للمادة في العنوان
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              <span className="font-semibold">مثال:</span> إذا
                              كان اسم المادة "عربي"
                            </p>
                            <p className="text-xs font-mono text-primary-600 dark:text-primary-400">
                              الرابط: aoun.assoli.site/just/[arabic]
                            </p>
                            <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                              يُستخدم في الرابط النهائي للمادة
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSlugInfo(false)}
                          className="shrink-0 rounded-lg p-1 text-primary-600 transition-colors hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/50"
                          aria-label="إغلاق"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <FormInput form={form} name="slug" label="" dir="ltr" />
                </div>
                <FormInput
                  form={form}
                  name="courseCode"
                  label="رمز المادة (اختياري)"
                  dir="ltr"
                  placeholder="E112"
                />
                <FormInput
                  form={form}
                  name="credits"
                  label="الساعات المعتمدة *"
                  type="number"
                  min="1"
                  step="1"
                />
                <FormInput
                  form={form}
                  name="semester"
                  label="المستوى أو المسار (اختياري)"
                  placeholder="مثال: 1"
                />
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <label className="text-xs font-medium text-surface-700 dark:text-surface-200">
                      الأسماء البديلة (اختياري)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAliasInfo(!showAliasInfo)}
                      className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label="معلومات عن الاسم البديل"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  {showAliasInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full z-10 mt-1 w-full rounded-xl border border-primary-200 bg-primary-50 p-3 shadow-lg dark:border-primary-800 dark:bg-primary-950/90"
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-primary-900 dark:text-primary-100">
                            أسماء بديلة تساعد في البحث عن المادة
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              <span className="font-semibold">مثال:</span> إذا
                              كان اسم المادة "calculus 101"
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">
                              الاسم البديل: كالكولس كالك تفاضل وتكامل رياضيات
                            </p>
                            <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                              يمكن للطلاب البحث بالاسم البديل للوصول للمادة
                              بسهولة
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAliasInfo(false)}
                          className="shrink-0 rounded-lg p-1 text-primary-600 transition-colors hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/50"
                          aria-label="إغلاق"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <FormInput
                    form={form}
                    name="alias"
                    label=""
                    placeholder="اسماء بديلة للبحث"
                  />
                </div>
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <label className="text-xs font-medium text-surface-700 dark:text-surface-200">
                      الترتيب (اختياري)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowOrderInfo(!showOrderInfo)}
                      className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full text-surface-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label="معلومات عن الترتيب"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  {showOrderInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full z-10 mt-1 w-full rounded-xl border border-primary-200 bg-primary-50 p-3 shadow-lg dark:border-primary-800 dark:bg-primary-950/90"
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-primary-900 dark:text-primary-100">
                            رقم الترتيب يحدد موضع المادة في القائمة
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              <span className="font-semibold">مثال:</span>{" "}
                              المواد ذات الترتيب الأقل تظهر أولاً
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">
                              ترتيب 0 → أول مادة، ترتيب 1 → ثاني مادة
                            </p>
                            <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                              يمكنك استخدامه لترتيب المواد حسب المستوى الدراسي
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowOrderInfo(false)}
                          className="shrink-0 rounded-lg p-1 text-primary-600 transition-colors hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/50"
                          aria-label="إغلاق"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <FormInput
                    form={form}
                    name="order"
                    label=""
                    type="number"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                >
                  إلغاء
                </button>
                <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "جاري الحفظ..."
                        : editingId
                          ? "تحديث"
                          : "إضافة"}
                    </button>
                  )}
                </form.Subscribe>
              </div>
            </form>
          </FormModal>

          {courses.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mb-6 overflow-hidden rounded-2xl border border-surface-200/80 bg-gradient-to-br from-white via-white to-surface-50/80 p-4 shadow-sm dark:border-surface-700 dark:from-surface-900 dark:via-surface-900 dark:to-surface-950"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl flex-1">
                  <PublicSearchInput
                    label="ابحث داخل مواد التخصص"
                    placeholder="مثال: برمجة كائنية أو E112"
                    value={search.input}
                    onChange={search.setInput}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:max-w-xs lg:justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    {search.isEmpty
                      ? `${courses.length} مادة متاحة`
                      : isSearchLoading
                        ? "جاري البحث..."
                        : `${activeCourses.length} نتيجة`}
                  </span>
                </div>
              </div>
            </motion.section>
          ) : null}

          {/* Courses list */}
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                <svg
                  className="h-6 w-6 text-surface-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                لا توجد مواد
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                أضف مادة جديدة للبدء
              </p>
            </div>
          ) : isSearchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
                />
              ))}
            </div>
          ) : isNoSearchResults ? (
            <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                <svg
                  className="h-6 w-6 text-surface-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.1-4.65a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                لا توجد نتائج مطابقة
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                لم نعثر على مادة تطابق «{search.query}» داخل هذا التخصص.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCourses.map((course, index: number) => {
                const semesterLabel = formatCourseSemesterLabel(
                  course.semester,
                );
                return (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="group flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
                  >
                    <Link
                      href={`/dashboard/major/${majorId}/course/${course._id}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                          {course.courseCode || "#"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                            {course.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                            <span>{course.credits} ساعات</span>
                            {semesterLabel && <span>{semesterLabel}</span>}
                            <span>{course.resourceCount} مصدر</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                        title="تعديل"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* News tab content */}
      {activeTab === "news" && (
        <>
          <FormModal
            open={showNewsForm}
            title={editingNewsId ? "تعديل الخبر" : "إضافة خبر جديد"}
            onClose={resetNewsForm}
          >
            <NewsForm
              majorId={majorIdValue}
              editingId={editingNewsId}
              initialValues={newsFormValues}
              onSuccess={resetNewsForm}
              onCancel={resetNewsForm}
              showToast={(msg, type) => toast.show(msg, type)}
            />
          </FormModal>

          <NewsList
            majorId={majorIdValue}
            onEdit={handleNewsEdit}
            onDelete={(news) =>
              setPendingDeleteNews({ _id: news._id, title: news.title })
            }
            deleting={deletingNews}
          />
        </>
      )}

      {/* Requests tab content */}
      {activeTab === "requests" && (
        <>
          {openResourceRequests === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
                />
              ))}
            </div>
          ) : requestGroups.length === 0 ? (
            <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                <svg
                  className="h-6 w-6 text-surface-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                لا توجد طلبات مفتوحة
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                ستظهر هنا طلبات المصادر الواردة من صفحات المواد في هذا التخصص.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {requestGroups.map((group, groupIndex) => (
                <motion.section
                  key={group.courseId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                  className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {group.courseName}
                      </h2>
                      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                        {group.requests.length} طلب مفتوح
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/major/${majorId}/course/${group.courseId}`}
                      className="inline-flex items-center justify-center rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-700 transition-colors hover:border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-700"
                    >
                      فتح صفحة المادة
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {group.requests.map((request) => (
                      <article
                        key={request._id}
                        className="rounded-2xl border border-surface-200/80 bg-surface-50/70 p-4 dark:border-surface-700 dark:bg-surface-950/30"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full border border-surface-200 bg-white px-2.5 py-1 font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
                                {request.courseName}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-1 font-semibold ${REQUEST_KIND_TONES[request.kind]}`}
                              >
                                {REQUEST_KIND_LABELS[request.kind]}
                              </span>
                              {request.category ? (
                                <span className="rounded-full border border-surface-200 bg-white px-2.5 py-1 font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
                                  {CATEGORY_LABELS[request.category]}
                                </span>
                              ) : null}
                              <span className="text-surface-500 dark:text-surface-400">
                                {formatRequestDate(request.createdAt)}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-surface-700 dark:text-surface-200">
                              {request.note}
                            </p>

                            {request.suggestedUrl ? (
                              <a
                                href={request.suggestedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                <span className="truncate">
                                  {request.suggestedUrl}
                                </span>
                                <svg
                                  className="h-4 w-4 shrink-0"
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
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/dashboard/major/${majorId}/course/${request.courseId}`}
                              className="inline-flex items-center justify-center rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-surface-700 transition-colors hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-800"
                            >
                              فتح صفحة المادة
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkRequestFulfilled(request._id)
                              }
                              disabled={pendingRequestIds.has(request._id)}
                              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {pendingRequestIds.has(request._id)
                                ? "جارٍ التحديث..."
                                : "تمت التلبية"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>
          )}
        </>
      )}

      {/* Notifications tab content */}
      {activeTab === "notifications" && (
        <div className="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-900">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              إرسال إشعار مخصص
            </h2>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              سيُرسل الإشعار لجميع المشتركين في هذا التخصص.
            </p>
          </div>
          <SendNotificationForm
            majorId={majorIdValue}
            showToast={(msg, type) => toast.show(msg, type)}
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteNews !== null}
        title="تأكيد حذف الخبر"
        description={
          pendingDeleteNews
            ? `سيتم حذف خبر «${pendingDeleteNews.title}» من القائمة العامة ولوحة التحكم.`
            : ""
        }
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        isLoading={deletingNews !== null}
        onConfirm={handleNewsDelete}
        onCancel={() => {
          if (!deletingNews) {
            setPendingDeleteNews(null);
          }
        }}
      />
    </div>
  );
}
