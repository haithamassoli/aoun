"use client";

import { useAuth } from "@/components/auth-provider";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { Toast, useToast } from "@/components/toast";

type EditUserFormData = {
  name: string;
  email: string;
  role: "admin" | "contributor";
};

type CreateUserFormData = EditUserFormData & {
  password: string;
};

const EMPTY_EDIT_FORM: EditUserFormData = {
  name: "",
  email: "",
  role: "contributor",
};

const EMPTY_CREATE_FORM: CreateUserFormData = {
  name: "",
  email: "",
  password: "",
  role: "contributor",
};

export default function AdminUsersPage() {
  const { user, sessionToken } = useAuth();
  const toast = useToast();

  const users = useQuery(
    api.auth.listUsers,
    user && sessionToken ? { token: sessionToken } : "skip",
  );
  const majors = useQuery(
    api.dashboard.adminListMajors,
    user && sessionToken ? { token: sessionToken } : "skip",
  );

  const updateUser = useMutation(api.auth.updateUser);
  const deleteUser = useMutation(api.auth.deleteUser);
  const addPermission = useMutation(api.auth.addPermission);
  const removePermission = useMutation(api.auth.removePermission);
  const createUser = useAction(api.authActions.createUser);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserFormData>(EMPTY_EDIT_FORM);
  const [createFormData, setCreateFormData] = useState<CreateUserFormData>(EMPTY_CREATE_FORM);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Permission management
  const [managingPermsFor, setManagingPermsFor] = useState<string | null>(null);
  const [selectedMajorId, setSelectedMajorId] = useState("");

  const userPermissions = useQuery(
    api.auth.getUserPermissions,
    managingPermsFor && sessionToken
      ? { token: sessionToken, userId: managingPermsFor as Id<"users"> }
      : "skip",
  );

  if (!user || user.role !== "admin") return null;

  const resetEditForm = () => {
    setEditFormData(EMPTY_EDIT_FORM);
    setEditingId(null);
  };

  const handleEdit = (u: {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "contributor";
  }) => {
    setEditFormData({ name: u.name, email: u.email, role: u.role });
    setEditingId(u._id);
    setManagingPermsFor(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    setCreating(true);

    try {
      await createUser({
        token: sessionToken,
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        password: createFormData.password,
        role: createFormData.role,
      });
      setCreateFormData(EMPTY_CREATE_FORM);
      toast.show("تم إنشاء المستخدم بنجاح", "success");
    } catch (error) {
      const msg =
        error instanceof Error && error.message.includes("EMAIL_ALREADY_EXISTS")
          ? "البريد الإلكتروني مستخدم بالفعل"
          : error instanceof Error && error.message.includes("WEAK_PASSWORD")
            ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            : "حدث خطأ أثناء إنشاء المستخدم";
      toast.show(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!sessionToken) return;
    setDeleting(userId);
    try {
      await deleteUser({ token: sessionToken, userId: userId as Id<"users"> });
      toast.show("تم حذف المستخدم", "success");
    } catch (error) {
      const msg =
        error instanceof Error && error.message.includes("CANNOT_DELETE_SELF")
          ? "لا يمكنك حذف حسابك"
          : "حدث خطأ أثناء الحذف";
      toast.show(msg, "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !editingId) return;
    setSaving(true);

    try {
      await updateUser({
        token: sessionToken,
        userId: editingId as Id<"users">,
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        role: editFormData.role,
      });
      toast.show("تم تحديث المستخدم بنجاح", "success");
      resetEditForm();
    } catch (error) {
      const msg =
        error instanceof Error && error.message.includes("EMAIL_ALREADY_EXISTS")
          ? "البريد الإلكتروني مستخدم بالفعل"
          : "حدث خطأ أثناء الحفظ";
      toast.show(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPermission = async () => {
    if (!sessionToken || !managingPermsFor || !selectedMajorId) return;
    try {
      await addPermission({
        token: sessionToken,
        userId: managingPermsFor as Id<"users">,
        majorId: selectedMajorId as Id<"majors">,
      });
      setSelectedMajorId("");
      toast.show("تم إضافة الصلاحية", "success");
    } catch (error) {
      const msg =
        error instanceof Error &&
        error.message.includes("PERMISSION_ALREADY_EXISTS")
          ? "الصلاحية موجودة بالفعل"
          : "حدث خطأ";
      toast.show(msg, "error");
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!sessionToken) return;
    try {
      await removePermission({
        token: sessionToken,
        permissionId: permissionId as Id<"permissions">,
      });
      toast.show("تم إزالة الصلاحية", "success");
    } catch {
      toast.show("حدث خطأ", "error");
    }
  };

  const getMajorName = (majorId: string) => {
    const major = majors?.find((m) => m._id === majorId);
    return major ? `${major.name} — ${major.universityName}` : majorId;
  };

  // Filter out already-assigned majors from the picker
  const assignedMajorIds = new Set(
    userPermissions?.map((p) => p.majorId) ?? [],
  );
  const availableMajors =
    majors?.filter((m) => !assignedMajorIds.has(m._id)) ?? [];

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
          المستخدمون
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
          إدارة المستخدمين
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {users ? `${users.length} مستخدم` : "جاري التحميل..."}
        </p>
      </div>

      <form
        onSubmit={handleCreateSubmit}
        className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-800 dark:bg-emerald-950/30"
      >
        <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
          إضافة مستخدم جديد
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              الاسم *
            </label>
            <input
              type="text"
              value={createFormData.name}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, name: e.target.value })
              }
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              dir="ltr"
              value={createFormData.email}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, email: e.target.value })
              }
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              كلمة المرور *
            </label>
            <input
              type="password"
              dir="ltr"
              minLength={8}
              value={createFormData.password}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, password: e.target.value })
              }
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
              الدور *
            </label>
            <select
              value={createFormData.role}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  role: e.target.value as "admin" | "contributor",
                })
              }
              className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
            >
              <option value="admin">مدير</option>
              <option value="contributor">مساهم</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? "جاري الإنشاء..." : "إنشاء مستخدم"}
          </button>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            للمساهمين، قم بإضافة الصلاحيات بعد الإنشاء.
          </p>
        </div>
      </form>

      {/* Edit form */}
      {editingId && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30"
        >
          <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
            تعديل المستخدم
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
                الاسم *
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                dir="ltr"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-300">
                الدور *
              </label>
              <select
                value={editFormData.role}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    role: e.target.value as "admin" | "contributor",
                  })
                }
                className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              >
                <option value="admin">مدير</option>
                <option value="contributor">مساهم</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "تحديث"}
            </button>
            <button
              type="button"
              onClick={resetEditForm}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Permission management panel */}
      {managingPermsFor && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/30 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
              صلاحيات: {users?.find((u) => u._id === managingPermsFor)?.name}
            </h3>
            <button
              onClick={() => setManagingPermsFor(null)}
              className="rounded-lg p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
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

          {/* Current permissions */}
          {userPermissions === undefined ? (
            <p className="text-xs text-surface-500">جاري التحميل...</p>
          ) : userPermissions.length === 0 ? (
            <p className="mb-3 text-xs text-surface-500 dark:text-surface-400">
              لا توجد صلاحيات
            </p>
          ) : (
            <div className="mb-3 space-y-2">
              {userPermissions.map((perm) => (
                <div
                  key={perm._id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-surface-800"
                >
                  <span className="text-surface-700 dark:text-surface-200">
                    {getMajorName(perm.majorId)}
                  </span>
                  <button
                    onClick={() => handleRemovePermission(perm._id)}
                    className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    title="إزالة"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add permission */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMajorId}
              onChange={(e) => setSelectedMajorId(e.target.value)}
              className="flex-1 rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
            >
              <option value="">اختر تخصص</option>
              {availableMajors.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} — {m.universityName}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddPermission}
              disabled={!selectedMajorId}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {users === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
            لا يوجد مستخدمون
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u._id}
              className="group flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {u.name}
                      </h3>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          u.role === "admin"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        }`}
                      >
                        {u.role === "admin" ? "مدير" : "مساهم"}
                      </span>
                    </div>
                    <p
                      dir="ltr"
                      className="text-xs text-surface-500 dark:text-surface-400"
                    >
                      {u.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {u.role === "contributor" && (
                  <button
                    onClick={() => {
                      setManagingPermsFor(u._id);
                      setEditingId(null);
                      setSelectedMajorId("");
                    }}
                    className="rounded-lg p-1.5 text-amber-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950 dark:hover:text-amber-400"
                    title="الصلاحيات"
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
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleEdit(u);
                    setManagingPermsFor(null);
                  }}
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
                  onClick={() => handleDelete(u._id)}
                  disabled={deleting === u._id || u._id === user._id}
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
