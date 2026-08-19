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
import { FormInput, FormSelect } from "@/components/form-field";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import {
  contributorCourseSchema,
  contributorMajorSchema,
  semesterSchema,
} from "@/lib/schemas";
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
import {
  PUBLIC_CACHE_TAG_GROUPS,
  revalidatePublicCache,
} from "@/lib/public-cache";

type CourseListItem = {
  _id: Id<"courses">;
  name: string;
  slug: string;
  credits: number;
  deliveryMode: "in_person" | "online";
  courseCode?: string;
  semesterId?: Id<"semesters">;
  semester?: string;
  semesterName?: string;
  semesterOrder?: number;
  order: number;
  resourceCount: number;
  alias?: string;
};

type CourseSearchResult = Omit<CourseListItem, "resourceCount"> & {
  resourceCount?: number;
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

type SemesterListItem = {
  _id: Id<"semesters">;
  name: string;
  order: number;
};

type ActiveTab =
  | "courses"
  | "semesters"
  | "news"
  | "requests"
  | "notifications";

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
  const semesters = useQuery(api.semesters.listByMajor, {
    majorId: majorIdValue,
  });
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
  const addSemester = useMutation(api.semesters.add);
  const updateSemester = useMutation(api.semesters.update);
  const removeSemester = useMutation(api.semesters.remove);
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
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(
    null,
  );
  const [deletingSemester, setDeletingSemester] = useState<string | null>(null);
  const [pendingDeleteSemester, setPendingDeleteSemester] = useState<{
    _id: Id<"semesters">;
    name: string;
  } | null>(null);

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
      deliveryMode: "in_person" as "in_person" | "online",
      courseCode: "",
      semesterId: "",
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
            deliveryMode: value.deliveryMode,
            courseCode: value.courseCode.trim() || undefined,
            semesterId: value.semesterId
              ? (value.semesterId as Id<"semesters">)
              : null,
            order: Number(value.order) || 0,
            alias: normalizeAlias(value.alias) || undefined,
          });
          await revalidatePublicCache(
            sessionToken,
            PUBLIC_CACHE_TAG_GROUPS.courses,
          );
          toast.show("تم تحديث المادة بنجاح", "success");
        } else {
          await addCourse({
            token: sessionToken,
            majorId: majorIdValue,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            credits: Number(value.credits),
            deliveryMode: value.deliveryMode,
            courseCode: value.courseCode.trim() || undefined,
            semesterId: value.semesterId
              ? (value.semesterId as Id<"semesters">)
              : null,
            order: Number(value.order) || 0,
            alias: normalizeAlias(value.alias) || undefined,
          });
          await revalidatePublicCache(
            sessionToken,
            PUBLIC_CACHE_TAG_GROUPS.courses,
          );
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

  const semesterForm = useForm({
    defaultValues: {
      name: "",
      order: "0",
    },
    validators: { onChange: semesterSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        if (editingSemesterId) {
          await updateSemester({
            token: sessionToken,
            semesterId: editingSemesterId as Id<"semesters">,
            name: value.name.trim(),
            order: Number(value.order) || 0,
          });
          await revalidatePublicCache(
            sessionToken,
            PUBLIC_CACHE_TAG_GROUPS.courseDetails,
          );
          toast.show("تم تحديث المستوى بنجاح", "success");
        } else {
          await addSemester({
            token: sessionToken,
            majorId: majorIdValue,
            name: value.name.trim(),
            order: Number(value.order) || 0,
          });
          await revalidatePublicCache(
            sessionToken,
            PUBLIC_CACHE_TAG_GROUPS.courseDetails,
          );
          toast.show("تم إضافة المستوى بنجاح", "success");
        }

        formApi.reset();
        setEditingSemesterId(null);
        setShowSemesterForm(false);
      } catch (error) {
        const msg =
          error instanceof Error &&
          error.message.includes("SEMESTER_NAME_EXISTS")
            ? "اسم المستوى مستخدم بالفعل في هذا التخصص"
            : "حدث خطأ أثناء حفظ المستوى";
        toast.show(msg, "error");
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
        await revalidatePublicCache(
          sessionToken,
          PUBLIC_CACHE_TAG_GROUPS.majorDetails,
        );
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

  const resetSemesterForm = () => {
    semesterForm.reset();
    setEditingSemesterId(null);
    setShowSemesterForm(false);
  };

  const handleEdit = (course: CourseListItem) => {
    form.reset(
      {
        name: course.name,
        slug: course.slug,
        credits: course.credits.toString(),
        deliveryMode: course.deliveryMode,
        courseCode: course.courseCode ?? "",
        semesterId: course.semesterId ?? "",
        order: course.order.toString(),
        alias: normalizeAlias(course.alias ?? ""),
      },
      { keepDefaultValues: true },
    );
    setEditingId(course._id);
    setShowForm(true);
  };

  const handleSemesterEdit = (semester: {
    _id: Id<"semesters">;
    name: string;
    order: number;
  }) => {
    semesterForm.reset(
      {
        name: semester.name,
        order: semester.order.toString(),
      },
      { keepDefaultValues: true },
    );
    setEditingSemesterId(semester._id);
    setShowSemesterForm(true);
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

  const handleSemesterDelete = async () => {
    if (!sessionToken || !pendingDeleteSemester) return;

    setDeletingSemester(pendingDeleteSemester._id);
    try {
      await removeSemester({
        token: sessionToken,
        semesterId: pendingDeleteSemester._id,
      });
      await revalidatePublicCache(
        sessionToken,
        PUBLIC_CACHE_TAG_GROUPS.courseDetails,
      );
      toast.show("تم حذف المستوى وإزالة ربطه من المواد", "success");
    } catch {
      toast.show("حدث خطأ أثناء حذف المستوى", "error");
    } finally {
      setDeletingSemester(null);
      setPendingDeleteSemester(null);
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
          التخصص غير موجـود
        </p>
      </div>
    );
  }

  const baseCourses = courses as CourseListItem[];
  const activeSemesters = (semesters ?? []) as SemesterListItem[];
  const semesterOptions = activeSemesters.map((semester) => ({
    value: semester._id,
    label: `${semester.name} — ترتـيب ${semester.order}`,
  }));
  const semesterCourseCounts = new Map<Id<"semesters">, number>();
  for (const course of baseCourses) {
    if (!course.semesterId) {
      continue;
    }

    semesterCourseCounts.set(
      course.semesterId,
      (semesterCourseCounts.get(course.semesterId) ?? 0) + 1,
    );
  }
  const courseLookup = new Map(
    baseCourses.map((course) => [course._id, course]),
  );
  const activeCourses: CourseListItem[] = search.isEmpty
    ? baseCourses
    : ((searchedCourses ?? []) as CourseSearchResult[]).map((course) => {
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
          لوحة التحكـم
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
              type="button"
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
              إعدادات التخصـص
            </button>
            <button
              type="button"
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
              إضافة مـادة
            </button>
          </div>
        ) : activeTab === "semesters" ? (
          <button
            type="button"
            onClick={() => {
              resetSemesterForm();
              setShowSemesterForm(true);
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
            إضافة فصـل
          </button>
        ) : activeTab === "news" ? (
          <button
            type="button"
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
            إضافة خبـر
          </button>
        ) : null}
      </motion.div>

      <FormModal
        open={showMajorLinkForm}
        title="إعدادات التخصـص"
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
                شجرة المسـار الدراسي
              </h3>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              رابط مخطط المواد والمتطلبات الدراسيـة للتخصص
            </p>
            <FormInput
              form={majorLinkForm}
              name="treeDiagramUrl"
              label="رابط شجرة المسـار"
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
                معاينة الرابط الحالـي
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
                حسابات التواصل الاجتماعـي
              </h3>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              روابط حسابات التخصص على منصـات التواصل الاجتماعي
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
                label="الهيئة التدريسيـة"
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
              إلغـاء
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
                      جاري الحـفظ...
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
                      حفظ التغييـرات
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
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "courses"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          المـواد ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("semesters")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "semesters"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          المستويـات ({activeSemesters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("news")}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "news"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          <span>الأخبـار</span>
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
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "requests"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          <span>الطلبـات</span>
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
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "notifications"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          الإشـعارات
        </button>
      </div>

      {/* Courses tab content */}
      {activeTab === "courses" && (
        <>
          <FormModal
            open={showForm}
            title={editingId ? "تعديل المـادة" : "إضافة مادة جديـدة"}
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
                  label="اسم المـادة *"
                  onChangeCallback={(val) => {
                    if (!editingId)
                      form.setFieldValue("slug", generateSlug(val));
                  }}
                />
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-surface-700 dark:text-surface-200">
                      الرابـط (slug) *
                    </span>
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
                            الرابط هو معرّف فريـد للمادة في العنوان
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              <span className="font-semibold">مثال:</span> إذا
                              كان اسم المـادة «عربي»
                            </p>
                            <p className="text-xs font-mono text-primary-600 dark:text-primary-400">
                              الرابط: aoun.assoli.site/just/[arabic]
                            </p>
                            <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                              يُستخدم في الرابط النهائي للمـادة
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
                  label="رمز المـادة (اختياري)"
                  dir="ltr"
                  placeholder="E112"
                />
                <FormInput
                  form={form}
                  name="credits"
                  label="الساعات المعتمـدة *"
                  type="number"
                  min="1"
                  step="1"
                />
                <FormSelect
                  form={form}
                  name="deliveryMode"
                  label="نوع المـادة *"
                  options={[
                    { value: "in_person", label: "وجاهي" },
                    { value: "online", label: "أونلاين" },
                  ]}
                />
                <FormSelect
                  form={form}
                  name="semesterId"
                  label="الفصل أو المستـوى (اختياري)"
                  options={semesterOptions}
                  placeholder="بدون فصـل"
                />
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-surface-700 dark:text-surface-200">
                      الأسماء البديلـة (اختياري)
                    </span>
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
                            أسماء بديلة تساعد في البحث عن المـادة
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              <span className="font-semibold">مثال:</span> إذا
                              كان اسم المـادة «calculus 101»
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">
                              الاسم البديـل: كالكولس كالك تفاضل وتكامل رياضيات
                            </p>
                            <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                              يمكن للطلاب البحث بالاسم البديل للوصول للمـادة
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
                    placeholder="اسماء بديلة للبحـث"
                  />
                </div>
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-surface-700 dark:text-surface-200">
                      الترتـيب (اختياري)
                    </span>
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
                            رقم الترتيب يحدد موضع المـادة في القائمة
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              <span className="font-semibold">مثال:</span>{" "}
                              المواد ذات الترتيب الأقل تظهر أولـاً
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">
                              ترتيب 0 → أول مادة، ترتيب 1 → ثاني مـادة
                            </p>
                            <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                              يمكنك استخدامه لترتيب المواد حسب المستوى الدراسـي
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
                  إلغـاء
                </button>
                <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "جاري الحـفظ..."
                        : editingId
                          ? "تحـديث"
                          : "إضـافة"}
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
                    label="ابحث داخل مواد التخصـص"
                    placeholder="مثال: برمجة كائنيـة أو E112"
                    value={search.input}
                    onChange={search.setInput}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:max-w-xs lg:justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    {search.isEmpty
                      ? `${courses.length} مادة متاحـة`
                      : isSearchLoading
                        ? "جاري البحـث..."
                        : `${activeCourses.length} نتيجـة`}
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
                لا توجد مـواد
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                أضف مادة جديدة للبـدء
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
                لا توجد نتائج مطابقـة
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                لم نعثر على مادة تطابق «{search.query}» داخل هذا التخصـص.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCourses.map((course, index: number) => {
                const semesterLabel =
                  course.semesterName ??
                  formatCourseSemesterLabel(course.semester);
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
                            <span>{course.credits} ساعـات</span>
                            <span>
                              {course.deliveryMode === "online"
                                ? "أونلاين"
                                : "وجاهي"}
                            </span>
                            {semesterLabel && <span>{semesterLabel}</span>}
                            <span>{course.resourceCount} مصـدر</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(course)}
                        className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                        title="تعديل"
                        aria-label={`تعديل ${course.name}`}
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

      {/* Semesters tab content */}
      {activeTab === "semesters" && (
        <>
          <FormModal
            open={showSemesterForm}
            title={editingSemesterId ? "تعديل المستـوى" : "إضافة مستوى جديـد"}
            onClose={resetSemesterForm}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                semesterForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 dark:border-primary-900 dark:bg-primary-950/30">
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                  ترتيب المستويات يظهر في الخطة العامـة
                </h3>
                <p className="mt-1 text-xs leading-5 text-primary-700 dark:text-primary-300">
                  استخدم رقماً أقل لإظهار المستوى مبكـراً، ثم اربط المواد
                  بالمستوى من نموذج المادة.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  form={semesterForm}
                  name="name"
                  label="اسم المستـوى *"
                  placeholder="مثال: المستـوى الأول"
                />
                <FormInput
                  form={semesterForm}
                  name="order"
                  label="الترتـيب"
                  type="number"
                  min="0"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetSemesterForm}
                  className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                >
                  إلغـاء
                </button>
                <semesterForm.Subscribe
                  selector={(s) => [s.canSubmit, s.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "جاري الحـفظ..."
                        : editingSemesterId
                          ? "تحـديث"
                          : "إضـافة"}
                    </button>
                  )}
                </semesterForm.Subscribe>
              </div>
            </form>
          </FormModal>

          {semesters === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
                />
              ))}
            </div>
          ) : activeSemesters.length === 0 ? (
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
                    d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                لا توجد مستويات بعـد
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                أضف مستويات لترتيب المواد في الصفحة العامـة.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSemesters.map((semester, index) => {
                const courseCount = semesterCourseCounts.get(semester._id) ?? 0;

                return (
                  <motion.div
                    key={semester._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                        {semester.order}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {semester.name}
                        </h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {courseCount} مادة مرتبطـة
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSemesterEdit(semester)}
                        className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                        title="تعديل"
                        aria-label={`تعديل ${semester.name}`}
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
                      <button
                        type="button"
                        onClick={() => setPendingDeleteSemester(semester)}
                        disabled={deletingSemester === semester._id}
                        className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                        title="حذف"
                        aria-label={`حذف ${semester.name}`}
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
            title={editingNewsId ? "تعديل الخبـر" : "إضافة خبر جديـد"}
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
                لا توجد طلبات مفتوحـة
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                ستظهر هنا طلبات المصادر الواردة من صفحات المواد في هذا التخصـص.
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
                        {group.requests.length} طلب مفتـوح
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/major/${majorId}/course/${group.courseId}`}
                      className="inline-flex items-center justify-center rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-700 transition-colors hover:border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-700"
                    >
                      فتح صفحة المـادة
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
                              فتح صفحة المـادة
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
                                ? "جارٍ التحـديث..."
                                : "تمت التلبيـة"}
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
              إرسال إشعار مخصـص
            </h2>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              سيُرسل الإشعار لجميع المشتركين في هذا التخصـص.
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
        title="تأكيد حذف الخبـر"
        description={
          pendingDeleteNews
            ? `سيتم حذف خبر «${pendingDeleteNews.title}» من القائمة العامـة ولوحة التحكم.`
            : ""
        }
        confirmLabel="تأكيد الحـذف"
        cancelLabel="إلغـاء"
        isLoading={deletingNews !== null}
        onConfirm={handleNewsDelete}
        onCancel={() => {
          if (!deletingNews) {
            setPendingDeleteNews(null);
          }
        }}
      />
      <ConfirmDialog
        open={pendingDeleteSemester !== null}
        title="تأكيد حذف المستـوى"
        description={
          pendingDeleteSemester
            ? `سيتم حذف فصل «${pendingDeleteSemester.name}» وإزالة ربطه من المواد المرتبطـة به.`
            : ""
        }
        confirmLabel="تأكيد الحـذف"
        cancelLabel="إلغـاء"
        isLoading={deletingSemester !== null}
        onConfirm={handleSemesterDelete}
        onCancel={() => {
          if (!deletingSemester) {
            setPendingDeleteSemester(null);
          }
        }}
      />
    </div>
  );
}
