"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { Toast, useToast } from "@/components/toast";

type FormData = {
  universityId: string;
  name: string;
  slug: string;
  order: string;
  alias: string;
};

const EMPTY_FORM: FormData = { universityId: "", name: "", slug: "", order: "0", alias: "" };

export default function AdminMajorsPage() {
  const { user, sessionToken } = useAuth();
  const toast = useToast();

  const majors = useQuery(
    api.dashboard.adminListMajors,
    user && sessionToken ? { token: sessionToken } : "skip"
  );
  const universities = useQuery(api.universities.list);

  const addMajor = useMutation(api.majors.add);
  const updateMajor = useMutation(api.majors.update);
  const removeMajor = useMutation(api.majors.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!user || user.role !== "admin") return null;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const generateSlug = (name: string) => name.trim().replace(/\s+/g, "-").toLowerCase();

  const handleEdit = (major: {
    _id: string;
    universityId: string;
    name: string;
    slug: string;
    order: number;
    alias?: string;
  }) => {
    setFormData({
      universityId: major.universityId,
      name: major.name,
      slug: major.slug,
      order: major.order.toString(),
      alias: major.alias ?? "",
    });
    setEditingId(major._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!sessionToken) return;
    setDeleting(id);
    try {
      await removeMajor({ token: sessionToken, majorId: id as Id<"majors"> });
      toast.show("تم حذف التخصص", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !formData.name.trim() || !formData.slug.trim() || !formData.universityId) return;
    setSaving(true);

    try {
      if (editingId) {
        await updateMajor({
          token: sessionToken,
          majorId: editingId as Id<"majors">,
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: Number(formData.order) || 0,
          alias: formData.alias.trim() || undefined,
        });
        toast.show("تم تحديث التخصص بنجاح", "success");
      } else {
        await addMajor({
          token: sessionToken,
          universityId: formData.universityId as Id<"universities">,
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: Number(formData.order) || 0,
          alias: formData.alias.trim() || undefined,
        });
        toast.show("تم إضافة التخصص بنجاح", "success");
      }
      resetForm();
    } catch (error) {
      const msg =
        error instanceof Error && error.message.includes("MAJOR_SLUG_EXISTS")
          ? "الرابط (slug) مستخدم بالفعل في هذه الجامعة"
          : "حدث خطأ أثناء الحفظ";
      toast.show(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Toast toast={toast} />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
        <Link href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">لوحة التحكم</Link>
        <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-surface-900 dark:text-surface-50">التخصصات</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">إدارة التخصصات</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {majors ? `${majors.length} تخصص` : "جاري التحميل..."}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          إضافة تخصص
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30">
          <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
            {editingId ? "تعديل التخصص" : "إضافة تخصص جديد"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">الجامعة *</label>
              <select
                value={formData.universityId}
                onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                required
                disabled={!!editingId}
              >
                <option value="">اختر الجامعة</option>
                {universities?.map((uni) => (
                  <option key={uni._id} value={uni._id}>{uni.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">اسم التخصص *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: editingId ? formData.slug : generateSlug(e.target.value) })}
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">الرابط (slug) *</label>
              <input
                type="text"
                dir="ltr"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">الاسم البديل (alias)</label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                placeholder="اسم بديل للبحث"
              />
            </div>
            <div>
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
            <button type="button" onClick={resetForm} className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {majors === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
          ))}
        </div>
      ) : majors.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">لا توجد تخصصات</p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">أضف تخصصا جديدا للبدء</p>
        </div>
      ) : (
        <div className="space-y-3">
          {majors.map((major) => (
            <div
              key={major._id}
              className="group flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                    {major.order}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">{major.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                      <span>{major.universityName}</span>
                      <span dir="ltr">/{major.slug}</span>
                      {major.alias && <span className="rounded bg-surface-100 px-1.5 py-0.5 dark:bg-surface-800">{major.alias}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(major)}
                  className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                  title="تعديل"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(major._id)}
                  disabled={deleting === major._id}
                  className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                  title="حذف"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
