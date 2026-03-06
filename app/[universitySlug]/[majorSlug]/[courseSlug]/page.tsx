import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Metadata } from "next";
import * as motion from "motion/react-client";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { CourseStatusControl } from "@/components/course-status-control";

type Params = {
  universitySlug: string;
  majorSlug: string;
  courseSlug: string;
};

const categoryConfig = {
  course_intro: { label: "التعريف بالمادة", icon: "🧭" },
  comprehensive_post: { label: "البوست الشامل", icon: "🧩" },
  textbook: { label: "الكتاب", icon: "📘" },
  previous_years: { label: "السنوات السابقة", icon: "🗂️" },
  explanations_notebooks: { label: "الشروحات والدفاتر", icon: "📒" },
  course_drive: { label: "درايف المادة", icon: "☁️" },
  notes: { label: "ملاحظات", icon: "📝" },
  exams: { label: "امتحانات", icon: "📋" },
  videos: { label: "فيديوهات", icon: "🎬" },
  summaries: { label: "ملخصات", icon: "📖" },
  tips: { label: "نصائح", icon: "💡" },
  other: { label: "أخرى", icon: "📎" },
} as const;

const categoryOrder: (keyof typeof categoryConfig)[] = [
  "course_intro",
  "comprehensive_post",
  "textbook",
  "previous_years",
  "explanations_notebooks",
  "course_drive",
  "summaries",
  "notes",
  "exams",
  "videos",
  "tips",
  "other",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug, majorSlug, courseSlug } = await params;
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) return {};
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) return {};
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId: major._id,
    slug: courseSlug,
  });
  if (!course || course.majorId !== major._id) return {};
  const title = `${course.name} — ${major.name} — ${university.name}`;
  const description = `مصادر أكاديمية لمادة ${course.name}${course.courseCode ? ` (${course.courseCode})` : ""} في تخصص ${major.name}، ${university.name}. ملخصات، امتحانات، وفيديوهات.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} — عون`,
      description,
      url: `/${universitySlug}/${majorSlug}/${courseSlug}`,
      type: "article",
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, majorSlug, courseSlug } = await params;

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) notFound();
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: majorSlug,
  });
  if (!major || major.universityId !== university._id) notFound();
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId: major._id,
    slug: courseSlug,
  });
  if (!course || course.majorId !== major._id) notFound();

  const resources = await fetchQuery(api.resources.listByCourse, {
    courseId: course._id,
  });

  // Group resources by category, only include non-empty categories
  const grouped = new Map<string, typeof resources>();
  for (const resource of resources) {
    if (!grouped.has(resource.category)) grouped.set(resource.category, []);
    grouped.get(resource.category)!.push(resource);
  }

  // Sort within each category by order
  for (const [category, items] of grouped) {
    grouped.set(
      category,
      items.toSorted(
        (a: { order: number }, b: { order: number }) => a.order - b.order,
      ),
    );
  }

  // Filter to only categories that have resources, in display order
  const activeCategories = categoryOrder.filter((cat) => grouped.has(cat));

  return (
    <div>
      {/* Course Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${universitySlug}` },
              {
                label: major.name,
                href: `/${universitySlug}/${majorSlug}`,
              },
              { label: course.name },
            ]}
          />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl lg:text-4xl"
          >
            {course.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 flex flex-wrap items-center gap-3 text-surface-500 dark:text-surface-400"
          >
            {course.courseCode && (
              <span className="rounded-md bg-surface-100 px-2.5 py-1 text-sm font-medium text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                {course.courseCode}
              </span>
            )}
            <span>
              {major.name} · {university.name}
            </span>
          </motion.div>
          <CourseStatusControl courseId={course._id} courseName={course.name} />
        </div>
      </section>

      {/* Resources */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {activeCategories.length > 0 ? (
          <div className="space-y-10">
            {activeCategories.map((cat, catIndex) => {
              const config = categoryConfig[cat];
              const items = grouped.get(cat)!;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + catIndex * 0.1 }}
                >
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-800 dark:text-surface-100 sm:text-xl">
                    <span className="text-xl">{config.icon}</span>
                    {config.label}
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                      {items.length}
                    </span>
                  </h2>

                  <div className="space-y-3">
                    {items.map(
                      (resource: {
                        _id: string;
                        type: "link" | "richtext";
                        url?: string;
                        title: string;
                        content?: string;
                      }) => (
                        <div
                          key={resource._id}
                          className="rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900"
                        >
                          {resource.type === "link" && resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 p-4 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:group-hover:bg-primary-900">
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
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                  />
                                </svg>
                              </div>
                              <span className="min-w-0 flex-1 truncate font-medium text-surface-800 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                                {resource.title}
                              </span>
                              <svg
                                className="h-4 w-4 shrink-0 text-surface-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          ) : (
                            <div className="p-5">
                              <h3 className="mb-3 font-semibold text-surface-800 dark:text-surface-100">
                                {resource.title}
                              </h3>
                              {resource.content && (
                                <div
                                  className="prose prose-sm max-w-none text-surface-700 dark:text-surface-300"
                                  style={{ direction: "rtl" }}
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeRichText(resource.content),
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white p-12 text-center dark:border-surface-700 dark:bg-surface-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-3xl dark:bg-surface-800">
              📚
            </div>
            <p className="text-lg font-medium text-surface-700 dark:text-surface-200">
              لا توجد مصادر بعد
            </p>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              ستُضاف المصادر قريباً. ترقبوا التحديثات!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
