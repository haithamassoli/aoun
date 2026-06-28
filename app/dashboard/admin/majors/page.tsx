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
import { majorSchema } from "@/lib/schemas";
import { motion } from "motion/react";
import { FormModal } from "@/components/form-modal";
import { generateSlug, normalizeSlug } from "@/lib/slug";
import { normalizeAlias } from "@/lib/alias";
import {
  PUBLIC_CACHE_TAG_GROUPS,
  revalidatePublicCache,
} from "@/lib/public-cache";

type MajorListItem = {
  _id: string;
  universityId: string;
  name: string;
  slug: string;
  order: number;
  universityName: string;
  alias?: string;
  treeDiagramUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    facebookGroup?: string;
    faculty?: string;
    telegram?: string;
  };
};

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

export default function AdminMajorsPage() {
  const { user, sessionToken } = useAuth();
  const toast = useToast();

  const majors = useQuery(
    api.dashboard.adminListMajors,
    user && sessionToken ? { token: sessionToken } : "skip",
  );
  const universities = useQuery(api.universities.list);

  const addMajor = useMutation(api.majors.add);
  const updateMajor = useMutation(api.majors.update);
  const removeMajor = useMutation(api.majors.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      universityId: "",
      name: "",
      slug: "",
      order: "0",
      alias: "",
      treeDiagramUrl: "",
      instagram: "",
      facebook: "",
      facebookGroup: "",
      faculty: "",
      telegram: "",
    },
    validators: { onChange: majorSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        if (editingId) {
          await updateMajor({
            token: sessionToken,
            majorId: editingId as Id<"majors">,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            order: Number(value.order) || 0,
            alias: normalizeAlias(value.alias) || undefined,
            treeDiagramUrl: value.treeDiagramUrl.trim() || undefined,
            socialLinks: buildSocialLinks(value),
          });
          await revalidatePublicCache(
            sessionToken,
            PUBLIC_CACHE_TAG_GROUPS.majors,
          );
          toast.show("تم تحديث التخصص بنجاح", "success");
        } else {
          await addMajor({
            token: sessionToken,
            universityId: value.universityId as Id<"universities">,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            order: Number(value.order) || 0,
            alias: normalizeAlias(value.alias) || undefined,
            treeDiagramUrl: value.treeDiagramUrl.trim() || undefined,
            socialLinks: buildSocialLinks(value),
          });
          await revalidatePublicCache(
            sessionToken,
            PUBLIC_CACHE_TAG_GROUPS.majors,
          );
          toast.show("تم إضافة التخصص بنجاح", "success");
        }
        formApi.reset();
        setEditingId(null);
        setShowForm(false);
      } catch (error) {
        const msg =
          error instanceof Error && error.message.includes("MAJOR_SLUG_EXISTS")
            ? "الرابط (slug) مستخدم بالفعل في هذه الجامعة"
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

  const handleEdit = (major: MajorListItem) => {
    form.reset(
      {
        universityId: major.universityId,
        name: major.name,
        slug: major.slug,
        order: major.order.toString(),
        alias: normalizeAlias(major.alias ?? ""),
        treeDiagramUrl: major.treeDiagramUrl ?? "",
        instagram: major.socialLinks?.instagram ?? "",
        facebook: major.socialLinks?.facebook ?? "",
        facebookGroup: major.socialLinks?.facebookGroup ?? "",
        faculty: major.socialLinks?.faculty ?? "",
        telegram: major.socialLinks?.telegram ?? "",
      },
      { keepDefaultValues: true },
    );
    setEditingId(major._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!sessionToken) return;
    setDeleting(id);
    try {
      await removeMajor({ token: sessionToken, majorId: id as Id<"majors"> });
      await revalidatePublicCache(
        sessionToken,
        PUBLIC_CACHE_TAG_GROUPS.majors,
      );
      toast.show("تم حذف التخصص", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleting(null);
    }
  };

  const universityOptions =
    universities?.map((u: { _id: Id<"universities">; name: string }) => ({
      value: u._id,
      label: u.name,
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
          التخصصـات
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
            إدارة التخصصـات
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {majors ? `${majors.length} تخصـص` : "جاري التحميـل..."}
          </p>
        </div>
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
          إضافة تخصـص
        </button>
      </motion.div>

      <FormModal
        open={showForm}
        title={editingId ? "تعديل التخصـص" : "إضافة تخصص جديـد"}
        onClose={resetForm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Basic Info Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
                <svg
                  className="h-4 w-4 text-primary-600 dark:text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                المعلومات الأساسيـة
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                form={form}
                name="universityId"
                label="الجامعـة *"
                options={universityOptions}
                placeholder="اختر الجامعـة"
                disabled={!!editingId}
              />
              <FormInput
                form={form}
                name="name"
                label="اسم التخصـص *"
                onChangeCallback={(val) => {
                  if (!editingId) form.setFieldValue("slug", generateSlug(val));
                }}
              />
              <FormInput
                form={form}
                name="slug"
                label="الرابـط (slug) *"
                dir="ltr"
              />
              <FormInput
                form={form}
                name="alias"
                label="الاسم البديـل (alias)"
                placeholder="اسم بديل للبحـث"
              />
              <FormInput
                form={form}
                name="order"
                label="الترتـيب"
                type="number"
                min="0"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-surface-200 dark:border-surface-700" />

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
              form={form}
              name="treeDiagramUrl"
              label="رابط شجرة المسـار"
              placeholder="https://drive.google.com/..."
              dir="ltr"
            />
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
                form={form}
                name="instagram"
                label="Instagram"
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
              <FormInput
                form={form}
                name="facebook"
                label="Facebook Page"
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
              <FormInput
                form={form}
                name="facebookGroup"
                label="Facebook Group"
                placeholder="https://facebook.com/groups/..."
                dir="ltr"
              />
              <FormInput
                form={form}
                name="faculty"
                label="Faculty"
                placeholder="https://..."
                dir="ltr"
              />
              <FormInput
                form={form}
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
                      {editingId ? "تحديث التخصـص" : "إضافة التخصـص"}
                    </>
                  )}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </FormModal>

      {/* List */}
      {majors === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
            />
          ))}
        </div>
      ) : majors.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
            لا توجد تخصصـات
          </p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
            أضف تخصص جديد للبـدء
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(majors as MajorListItem[]).map((major, index) => (
            <motion.div
              key={major._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
              className="group rounded-2xl border border-surface-200 bg-white shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
            >
              {/* Mobile View */}
              <div className="flex flex-col p-4 sm:hidden">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                    {major.order}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-sm font-bold leading-snug text-surface-900 dark:text-surface-50">
                      {major.name}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {major.universityName}
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-surface-100 px-2 py-0.5 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300" dir="ltr">
                    /{major.slug}
                  </span>
                  {major.alias && (
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      {major.alias}
                    </span>
                  )}
                </div>

                {major.treeDiagramUrl && (
                  <a
                    href={major.treeDiagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="16" y="16" width="6" height="6" rx="1.5" />
                      <rect x="2" y="16" width="6" height="6" rx="1.5" />
                      <rect x="9" y="2" width="6" height="6" rx="1.5" />
                      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                      <path d="M12 12V8" />
                    </svg>
                    شجرة المسـار الدراسي
                  </a>
                )}

                <div className="flex items-center gap-2 border-t border-surface-100 pt-3 dark:border-surface-800">
                  <Link
                    href={`/dashboard/major/${major._id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-950"
                    aria-label={`إدارة فصول ومواد ${major.name}`}
                  >
                    الفصول والمـواد
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleEdit(major)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    تعديـل
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(major._id)}
                    disabled={deleting === major._id}
                    className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
                    aria-label={`حذف ${major.name}`}
                  >
                    {deleting === major._id ? (
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
                    ) : (
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
                    )}
                  </button>
                </div>
              </div>

              {/* Tablet & Desktop View */}
              <div className="hidden items-center justify-between p-4 sm:flex">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                    {major.order}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {major.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                      <span>{major.universityName}</span>
                      <span dir="ltr">/{major.slug}</span>
                      {major.alias && (
                        <span className="rounded bg-surface-100 px-1.5 py-0.5 dark:bg-surface-800">
                          {major.alias}
                        </span>
                      )}
                      {major.treeDiagramUrl && (
                        <a
                          href={major.treeDiagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                          title="شجرة المسار"
                        >
                          <svg
                            className="h-2.5 w-2.5 shrink-0"
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
                          شجرة المسـار
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/major/${major._id}`}
                    className="rounded-lg p-1.5 text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-950 dark:hover:text-primary-300"
                    title="الفصول والمواد"
                    aria-label={`إدارة فصول ومواد ${major.name}`}
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
                        d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleEdit(major)}
                    className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                    title="تعديل"
                    aria-label={`تعديل ${major.name}`}
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
                    onClick={() => handleDelete(major._id)}
                    disabled={deleting === major._id}
                    className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="حذف"
                    aria-label={`حذف ${major.name}`}
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
