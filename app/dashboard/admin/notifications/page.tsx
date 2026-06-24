"use client";

import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { motion } from "motion/react";
import { Toast, useToast } from "@/components/toast";
import { SendNotificationForm } from "@/components/dashboard/send-notification-form";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const toast = useToast();

  if (!user || user.role !== "admin") return null;

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
          الإشـعارات
        </span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
          إرسال إشعار مخصـص
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          أرسل إشعارا لجميع المشتركـين أو لمشتركي تخصص محدد.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6"
      >
        <SendNotificationForm showToast={(msg, type) => toast.show(msg, type)} />
      </motion.div>
    </div>
  );
}
