"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CourseStatusMenu,
  CourseStatusSelector,
} from "@/components/course-status-selector";
import { Toast, useToast } from "@/components/toast";
import { motion } from "@/components/motion";
import {
  createCustomCourse,
  loadCustomCourses,
  removeCustomCourse,
  setCustomCourseStatus,
  type CustomCourse,
  updateCustomCourse,
} from "@/lib/custom-courses";
import type { CourseProgressStatus } from "@/lib/student-progress";

function getStatusLabel(status: CourseProgressStatus) {
  switch (status) {
    case "completed":
      return "مكتمل";
    case "in_progress":
      return "قيد الدراسة";
    case "hidden":
      return "مخفي";
    default:
      return "بدون حالة";
  }
}

function getStatusDotClassName(status: CourseProgressStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-500";
    case "in_progress":
      return "bg-amber-500";
    case "hidden":
      return "bg-slate-500";
    default:
      return "bg-surface-400 dark:bg-surface-500";
  }
}

function getStatusStats(courses: CustomCourse[]) {
  const stats = {
    total: courses.length,
    completed: 0,
    inProgress: 0,
    none: 0,
    hidden: 0,
  };

  for (const course of courses) {
    if (course.status === "completed") {
      stats.completed += 1;
      continue;
    }

    if (course.status === "in_progress") {
      stats.inProgress += 1;
      continue;
    }

    if (course.status === "hidden") {
      stats.hidden += 1;
      continue;
    }

    stats.none += 1;
  }

  return stats;
}

export function CustomCourseTracker({
  majorId,
  onCoursesChange,
}: {
  majorId: string;
  onCoursesChange?: (courses: CustomCourse[]) => void;
}) {
  const toast = useToast();
  const [isReady, setIsReady] = useState(false);
  const [courses, setCourses] = useState<CustomCourse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [status, setStatus] = useState<CourseProgressStatus>("none");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const loadedCourses = loadCustomCourses(majorId);
      setCourses(loadedCourses);
      setIsReady(true);
      onCoursesChange?.(loadedCourses);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [majorId, onCoursesChange]);

  const stats = useMemo(() => getStatusStats(courses), [courses]);

  const resetForm = () => {
    setName("");
    setCredits("3");
    setStatus("none");
    setEditingCourseId(null);
    setShowForm(false);
  };

  const beginCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const beginEdit = (course: CustomCourse) => {
    setName(course.name);
    setCredits(String(course.credits ?? 3));
    setStatus(course.status);
    setEditingCourseId(course.id);
    setShowForm(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.show("اسم المسار مطلوب", "error");
      return;
    }

    const parsedCredits = Number.parseInt(credits, 10);
    if (
      Number.isNaN(parsedCredits) ||
      parsedCredits < 1 ||
      parsedCredits > 12
    ) {
      toast.show("عدد الساعات يجب أن يكون بين 1 و 12", "error");
      return;
    }

    if (editingCourseId) {
      const updatedCourses = updateCustomCourse(majorId, editingCourseId, {
        name: trimmedName,
        credits: parsedCredits,
        status,
      });
      setCourses(updatedCourses);
      onCoursesChange?.(updatedCourses);
      toast.show("تم تحديث المسار الخاص", "success");
    } else {
      const newCourses = createCustomCourse(majorId, {
        name: trimmedName,
        credits: parsedCredits,
        status,
      });
      setCourses(newCourses);
      onCoursesChange?.(newCourses);
      toast.show("تمت إضافة المسار الخاص", "success");
    }

    resetForm();
  };

  const handleDelete = (courseId: string) => {
    const updatedCourses = removeCustomCourse(majorId, courseId);
    setCourses(updatedCourses);
    onCoursesChange?.(updatedCourses);

    if (editingCourseId === courseId) {
      resetForm();
    }

    toast.show("تم حذف المسار الخاص", "success");
  };

  const handleStatusChange = (
    courseId: string,
    nextStatus: CourseProgressStatus,
  ) => {
    const updatedCourses = setCustomCourseStatus(majorId, courseId, nextStatus);
    setCourses(updatedCourses);
    onCoursesChange?.(updatedCourses);
  };

  return (
    <section className="space-y-4">
      <Toast toast={toast} />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            مواد إضافية
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            أضف المواد الإضافية، الحرة، أو المتطلبات الإجبارية غير المدرجة في
            الخطة الافتراضية.
          </p>
        </div>

        <button
          type="button"
          onClick={beginCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
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
              d="M12 5v14m-7-7h14"
            />
          </svg>
          إضافة مسار
        </button>
      </div>

      {isReady && courses.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            {stats.total} مسار
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {stats.completed} مكتمل
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {stats.inProgress} قيد الدراسة
          </span>
        </div>
      ) : null}

      {showForm ? (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-surface-200/80 bg-white/95 p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900"
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">
                اسم المسار
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثال: عسكرية"
                className="h-11 w-full rounded-xl border border-surface-300 bg-white px-3 text-sm text-surface-800 outline-none transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-surface-600 dark:bg-surface-950 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:ring-primary-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">
                عدد الساعات
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                placeholder="3"
                className="h-11 w-full rounded-xl border border-surface-300 bg-white px-3 text-sm text-surface-800 outline-none transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-surface-600 dark:bg-surface-950 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:ring-primary-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">
                الحالة
              </label>
              <CourseStatusSelector
                value={status}
                onChange={setStatus}
                ariaLabel="حالة المسار الخاص"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                {editingCourseId ? "حفظ" : "إضافة"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-200 dark:hover:bg-surface-900"
              >
                إلغاء
              </button>
            </div>
          </div>
        </motion.form>
      ) : null}

      {isReady ? (
        courses.length > 0 ? (
          <div className="grid gap-2 sm:gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.article
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.03,
                  ease: "easeOut",
                }}
                className="group flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white/95 p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[0_20px_40px_-28px_rgba(14,165,233,0.45)] dark:border-surface-700/80 dark:bg-surface-900/95 dark:shadow-none dark:hover:border-primary-600 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStatusDotClassName(course.status)}`}
                        aria-hidden="true"
                      />
                      <span className="inline-flex rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
                        مسار خاص
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {course.credits ?? 3} ساعة
                        </span>
                      </div>
                    </div>
                    <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-surface-900 transition-colors group-hover:text-primary-700 dark:text-surface-50 dark:group-hover:text-primary-300 sm:text-base">
                      {course.name}
                    </h4>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => beginEdit(course)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-500 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-400 dark:hover:border-primary-700 dark:hover:bg-primary-950/60 dark:hover:text-primary-300"
                      aria-label={`تعديل ${course.name}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.9}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487a2.1 2.1 0 0 1 2.97 2.97L8.5 18.79l-4.5 1 1-4.5L16.862 4.487z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(course.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-400 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                      aria-label={`حذف ${course.name}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.9}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <CourseStatusMenu
                      value={course.status}
                      onChange={(nextStatus) =>
                        handleStatusChange(course.id, nextStatus)
                      }
                      ariaLabel={`تغيير حالة المسار ${course.name}`}
                    />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : null
      ) : (
        <div className="grid gap-2 sm:gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-surface-200 bg-white/80 dark:border-surface-700 dark:bg-surface-900/80"
            />
          ))}
        </div>
      )}
    </section>
  );
}
