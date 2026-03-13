"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/auth-provider";
import { FormInput } from "@/components/form-field";
import { TiptapEditor } from "@/components/tiptap-editor";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { newsSchema } from "@/lib/schemas";

type NewsFormProps = {
  majorId: Id<"majors">;
  editingId: string | null;
  initialValues?: { title: string; content: string };
  onSuccess: () => void;
  onCancel: () => void;
  showToast: (message: string, type: "success" | "error") => void;
};

export function NewsForm({
  majorId,
  editingId,
  initialValues,
  onSuccess,
  onCancel,
  showToast,
}: NewsFormProps) {
  const { sessionToken } = useAuth();
  const addNews = useMutation(api.news.add);
  const updateNews = useMutation(api.news.update);

  const form = useForm({
    defaultValues: {
      title: initialValues?.title ?? "",
      content: initialValues?.content ?? "",
    },
    validators: { onChange: newsSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        const sanitizedContent = sanitizeRichText(value.content);
        if (editingId) {
          await updateNews({
            token: sessionToken,
            newsId: editingId as Id<"news">,
            title: value.title.trim(),
            content: sanitizedContent,
          });
          showToast("تم تحديث الخبر بنجاح", "success");
        } else {
          await addNews({
            token: sessionToken,
            majorId,
            title: value.title.trim(),
            content: sanitizedContent,
          });
          showToast("تم إضافة الخبر بنجاح", "success");
        }
        formApi.reset();
        onSuccess();
      } catch {
        showToast("حدث خطأ أثناء الحفظ", "error");
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30"
    >
      <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
        {editingId ? "تعديل الخبر" : "إضافة خبر جديد"}
      </h3>
      <div className="space-y-4">
        <FormInput form={form} name="title" label="العنوان *" />

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
                          : ((e as { message?: string })?.message ?? String(e)),
                      )
                      .join(", ")}
                  </p>
                )}
            </div>
          )}
        </form.Field>
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
          onClick={onCancel}
          className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
