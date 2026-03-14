"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/auth-provider";

type SendNotificationFormProps = {
  majorId?: Id<"majors">;
  showToast: (message: string, type: "success" | "error") => void;
};

export function SendNotificationForm({
  majorId,
  showToast,
}: SendNotificationFormProps) {
  const { sessionToken } = useAuth();
  const sendCustom = useAction(api.notifications.sendCustom);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminMajors = useQuery(
    api.dashboard.adminListMajors,
    !majorId && sessionToken ? { token: sessionToken } : "skip",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      const targetMajorId = (majorId ?? selectedMajorId) || undefined;
      const result = await sendCustom({
        token: sessionToken,
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
        majorId: targetMajorId || undefined,
      });
      showToast(`تم إرسال ${result.sent} إشعار بنجاح`, "success");
      setTitle("");
      setBody("");
      setUrl("");
      setSelectedMajorId("");
    } catch {
      showToast("حدث خطأ أثناء إرسال الإشعار", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!majorId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
            الجهة المستهدفة
          </label>
          <select
            value={selectedMajorId}
            onChange={(e) => setSelectedMajorId(e.target.value)}
            className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-50"
          >
            <option value="">جميع المشتركين</option>
            {adminMajors?.map((major) => (
              <option key={major._id} value={major._id}>
                {major.name} — {major.universityName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
          عنوان الإشعار *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="عنوان الإشعار"
          className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-50 dark:placeholder-surface-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
          نص الإشعار *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={3}
          placeholder="نص الإشعار الذي سيظهر للمشتركين"
          className="w-full resize-none rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-50 dark:placeholder-surface-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
          الرابط (اختياري)
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          dir="ltr"
          className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-50 dark:placeholder-surface-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !title.trim() || !body.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? (
          "جاري الإرسال..."
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            إرسال الإشعار
          </>
        )}
      </button>
    </form>
  );
}
