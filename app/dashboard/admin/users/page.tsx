"use client";

import { useAuth } from "@/components/auth-provider";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Toast, useToast } from "@/components/toast";
import { FormInput, FormSelect } from "@/components/form-field";
import { createUserSchema, editUserSchema } from "@/lib/schemas";
import { motion } from "motion/react";
import { FormModal } from "@/components/form-modal";

const ROLE_OPTIONS = [
  { value: "admin", label: "مديـر" },
  { value: "contributor", label: "مساهـم" },
];

type UserListItem = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "contributor";
};

type MajorPermissionOption = {
  _id: Id<"majors">;
  name: string;
  universityName: string;
};

type UserPermissionItem = {
  _id: Id<"permissions">;
  majorId: Id<"majors">;
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

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const createForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "contributor" as "admin" | "contributor",
    },
    validators: { onChange: createUserSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        await createUser({
          token: sessionToken,
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
          role: value.role,
        });
        formApi.reset();
        setShowCreateForm(false);
        toast.show("تم إنشاء المستخدم بنجاح", "success");
      } catch (error) {
        const msg =
          error instanceof Error &&
          error.message.includes("EMAIL_ALREADY_EXISTS")
            ? "البريد الإلكتروني مستخدم بالفعل"
            : error instanceof Error && error.message.includes("WEAK_PASSWORD")
              ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
              : "حدث خطأ أثناء إنشاء المستخدم";
        toast.show(msg, "error");
      }
    },
  });

  const editForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "contributor" as "admin" | "contributor",
    },
    validators: { onChange: editUserSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken || !editingId) return;
      try {
        await updateUser({
          token: sessionToken,
          userId: editingId as Id<"users">,
          name: value.name.trim(),
          email: value.email.trim(),
          role: value.role,
        });
        toast.show("تم تحديث المستخدم بنجاح", "success");
        formApi.reset();
        setEditingId(null);
      } catch (error) {
        const msg =
          error instanceof Error &&
          error.message.includes("EMAIL_ALREADY_EXISTS")
            ? "البريد الإلكتروني مستخدم بالفعل"
            : "حدث خطأ أثناء الحفظ";
        toast.show(msg, "error");
      }
    },
  });

  if (!user || user.role !== "admin") return null;

  const resetEditForm = () => {
    editForm.reset();
    setEditingId(null);
  };

  const handleEdit = (u: {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "contributor";
  }) => {
    editForm.reset(
      { name: u.name, email: u.email, role: u.role },
      { keepDefaultValues: true },
    );
    setEditingId(u._id);
    setManagingPermsFor(null);
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
    const major = (majors as MajorPermissionOption[] | undefined)?.find(
      (m) => m._id === majorId,
    );
    return major ? `${major.name} — ${major.universityName}` : majorId;
  };

  const assignedMajorIds = new Set(
    (userPermissions as UserPermissionItem[] | undefined)?.map(
      (p) => p.majorId,
    ) ?? [],
  );
  const availableMajors =
    (majors as MajorPermissionOption[] | undefined)?.filter(
      (m) => !assignedMajorIds.has(m._id),
    ) ?? [];
  const permissionSelectId = "permission-major-select";

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
          المستخدمـون
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
            إدارة المستخدمـين
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {users ? `${users.length} مستخـدم` : "جاري التحميـل..."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
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
          إضافة مستخـدم
        </button>
      </motion.div>

      <FormModal
        open={showCreateForm}
        title="إضافة مستخدم جديـد"
        onClose={() => {
          createForm.reset();
          setShowCreateForm(false);
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            createForm.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput form={createForm} name="name" label="الاسـم *" />
            <FormInput
              form={createForm}
              name="email"
              label="البريد الإلكترونـي *"
              type="email"
              dir="ltr"
            />
            <FormInput
              form={createForm}
              name="password"
              label="كلمة المـرور *"
              type="password"
              dir="ltr"
            />
            <FormSelect
              form={createForm}
              name="role"
              label="الـدور *"
              options={ROLE_OPTIONS}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <createForm.Subscribe
              selector={(s) => [s.canSubmit, s.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الإنشـاء..." : "إنشاء مستخـدم"}
                </button>
              )}
            </createForm.Subscribe>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              للمساهمين، قم بإضافة الصلاحيـات بعد الإنشاء.
            </p>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={editingId !== null}
        title="تعديل المستخـدم"
        onClose={resetEditForm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editForm.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput form={editForm} name="name" label="الاسـم *" />
            <FormInput
              form={editForm}
              name="email"
              label="البريد الإلكترونـي *"
              type="email"
              dir="ltr"
            />
            <FormSelect
              form={editForm}
              name="role"
              label="الـدور *"
              options={ROLE_OPTIONS}
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetEditForm}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغـاء
            </button>
            <editForm.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الحـفظ..." : "تحـديث"}
                </button>
              )}
            </editForm.Subscribe>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={managingPermsFor !== null}
        title={`صلاحيـات: ${
          (users as UserListItem[] | undefined)?.find(
            (u) => u._id === managingPermsFor,
          )?.name ?? ""
        }`}
        onClose={() => setManagingPermsFor(null)}
      >
        <div className="space-y-4">
          {/* Add Permission Section */}
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
            <label
              htmlFor={permissionSelectId}
              className="mb-2 block text-xs font-medium text-surface-700 dark:text-surface-300"
            >
              إضافة صلاحية جديـدة
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                id={permissionSelectId}
                value={selectedMajorId}
                onChange={(e) => setSelectedMajorId(e.target.value)}
                className="flex-1 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-100"
              >
                <option value="">اختر تخصصـا...</option>
                {availableMajors.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} — {m.universityName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddPermission}
                disabled={!selectedMajorId}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                إضـافة
              </button>
            </div>
          </div>

          {/* Current Permissions Section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-surface-900 dark:text-surface-50">
                الصلاحيات الحاليـة
              </h3>
              {userPermissions && userPermissions.length > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {userPermissions.length}
                </span>
              )}
            </div>

            {userPermissions === undefined ? (
              <div className="flex items-center justify-center rounded-xl border border-surface-200 bg-white p-8 dark:border-surface-700 dark:bg-surface-900">
                <div className="flex items-center gap-2 text-sm text-surface-500">
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
                  جاري التحميـل...
                </div>
              </div>
            ) : userPermissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-50 p-8 dark:border-surface-600 dark:bg-surface-800/30">
                <svg
                  className="mb-2 h-10 w-10 text-surface-400 dark:text-surface-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  لا توجد صلاحيـات
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-500">
                  قم بإضافة صلاحية من الأعلـى
                </p>
              </div>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900">
                {(userPermissions as UserPermissionItem[]).map((perm) => (
                  <div
                    key={perm._id}
                    className="group flex items-start justify-between gap-3 rounded-lg border border-surface-100 bg-surface-50 p-3 transition-all hover:border-surface-200 hover:shadow-sm dark:border-surface-700 dark:bg-surface-800 dark:hover:border-surface-600"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-100 dark:bg-primary-950">
                        <svg
                          className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span className="min-w-0 break-words text-sm leading-relaxed text-surface-700 dark:text-surface-200">
                        {getMajorName(perm.majorId)}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={`إزالة صلاحية ${getMajorName(perm.majorId)}`}
                      onClick={() => handleRemovePermission(perm._id)}
                      className="shrink-0 rounded-md p-1.5 text-surface-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950 dark:hover:text-red-400"
                      title="إزالة الصلاحية"
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
                ))}
              </div>
            )}
          </div>
        </div>
      </FormModal>

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
            لا يوجد مستخدمـون
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(users as UserListItem[]).map((u, index) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
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
                        {u.role === "admin" ? "مديـر" : "مساهـم"}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {u.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ">
                {u.role === "contributor" && (
                  <button
                    type="button"
                    aria-label={`إدارة صلاحيات ${u.name}`}
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
                  type="button"
                  aria-label={`تعديل ${u.name}`}
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
                  type="button"
                  aria-label={`حذف ${u.name}`}
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
