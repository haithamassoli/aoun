"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Toast, useToast } from "@/components/toast";
import { TiptapEditor } from "@/components/tiptap-editor";
import DOMPurify from "isomorphic-dompurify";

const CATEGORIES = [
  { value: "notes", label: "ملاحظات" },
  { value: "exams", label: "امتحانات" },
  { value: "videos", label: "فيديوهات" },
  { value: "summaries", label: "ملخصات" },
  { value: "tips", label: "نصائح" },
  { value: "other", label: "أخرى" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

const CATEGORY_LABELS: Record<CategoryValue, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<CategoryValue, string>;

type ResourceFormData = {
  title: string;
  category: CategoryValue;
  type: "link" | "richtext";
  url: string;
  content: string;
  order: string;
};

const EMPTY_FORM: ResourceFormData = {
  title: "",
  category: "notes",
  type: "link",
  url: "",
  content: "",
  order: "0",
};

export default function CourseResourcesPage() {
  const { user, sessionToken } = useAuth();
  const { majorId, courseId } = useParams<{ majorId: string; courseId: string }>();
  const toast = useToast();

  const course = useQuery(
    api.dashboard.getCourseWithMajor,
    user && sessionToken ? { token: sessionToken, courseId: courseId as Id<"courses"> } : "skip"
  );
  const resources = useQuery(
    api.dashboard.getResourcesForCourse,
    user && sessionToken ? { token: sessionToken, courseId: courseId as Id<"courses"> } : "skip"
  );

  const addResource = useMutation(api.resources.add);
  const updateResource = useMutation(api.resources.update);
  const removeResource = useMutation(api.resources.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryValue | "all">("all");

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (resource: {
    _id: string;
    title: string;
    category: CategoryValue;
    type: "link" | "richtext";
    url?: string;
    content?: string;
    order: number;
  }) => {
    setFormData({
      title: resource.title,
      category: resource.category,
      type: resource.type,
      url: resource.url ?? "",
      content: resource.content ?? "",
      order: resource.order.toString(),
    });
    setEditingId(resource._id);
    setShowForm(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!sessionToken) return;
    setDeleting(resourceId);
    try {
      await removeResource({ token: sessionToken, resourceId: resourceId as Id<"resources"> });
      toast.show("تم حذف المصدر", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !formData.title.trim()) return;

    // Validate
    if (formData.type === "link" && !formData.url.trim()) {
      toast.show("يرجى إدخال الرابط", "error");
      return;
    }
    if (formData.type === "richtext" && !formData.content.trim()) {
      toast.show("يرجى إدخال المحتوى", "error");
      return;
    }

    setSaving(true);
    try {
      // Sanitize HTML content before storing
      const sanitizedContent =
        formData.type === "richtext" ? DOMPurify.sanitize(formData.content) : undefined;

      if (editingId) {
        await updateResource({
          token: sessionToken,
          resourceId: editingId as Id<"resources">,
          title: formData.title.trim(),
          category: formData.category,
          type: formData.type,
          url: formData.type === "link" ? formData.url.trim() : undefined,
          content: sanitizedContent,
          order: Number(formData.order) || 0,
        });
        toast.show("تم تحديث المصدر بنجاح", "success");
      } else {
        await addResource({
          token: sessionToken,
          courseId: courseId as Id<"courses">,
          title: formData.title.trim(),
          category: formData.category,
          type: formData.type,
          url: formData.type === "link" ? formData.url.trim() : undefined,
          content: sanitizedContent,
          order: Number(formData.order) || 0,
        });
        toast.show("تم إضافة المصدر بنجاح", "success");
      }
      resetForm();
    } catch {
      toast.show("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  if (course === undefined || resources === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
        <div className="h-64 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
        <p className="text-sm text-surface-500 dark:text-surface-400">المادة غير موجودة</p>
      </div>
    );
  }

  const filteredResources =
    activeCategory === "all"
      ? resources
      : resources.filter((r) => r.category === activeCategory);

  // Group resources by category for display
  const categoryGroups = CATEGORIES.map((cat) => ({
    ...cat,
    resources: resources.filter((r) => r.category === cat.value),
  })).filter((g) => g.resources.length > 0);

  return (
    <div>
      <Toast toast={toast} />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
        <Link href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">لوحة التحكم</Link>
        <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/dashboard/major/${majorId}`} className="hover:text-primary-600 dark:hover:text-primary-400">{course.majorName}</Link>
        <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-surface-900 dark:text-surface-50">{course.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">{course.name}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {course.courseCode && <span className="me-2 font-mono text-xs">{course.courseCode}</span>}
            {resources.length} مصدر
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          إضافة مصدر
        </button>
      </div>

      {/* Resource editor form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30">
          <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
            {editingId ? "تعديل المصدر" : "إضافة مصدر جديد"}
          </h3>
          <div className="space-y-4">
            {/* Title + Category row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">عنوان المصدر *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">التصنيف *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryValue })}
                  className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type toggle */}
            <div>
              <label className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-300">نوع المصدر</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "link" })}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    formData.type === "link"
                      ? "bg-primary-600 text-white"
                      : "border border-surface-300 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  رابط خارجي
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "richtext" })}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    formData.type === "richtext"
                      ? "bg-primary-600 text-white"
                      : "border border-surface-300 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  نص منسق
                </button>
              </div>
            </div>

            {/* Conditional: URL or Rich text */}
            {formData.type === "link" ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">الرابط *</label>
                <input
                  type="url"
                  dir="ltr"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">المحتوى *</label>
                <TiptapEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                />
              </div>
            )}

            {/* Order */}
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">الترتيب</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                min="0"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Category filter tabs */}
      {resources.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            }`}
          >
            الكل ({resources.length})
          </button>
          {categoryGroups.map((group) => (
            <button
              key={group.value}
              onClick={() => setActiveCategory(group.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === group.value
                  ? "bg-primary-600 text-white"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              }`}
            >
              {group.label} ({group.resources.length})
            </button>
          ))}
        </div>
      )}

      {/* Resources list */}
      {resources.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
            <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">لا توجد مصادر</p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">أضف مصدرا جديدا للبدء</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-8 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-sm text-surface-500 dark:text-surface-400">لا توجد مصادر في هذا التصنيف</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResources.map((resource) => (
            <div
              key={resource._id}
              className="group rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{resource.title}</h3>
                    <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                      {CATEGORY_LABELS[resource.category as CategoryValue]}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      resource.type === "link"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                    }`}>
                      {resource.type === "link" ? "رابط" : "نص منسق"}
                    </span>
                  </div>
                  {resource.type === "link" && resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {resource.url}
                    </a>
                  )}
                  {resource.type === "richtext" && resource.content && (
                    <div
                      className="prose prose-sm mt-2 max-w-none text-surface-600 dark:text-surface-300"
                      dir="rtl"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(resource.content),
                      }}
                    />
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(resource as Parameters<typeof handleEdit>[0])}
                    className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                    title="تعديل"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(resource._id)}
                    disabled={deleting === resource._id}
                    className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="حذف"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
