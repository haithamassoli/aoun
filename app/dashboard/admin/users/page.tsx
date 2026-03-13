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
  { value: "admin", label: "مدير" },
  { value: "contributor", label: "مساهم" },
];

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
    const major = majors?.find((m) => m._id === majorId);
    return major ? `${major.name} — ${major.universityName}` : majorId;
  };

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {users ? `${users.length} مستخدم` : "جاري التحميل..."}
          </p>
        </div>
        <button
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
          إضافة مستخدم
        </button>
      </motion.div>

      <FormModal
        open={showCreateForm}
        title="إضافة مستخدم جديد"
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
            <FormInput form={createForm} name="name" label="الاسم *" />
            <FormInput
              form={createForm}
              name="email"
              label="البريد الإلكتروني *"
              type="email"
              dir="ltr"
            />
            <FormInput
              form={createForm}
              name="password"
              label="كلمة المرور *"
              type="password"
              dir="ltr"
            />
            <FormSelect
              form={createForm}
              name="role"
              label="الدور *"
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
                  {isSubmitting ? "جاري الإنشاء..." : "إنشاء مستخدم"}
                </button>
              )}
            </createForm.Subscribe>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              للمساهمين، قم بإضافة الصلاحيات بعد الإنشاء.
            </p>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={editingId !== null}
        title="تعديل المستخدم"
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
            <FormInput form={editForm} name="name" label="الاسم *" />
            <FormInput
              form={editForm}
              name="email"
              label="البريد الإلكتروني *"
              type="email"
              dir="ltr"
            />
            <FormSelect
              form={editForm}
              name="role"
              label="الدور *"
              options={ROLE_OPTIONS}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <editForm.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الحفظ..." : "تحديث"}
                </button>
              )}
            </editForm.Subscribe>
            <button
              type="button"
              onClick={resetEditForm}
              className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              إلغاء
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={managingPermsFor !== null}
        title={`صلاحيات: ${users?.find((u) => u._id === managingPermsFor)?.name ?? ""}`}
        onClose={() => setManagingPermsFor(null)}
      >
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
                className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
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

        <div className="mt-4 flex items-center gap-2">
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
            لا يوجد مستخدمون
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u, index) => (
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
              <div className="flex items-center gap-1 ">
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
