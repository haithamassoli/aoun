"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Toast, useToast } from "@/components/toast";
import { FormInput } from "@/components/form-field";
import { universitySchema } from "@/lib/schemas";

const generateSlug = (name: string) =>
  name.trim().replace(/\s+/g, "-").toLowerCase();

export default function AdminUniversitiesPage() {
  const { user, sessionToken } = useAuth();
  const toast = useToast();

  const universities = useQuery(api.universities.list);

  const addUniversity = useMutation(api.universities.add);
  const updateUniversity = useMutation(api.universities.update);
  const removeUniversity = useMutation(api.universities.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", slug: "", logoUrl: "", order: "0", alias: "" },
    validators: { onChange: universitySchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        if (editingId) {
          await updateUniversity({
            token: sessionToken,
            universityId: editingId as Id<"universities">,
            name: value.name.trim(),
            slug: value.slug.trim(),
            logoUrl: value.logoUrl.trim() || undefined,
            order: Number(value.order) || 0,
            alias: value.alias.trim() || undefined,
          });
          toast.show("تم تحديث الجامعة بنجاح", "success");
        } else {
          await addUniversity({
            token: sessionToken,
            name: value.name.trim(),
            slug: value.slug.trim(),
            logoUrl: value.logoUrl.trim() || undefined,
            order: Number(value.order) || 0,
            alias: value.alias.trim() || undefined,
          });
          toast.show("تم إضافة الجامعة بنجاح", "success");
        }
        formApi.reset();
        setEditingId(null);
        setShowForm(false);
      } catch (error) {
        const msg =
          error instanceof Error &&
          error.message.includes("UNIVERSITY_SLUG_EXISTS")
            ? "الرابط (slug) مستخدم بالفعل"
            : "حدث خطأ أثناء الحفظ";
        toast.show(msg, "error");
      }
    },
  });

  if (!user || user.role !== "admin") return null;

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (uni: {
    _id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    order: number;
    alias?: string;
  }) => {
    form.reset({
      name: uni.name,
      slug: uni.slug,
      logoUrl: uni.logoUrl ?? "",
      order: uni.order.toString(),
      alias: uni.alias ?? "",
    });
    setEditingId(uni._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!sessionToken) return;
    setDeleting(id);
    try {
      await removeUniversity({
        token: sessionToken,
        universityId: id as Id<"universities">,
      });
      toast.show("تم حذف الجامعة", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleting(null);
    }
  };

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
          الجامعات
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            إدارة الجامعات
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {universities ? `${universities.length} جامعة` : "جاري التحميل..."}
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
          إضافة جامعة
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
            {editingId ? "تعديل الجامعة" : "إضافة جامعة جديدة"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              form={form}
              name="name"
              label="اسم الجامعة *"
              onChangeCallback={(val) => {
                if (!editingId) form.setFieldValue("slug", generateSlug(val));
              }}
            />
            <FormInput
              form={form}
              name="slug"
              label="الرابط (slug) *"
              dir="ltr"
            />
            <FormInput
              form={form}
              name="alias"
              label="الاسم البديل (alias)"
              placeholder="اسم بديل للبحث"
            />
            <FormInput
              form={form}
              name="logoUrl"
              label="رابط الشعار (URL)"
              type="url"
              dir="ltr"
              placeholder="https://..."
            />
            <FormInput
              form={form}
              name="order"
              label="الترتيب"
              type="number"
              min="0"
            />
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
      {universities === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
            />
          ))}
        </div>
      ) : universities.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
            لا توجد جامعات
          </p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
            أضف جامعة جديدة للبدء
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {universities.map((uni) => (
            <div
              key={uni._id}
              className="group flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                    {uni.order}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {uni.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                      <span dir="ltr">{uni.slug}</span>
                      {uni.alias && (
                        <span className="rounded bg-surface-100 px-1.5 py-0.5 dark:bg-surface-800">
                          {uni.alias}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(uni)}
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
                  onClick={() => handleDelete(uni._id)}
                  disabled={deleting === uni._id}
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
          ))}
        </div>
      )}
    </div>
  );
}
