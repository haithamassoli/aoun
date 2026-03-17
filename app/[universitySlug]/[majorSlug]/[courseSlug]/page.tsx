import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Metadata } from "next";
import * as motion from "motion/react-client";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { UniversityQuickLinks } from "@/components/university-quick-links";
import { CourseResourcesSection } from "@/components/course-resources-section";
import { decodeSlugParam } from "@/lib/slug";

type Params = {
  universitySlug: string;
  majorSlug: string;
  courseSlug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug, majorSlug, courseSlug } = await params;
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const normalizedCourseSlug = decodeSlugParam(courseSlug);
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) return {};
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) return {};
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId: major._id,
    slug: normalizedCourseSlug,
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
      url: `/${university.slug}/${major.slug}/${course.slug}`,
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
  const normalizedUniversitySlug = decodeSlugParam(universitySlug);
  const normalizedMajorSlug = decodeSlugParam(majorSlug);
  const normalizedCourseSlug = decodeSlugParam(courseSlug);

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: normalizedUniversitySlug,
  });
  if (!university) notFound();
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId: university._id,
    slug: normalizedMajorSlug,
  });
  if (!major || major.universityId !== university._id) notFound();
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId: major._id,
    slug: normalizedCourseSlug,
  });
  if (!course || course.majorId !== major._id) notFound();
  const canonicalUniversitySlug = university.slug;
  const canonicalMajorSlug = major.slug;

  const resources = await fetchQuery(api.resources.listByCourse, {
    courseId: course._id,
  });
  const resourceCards = resources.map((resource) => ({
    _id: resource._id,
    category: resource.category,
    contentHtml: resource.content
      ? sanitizeRichText(resource.content)
      : undefined,
    order: resource.order,
    title: resource.title,
    type: resource.type,
    url: resource.url,
  }));

  return (
    <div>
      {/* Course Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 dark:border-surface-700 dark:from-primary-950 dark:to-surface-950 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${canonicalUniversitySlug}` },
              {
                label: major.name,
                href: `/${canonicalUniversitySlug}/${canonicalMajorSlug}`,
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
          <UniversityQuickLinks links={university.quickLinks} />
        </div>
      </section>

      {/* Resources */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CourseResourcesSection resources={resourceCards} />
      </section>
    </div>
  );
}
