"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { useAuth } from "@/components/auth-provider";
import { Toast, useToast } from "@/components/toast";
import { SendNotificationForm } from "@/components/dashboard/send-notification-form";
import { AdminDashboardOverview } from "@/components/dashboard/admin-dashboard-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";

export default function DashboardPage() {
  const { user, sessionToken } = useAuth();
  const isAdmin = user?.role === "admin";
  const toast = useToast();

  const majors = useQuery(
    api.dashboard.getMyMajors,
    !isAdmin && user && sessionToken ? { token: sessionToken } : "skip",
  );
  const analytics = useQuery(
    api.dashboard.getAdminDashboardAnalytics,
    isAdmin && sessionToken ? { token: sessionToken, days: 30 } : "skip",
  );

  if (!user) {
    return null;
  }

  if (isAdmin) {
    return (
      <div>
        <Toast toast={toast} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            لوحة التحكم
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            مرحبا، {user.name}. لديك صلاحيات كاملة.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mb-6 rounded-[28px] border border-primary-200/70 bg-gradient-to-l from-white via-primary-50/60 to-primary-100/70 p-5 dark:border-primary-900/50 dark:from-surface-900 dark:via-primary-950/20 dark:to-surface-900 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700/80 dark:text-primary-200/80">
            Visitor intelligence
          </p>
          <h2 className="mt-3 text-xl font-bold text-surface-900 dark:text-surface-50 sm:text-2xl">
            أين يذهب الزوار داخل المنصة؟
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-surface-600 dark:text-surface-300">
            هذا الإصدار من اللوحة يركز على سلوك الزيارة الفعلي: الصفحات
            الأكثر مشاهدة، أنواع الصفحات التي تستقطب الحركة، ومسارات التنقل
            الأكثر شيوعًا بين الجامعات والتخصصات والمواد.
          </p>
        </motion.section>

        <AdminDashboardOverview analytics={analytics} />

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 overflow-hidden rounded-[28px] border border-primary-200/70 bg-gradient-to-br from-white via-primary-50/40 to-white p-5 dark:border-primary-900/50 dark:from-surface-900 dark:via-primary-950/20 dark:to-surface-900 sm:p-6"
        >
          <div className="mb-5">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              إرسال إشعار مخصص
            </h2>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              أرسل إشعارا مباشرا لجميع المشتركين أو لمشتركي تخصص محدد.
            </p>
          </div>
          <SendNotificationForm
            showToast={(message, type) => toast.show(message, type)}
          />
        </motion.section>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          لوحة التحكم
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          مرحبا، {user.name}. اختر تخصصا لإدارة محتواه.
        </p>
      </motion.div>

      {majors === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              className="h-32 rounded-2xl border border-surface-200 dark:border-surface-700"
            />
          ))}
        </div>
      ) : majors.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
            <svg
              className="h-6 w-6 text-surface-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
            لا توجد تخصصات مخصصة لك
          </p>
          <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
            تواصل مع المدير لإضافة صلاحيات
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {majors.map(
            (
              major: { _id: string; name: string; universityName: string },
              index: number,
            ) => (
              <motion.div
                key={major._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
              >
                <Link
                  href={`/dashboard/major/${major._id}`}
                  className="group block rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-700"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <svg
                      className="h-5 w-5 text-surface-300 transition-colors group-hover:text-primary-400 dark:text-surface-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                    {major.name}
                  </h3>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                    {major.universityName}
                  </p>
                </Link>
              </motion.div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
