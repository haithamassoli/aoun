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
import { motion } from "motion/react";
import { FormModal } from "@/components/form-modal";
import { generateSlug, normalizeSlug } from "@/lib/slug";

type QuickLinkInput = {
  title: string;
  url: string;
};

type UniversityListItem = {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  order: number;
  alias?: string;
  quickLinks: QuickLinkInput[];
};

const emptyQuickLink = (): QuickLinkInput => ({
  title: "",
  url: "",
});

const normalizeQuickLinks = (quickLinks: QuickLinkInput[]) =>
  quickLinks.flatMap((link) => {
    const title = link.title.trim();
    const url = link.url.trim();

    if (!title && !url) {
      return [];
    }

    return [{ title, url }];
  });

const getQuickLinksFieldErrors = (quickLinks: QuickLinkInput[]) => {
  const parsed = universitySchema.safeParse({
    name: "temp",
    slug: "temp",
    logoUrl: "",
    order: "0",
    alias: "",
    quickLinks,
  });

  const errors = new Map<
    number,
    Partial<Record<keyof QuickLinkInput, string>>
  >();

  if (parsed.success) {
    return errors;
  }

  for (const issue of parsed.error.issues) {
    if (
      issue.path[0] !== "quickLinks" ||
      typeof issue.path[1] !== "number" ||
      (issue.path[2] !== "title" && issue.path[2] !== "url")
    ) {
      continue;
    }

    const index = issue.path[1];
    const field = issue.path[2];
    const existing = errors.get(index) ?? {};
    if (!existing[field]) {
      existing[field] = issue.message;
      errors.set(index, existing);
    }
  }

  return errors;
};

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
  const [quickLinks, setQuickLinks] = useState<QuickLinkInput[]>([]);

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      logoUrl: "",
      order: "0",
      alias: "",
      quickLinks: [] as QuickLinkInput[],
    },
    validators: { onChange: universitySchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;

      const normalizedQuickLinks = normalizeQuickLinks(value.quickLinks);

      try {
        if (editingId) {
          await updateUniversity({
            token: sessionToken,
            universityId: editingId as Id<"universities">,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            logoUrl: value.logoUrl.trim() || undefined,
            order: Number(value.order) || 0,
            alias: value.alias.trim() || undefined,
            quickLinks: normalizedQuickLinks,
          });
          toast.show("تم تحديث الجامعة بنجاح", "success");
        } else {
          await addUniversity({
            token: sessionToken,
            name: value.name.trim(),
            slug: normalizeSlug(value.slug),
            logoUrl: value.logoUrl.trim() || undefined,
            order: Number(value.order) || 0,
            alias: value.alias.trim() || undefined,
            quickLinks: normalizedQuickLinks,
          });
          toast.show("تم إضافة الجامعة بنجاح", "success");
        }

        formApi.reset();
        setQuickLinks([]);
        setEditingId(null);
        setShowForm(false);
      } catch (error) {
        const message =
          error instanceof Error &&
          error.message.includes("UNIVERSITY_SLUG_EXISTS")
            ? "الرابط (slug) مستخدم بالفعل"
            : error instanceof Error &&
                error.message.includes("UNIVERSITY_QUICK_LINK_INVALID")
              ? "تحقق من الروابط السريعة: كل رابط يحتاج عنواناً ورابطاً صحيحاً"
              : "حدث خطأ أثناء الحفظ";
        toast.show(message, "error");
      }
    },
  });

  if (!user || user.role !== "admin") return null;

  const syncQuickLinks = (nextQuickLinks: QuickLinkInput[]) => {
    setQuickLinks(nextQuickLinks);
    form.setFieldValue("quickLinks", nextQuickLinks);
  };

  const resetForm = () => {
    form.reset();
    setQuickLinks([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (uni: UniversityListItem) => {
    const nextQuickLinks = uni.quickLinks.map((link) => ({
      title: link.title,
      url: link.url,
    }));

    form.reset(
      {
        name: uni.name,
        slug: uni.slug,
        logoUrl: uni.logoUrl ?? "",
        order: uni.order.toString(),
        alias: uni.alias ?? "",
        quickLinks: nextQuickLinks,
      },
      { keepDefaultValues: true },
    );
    setQuickLinks(nextQuickLinks);
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

  const addQuickLinkRow = () => {
    syncQuickLinks([...quickLinks, emptyQuickLink()]);
  };

  const updateQuickLink = (
    index: number,
    field: keyof QuickLinkInput,
    nextValue: string,
  ) => {
    syncQuickLinks(
      quickLinks.map((link, currentIndex) =>
        currentIndex === index ? { ...link, [field]: nextValue } : link,
      ),
    );
  };

  const removeQuickLink = (index: number) => {
    syncQuickLinks(
      quickLinks.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const moveQuickLink = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= quickLinks.length) {
      return;
    }

    const nextQuickLinks = [...quickLinks];
    const [item] = nextQuickLinks.splice(index, 1);
    nextQuickLinks.splice(targetIndex, 0, item);
    syncQuickLinks(nextQuickLinks);
  };

  const quickLinkErrors = getQuickLinksFieldErrors(quickLinks);

  return (
    <div>
      <Toast toast={toast} />

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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            إدارة الجامعات
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {universities ? `${universities.length} جامعة` : "جاري التحميل..."}
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
          إضافة جامعة
        </button>
      </motion.div>

      <FormModal
        open={showForm}
        title={editingId ? "تعديل الجامعة" : "إضافة جامعة جديدة"}
        onClose={resetForm}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              form={form}
              name="name"
              label="اسم الجامعة *"
              onChangeCallback={(value) => {
                if (!editingId) form.setFieldValue("slug", generateSlug(value));
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

          <div className="mt-5 rounded-2xl border border-surface-200 bg-white/90 p-4 dark:border-surface-700 dark:bg-surface-900/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                  الروابط السريعة
                </h4>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  تظهر هذه الروابط في شريط الجامعة داخل صفحات الجامعة والتخصصات
                  والمواد.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuickLinkRow}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-primary-900 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:border-primary-800 dark:hover:bg-primary-900/70"
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
                إضافة رابط
              </button>
            </div>

            {quickLinks.length > 0 ? (
              <div className="mt-4 space-y-3">
                {quickLinks.map((quickLink, index) => {
                  const rowErrors = quickLinkErrors.get(index);
                  const titleInputId = `quick-link-${index}-title`;
                  const urlInputId = `quick-link-${index}-url`;

                  return (
                    <div
                      key={`${index}-${quickLink.title}-${quickLink.url}`}
                      className="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-700 dark:bg-surface-950/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                          رابط #{index + 1}
                        </p>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveQuickLink(index, -1)}
                            disabled={index === 0}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition-colors hover:border-surface-300 hover:bg-white hover:text-surface-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-700 dark:hover:bg-surface-900 dark:hover:text-surface-200"
                            aria-label="تحريك الرابط للأعلى"
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
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuickLink(index, 1)}
                            disabled={index === quickLinks.length - 1}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition-colors hover:border-surface-300 hover:bg-white hover:text-surface-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-700 dark:hover:bg-surface-900 dark:hover:text-surface-200"
                            aria-label="تحريك الرابط للأسفل"
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
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuickLink(index)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-red-900/60 dark:hover:bg-red-950/50"
                            aria-label="حذف الرابط"
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

                      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
                        <div>
                          <label
                            htmlFor={titleInputId}
                            className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300"
                          >
                            العنوان
                          </label>
                          <input
                            id={titleInputId}
                            type="text"
                            value={quickLink.title}
                            onChange={(event) =>
                              updateQuickLink(
                                index,
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder="مثال: خدمات الطالب"
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-surface-800 dark:text-surface-100 ${
                              rowErrors?.title
                                ? "border-red-400 dark:border-red-600"
                                : "border-surface-300 dark:border-surface-600"
                            }`}
                          />
                          {rowErrors?.title && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                              {rowErrors.title}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={urlInputId}
                            className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300"
                          >
                            الرابط
                          </label>
                          <input
                            id={urlInputId}
                            type="url"
                            dir="ltr"
                            value={quickLink.url}
                            onChange={(event) =>
                              updateQuickLink(index, "url", event.target.value)
                            }
                            placeholder="https://..."
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-surface-800 dark:text-surface-100 ${
                              rowErrors?.url
                                ? "border-red-400 dark:border-red-600"
                                : "border-surface-300 dark:border-surface-600"
                            }`}
                          />
                          {rowErrors?.url && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                              {rowErrors.url}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-surface-200 bg-surface-50/80 px-4 py-6 text-center dark:border-surface-700 dark:bg-surface-950/50">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  لا توجد روابط سريعة بعد
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  أضف روابط مثل الجدول الدراسي أو خدمات الطالب لكل جامعة.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغاء
            </button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
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

      {universities === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
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
          {(universities as UniversityListItem[]).map((uni, index) => (
            <motion.div
              key={uni._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
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
                    <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                      <span dir="ltr">{uni.slug}</span>
                      {uni.alias && (
                        <span className="rounded bg-surface-100 px-1.5 py-0.5 dark:bg-surface-800">
                          {uni.alias}
                        </span>
                      )}
                      {uni.quickLinks.length > 0 && (
                        <span className="rounded bg-primary-50 px-1.5 py-0.5 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300">
                          {uni.quickLinks.length} روابط سريعة
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ">
                <button
                  type="button"
                  aria-label={`تعديل ${uni.name}`}
                  onClick={() => handleEdit(uni as UniversityListItem)}
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
                  type="button"
                  aria-label={`حذف ${uni.name}`}
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
