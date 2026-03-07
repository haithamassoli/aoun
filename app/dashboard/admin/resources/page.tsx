"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Toast, useToast } from "@/components/toast";
import { FormInput, FormSelect } from "@/components/form-field";
import { TiptapEditor } from "@/components/tiptap-editor";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { resourceSchema } from "@/lib/schemas";

const CATEGORIES = [
  { value: "notes", label: "ملاحظات" },
  { value: "exams", label: "امتحانات" },
  { value: "videos", label: "فيديوهات" },
  { value: "summaries", label: "ملخصات" },
  { value: "tips", label: "نصائح" },
  { value: "course_intro", label: "التعريف بالمادة" },
  { value: "comprehensive_post", label: "البوست الشامل" },
  { value: "textbook", label: "الكتاب" },
  { value: "previous_years", label: "السنوات السابقة" },
  { value: "explanations_notebooks", label: "الشروحات والدفاتر" },
  { value: "course_drive", label: "درايف المادة" },
  { value: "other", label: "أخرى" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

const CATEGORY_LABELS: Record<CategoryValue, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<CategoryValue, string>;

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

export default function AdminResourcesPage() {
  const { user, sessionToken } = useAuth();
  const toast = useToast();

  const resources = useQuery(
    api.dashboard.adminListResources,
    user && sessionToken ? { token: sessionToken } : "skip",
  );
  const courses = useQuery(
    api.dashboard.adminListCourses,
    user && sessionToken ? { token: sessionToken } : "skip",
  );

  const addResource = useMutation(api.resources.add);
  const updateResource = useMutation(api.resources.update);
  const removeResource = useMutation(api.resources.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      courseId: "",
      title: "",
      category: "notes",
      type: "link" as "link" | "richtext",
      url: "",
      content: "",
      order: "0",
    },
    validators: { onChange: resourceSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        const sanitizedContent =
          value.type === "richtext"
            ? sanitizeRichText(value.content)
            : undefined;

        if (editingId) {
          await updateResource({
            token: sessionToken,
            resourceId: editingId as Id<"resources">,
            title: value.title.trim(),
            category: value.category,
            type: value.type,
            url: value.type === "link" ? value.url.trim() : undefined,
            content: sanitizedContent,
            order: Number(value.order) || 0,
          });
          toast.show("تم تحديث المصدر بنجاح", "success");
        } else {
          await addResource({
            token: sessionToken,
            courseId: value.courseId as Id<"courses">,
            title: value.title.trim(),
            category: value.category,
            type: value.type,
            url: value.type === "link" ? value.url.trim() : undefined,
            content: sanitizedContent,
            order: Number(value.order) || 0,
          });
          toast.show("تم إضافة المصدر بنجاح", "success");
        }
        formApi.reset();
        setEditingId(null);
        setShowForm(false);
      } catch {
        toast.show("حدث خطأ أثناء الحفظ", "error");
      }
    },
  });

  const resourceType = form.useStore((s) => s.values.type);

  if (!user || user.role !== "admin") return null;

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (resource: {
    _id: string;
    courseId: string;
    title: string;
    category: CategoryValue;
    type: "link" | "richtext";
    url?: string;
    content?: string;
    order: number;
  }) => {
    form.reset({
      courseId: resource.courseId,
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

  const handleDelete = async (id: string) => {
    if (!sessionToken) return;
    setDeleting(id);
    try {
      await removeResource({
        token: sessionToken,
        resourceId: id as Id<"resources">,
      });
      toast.show("تم حذف المصدر", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleting(null);
    }
  };

  const courseOptions =
    courses?.map((c) => ({
      value: c._id,
      label: `${c.name} — ${c.majorName}`,
    })) ?? [];

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
          المصادر
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            إدارة المصادر
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {resources ? `${resources.length} مصدر` : "جاري التحميل..."}
          </p>
        </div>
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
          إضافة مصدر
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30"
        >
          <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
            {editingId ? "تعديل المصدر" : "إضافة مصدر جديد"}
          </h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                form={form}
                name="courseId"
                label="المادة *"
                options={courseOptions}
                placeholder="اختر المادة"
                disabled={!!editingId}
              />
              <FormInput form={form} name="title" label="عنوان المصدر *" />
              <FormSelect
                form={form}
                name="category"
                label="التصنيف *"
                options={CATEGORY_OPTIONS}
              />
              <div className="w-32">
                <FormInput
                  form={form}
                  name="order"
                  label="الترتيب"
                  type="number"
                  min="0"
                />
              </div>
            </div>

            {/* Type toggle */}
            <div>
              <label className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-300">
                نوع المصدر
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => form.setFieldValue("type", "link")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    resourceType === "link"
                      ? "bg-primary-600 text-white"
                      : "border border-surface-300 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  }`}
                >
                  رابط خارجي
                </button>
                <button
                  type="button"
                  onClick={() => form.setFieldValue("type", "richtext")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    resourceType === "richtext"
                      ? "bg-primary-600 text-white"
                      : "border border-surface-300 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  }`}
                >
                  نص منسق
                </button>
              </div>
            </div>

            {resourceType === "link" ? (
              <FormInput
                form={form}
                name="url"
                label="الرابط *"
                type="url"
                dir="ltr"
                placeholder="https://..."
              />
            ) : (
              <form.Field name="content">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
                      المحتوى *
                    </label>
                    <TiptapEditor
                      content={field.state.value}
                      onChange={(html) => field.handleChange(html)}
                    />
                    {field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0 && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                          {field.state.meta.errors
                            .map((e) =>
                              typeof e === "string"
                                ? e
                                : (e as { message?: string })?.message ??
                                  String(e),
                            )
                            .join(", ")}
                        </p>
                      )}
                  </div>
                )}
              </form.Field>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
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

      {/* List */}
      {resources === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
            لا توجد مصادر
          </p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
            أضف مصدرا جديدا للبدء
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource._id}
              className="group rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {resource.title}
                    </h3>
                    <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                      {CATEGORY_LABELS[resource.category as CategoryValue]}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        resource.type === "link"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                          : "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                      }`}
                    >
                      {resource.type === "link" ? "رابط" : "نص منسق"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                    <span>{resource.courseName}</span>
                    <span>{resource.majorName}</span>
                  </div>
                  {resource.type === "link" && resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="mt-1 block text-xs text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {resource.url}
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() =>
                      handleEdit(resource as Parameters<typeof handleEdit>[0])
                    }
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
                  <button
                    onClick={() => handleDelete(resource._id)}
                    disabled={deleting === resource._id}
                    className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="حذف"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
