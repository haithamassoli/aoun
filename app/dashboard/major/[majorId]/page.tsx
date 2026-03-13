"use client";

import { useAuth } from "@/components/auth-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Toast, useToast } from "@/components/toast";
import { FormInput } from "@/components/form-field";
import { PublicSearchInput } from "@/components/public-search-input";
import { useDebouncedPublicSearch } from "@/components/use-debounced-public-search";
import { contributorCourseSchema } from "@/lib/schemas";
import { motion } from "motion/react";
import { NewsList } from "@/components/dashboard/news-list";
import { NewsForm } from "@/components/dashboard/news-form";
import { ConfirmDialog } from "@/components/confirm-dialog";

const generateSlug = (name: string) =>
  name.trim().replace(/\s+/g, "-").toLowerCase();

type CourseListItem = {
  _id: Id<"courses">;
  name: string;
  slug: string;
  courseCode?: string;
  semester?: number;
  order: number;
  resourceCount: number;
  alias?: string;
};

type ActiveTab = "courses" | "news";

export default function MajorCoursesPage() {
  const { user, sessionToken } = useAuth();
  const { majorId } = useParams<{ majorId: string }>();
  const toast = useToast();
  const search = useDebouncedPublicSearch();
  const majorIdValue = majorId as Id<"majors">;

  const major = useQuery(
    api.dashboard.getMajorWithUniversity,
    user && sessionToken
      ? { token: sessionToken, majorId: majorIdValue }
      : "skip",
  );
  const courses = useQuery(
    api.dashboard.getCoursesForMajor,
    user && sessionToken
      ? { token: sessionToken, majorId: majorIdValue }
      : "skip",
  );
  const searchedCourses = useQuery(
    api.courses.searchByMajor,
    search.isEmpty ? "skip" : { majorId: majorIdValue, query: search.query },
  );
  const newsCount = useQuery(api.news.countByMajor, { majorId: majorIdValue });

  const addCourse = useMutation(api.courses.add);
  const updateCourse = useMutation(api.courses.update);
  const removeNews = useMutation(api.news.remove);

  const [activeTab, setActiveTab] = useState<ActiveTab>("courses");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // News state
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsFormValues, setNewsFormValues] = useState<{
    title: string;
    content: string;
  } | undefined>(undefined);
  const [deletingNews, setDeletingNews] = useState<string | null>(null);
  const [pendingDeleteNews, setPendingDeleteNews] = useState<{
    _id: Id<"news">;
    title: string;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      courseCode: "",
      semester: "",
      order: "0",
      alias: "",
    },
    validators: { onChange: contributorCourseSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!sessionToken) return;
      try {
        if (editingId) {
          await updateCourse({
            token: sessionToken,
            courseId: editingId as Id<"courses">,
            name: value.name.trim(),
            slug: value.slug.trim(),
            courseCode: value.courseCode.trim() || undefined,
            semester: value.semester ? Number(value.semester) : undefined,
            order: Number(value.order) || 0,
            alias: value.alias.trim() || undefined,
          });
          toast.show("تم تحديث المادة بنجاح", "success");
        } else {
          await addCourse({
            token: sessionToken,
            majorId: majorIdValue,
            name: value.name.trim(),
            slug: value.slug.trim(),
            courseCode: value.courseCode.trim() || undefined,
            semester: value.semester ? Number(value.semester) : undefined,
            order: Number(value.order) || 0,
            alias: value.alias.trim() || undefined,
          });
          toast.show("تم إضافة المادة بنجاح", "success");
        }
        formApi.reset();
        setEditingId(null);
        setShowForm(false);
      } catch {
        toast.show("حدث خطأ أثناء الحفظ", "error");
      }
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (course: CourseListItem) => {
    form.reset({
      name: course.name,
      slug: course.slug,
      courseCode: course.courseCode ?? "",
      semester: course.semester?.toString() ?? "",
      order: course.order.toString(),
      alias: course.alias ?? "",
    });
    setEditingId(course._id);
    setShowForm(true);
  };

  const handleNewsEdit = (news: {
    _id: Id<"news">;
    title: string;
    content: string;
  }) => {
    setNewsFormValues({ title: news.title, content: news.content });
    setEditingNewsId(news._id);
    setShowNewsForm(true);
  };

  const handleNewsDelete = async () => {
    if (!sessionToken) return;
    if (!pendingDeleteNews) return;

    setDeletingNews(pendingDeleteNews._id);
    try {
      await removeNews({ token: sessionToken, newsId: pendingDeleteNews._id });
      toast.show("تم حذف الخبر", "success");
    } catch {
      toast.show("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeletingNews(null);
      setPendingDeleteNews(null);
    }
  };

  const resetNewsForm = () => {
    setShowNewsForm(false);
    setEditingNewsId(null);
    setNewsFormValues(undefined);
  };

  if (major === undefined || courses === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
        <div className="h-64 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
      </div>
    );
  }

  if (!major) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          التخصص غير موجود
        </p>
      </div>
    );
  }

  const courseLookup = new Map(courses.map((course) => [course._id, course]));
  const activeCourses: CourseListItem[] = search.isEmpty
    ? courses
    : (searchedCourses ?? []).map((course) => {
        const existingCourse = courseLookup.get(course._id);

        if (existingCourse) {
          return existingCourse;
        }

        return {
          ...course,
          resourceCount: 0,
        };
      });
  const isSearchLoading =
    !search.isEmpty && (search.isDebouncing || searchedCourses === undefined);
  const isNoSearchResults =
    !search.isEmpty && !isSearchLoading && activeCourses.length === 0;

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
          {major.name}
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
            {major.name}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {major.universityName}
          </p>
        </div>
        {activeTab === "courses" ? (
          <button
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
            إضافة مادة
          </button>
        ) : (
          <button
            onClick={() => {
              resetNewsForm();
              setShowNewsForm(true);
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
            إضافة خبر
          </button>
        )}
      </motion.div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("courses")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "courses"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          المواد ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "news"
              ? "bg-primary-600 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          }`}
        >
          <span>الأخبار</span>
          {typeof newsCount === "number" && (
            <span
              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                activeTab === "news"
                  ? "bg-white/20 text-white"
                  : "bg-white text-primary-700 dark:bg-surface-900 dark:text-primary-300"
              }`}
            >
              {newsCount}
            </span>
          )}
        </button>
      </div>

      {/* Courses tab content */}
      {activeTab === "courses" && (
        <>
          {/* Add/Edit form */}
          {showForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 dark:border-primary-800 dark:bg-primary-950/30"
            >
              <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
                {editingId ? "تعديل المادة" : "إضافة مادة جديدة"}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  form={form}
                  name="name"
                  label="اسم المادة *"
                  onChangeCallback={(val) => {
                    if (!editingId) form.setFieldValue("slug", generateSlug(val));
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
                  name="courseCode"
                  label="رمز المادة"
                  dir="ltr"
                  placeholder="CS101"
                />
                <FormInput
                  form={form}
                  name="semester"
                  label="المستوى الدراسي"
                  type="number"
                  min="1"
                />
                <FormInput
                  form={form}
                  name="alias"
                  label="الاسم البديل (alias)"
                  placeholder="اسم بديل للبحث"
                />
                <FormInput
                  form={form}
                  name="order"
                  label="الترتيب"
                  type="number"
                  min="0"
                />
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
                  onClick={resetForm}
                  className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {courses.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mb-6 overflow-hidden rounded-2xl border border-surface-200/80 bg-gradient-to-br from-white via-white to-surface-50/80 p-4 shadow-sm dark:border-surface-700 dark:from-surface-900 dark:via-surface-900 dark:to-surface-950"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl flex-1">
                  <PublicSearchInput
                    label="ابحث داخل مواد التخصص"
                    placeholder="مثال: برمجة كائنية أو CS101"
                    value={search.input}
                    onChange={search.setInput}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:max-w-xs lg:justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    {search.isEmpty
                      ? `${courses.length} مادة متاحة`
                      : isSearchLoading
                        ? "جاري البحث..."
                        : `${activeCourses.length} نتيجة`}
                  </span>
                </div>
              </div>
            </motion.section>
          ) : null}

          {/* Courses list */}
          {courses.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                لا توجد مواد
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                أضف مادة جديدة للبدء
              </p>
            </div>
          ) : isSearchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
                />
              ))}
            </div>
          ) : isNoSearchResults ? (
            <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                <svg
                  className="h-6 w-6 text-surface-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.1-4.65a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                لا توجد نتائج مطابقة
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                لم نعثر على مادة تطابق «{search.query}» داخل هذا التخصص.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCourses.map((course, index: number) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="group flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
                >
                  <Link
                    href={`/dashboard/major/${majorId}/course/${course._id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                        {course.courseCode || "#"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                          {course.semester && (
                            <span>المستوى {course.semester}</span>
                          )}
                          <span>{course.resourceCount} مصدر</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(course)}
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
                    <Link
                      href={`/dashboard/major/${majorId}/course/${course._id}`}
                      className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                      title="المصادر"
                    >
                      <svg
                        className="h-4 w-4 rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* News tab content */}
      {activeTab === "news" && (
        <>
          {showNewsForm && (
            <NewsForm
              majorId={majorIdValue}
              editingId={editingNewsId}
              initialValues={newsFormValues}
              onSuccess={resetNewsForm}
              onCancel={resetNewsForm}
              showToast={(msg, type) => toast.show(msg, type)}
            />
          )}

          <NewsList
            majorId={majorIdValue}
            onEdit={handleNewsEdit}
            onDelete={(news) =>
              setPendingDeleteNews({ _id: news._id, title: news.title })
            }
            deleting={deletingNews}
          />
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteNews !== null}
        title="تأكيد حذف الخبر"
        description={
          pendingDeleteNews
            ? `سيتم حذف خبر «${pendingDeleteNews.title}» من القائمة العامة ولوحة التحكم.`
            : ""
        }
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        isLoading={deletingNews !== null}
        onConfirm={handleNewsDelete}
        onCancel={() => {
          if (!deletingNews) {
            setPendingDeleteNews(null);
          }
        }}
      />
    </div>
  );
}
