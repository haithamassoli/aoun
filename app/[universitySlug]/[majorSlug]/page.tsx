import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Metadata } from "next";

type Params = { universitySlug: string; majorSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { universitySlug, majorSlug } = await params;
  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) return {};
  const major = await fetchQuery(api.majors.getBySlug, { slug: majorSlug });
  if (!major || major.universityId !== university._id) return {};
  return {
    title: `${major.name} — ${university.name} — عون`,
    description: `الخطة الدراسية والمواد الأكاديمية لتخصص ${major.name} في ${university.name}. ملخصات، امتحانات، ومصادر مجانية.`,
  };
}

const semesterLabels: Record<number, string> = {
  1: "الفصل الأول",
  2: "الفصل الثاني",
  3: "الفصل الثالث",
  4: "الفصل الرابع",
  5: "الفصل الخامس",
  6: "الفصل السادس",
  7: "الفصل السابع",
  8: "الفصل الثامن",
  9: "الفصل التاسع",
  10: "الفصل العاشر",
};

export default async function MajorPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { universitySlug, majorSlug } = await params;

  const university = await fetchQuery(api.universities.getBySlug, {
    slug: universitySlug,
  });
  if (!university) notFound();

  const major = await fetchQuery(api.majors.getBySlug, { slug: majorSlug });
  if (!major || major.universityId !== university._id) notFound();

  const courses = await fetchQuery(api.courses.listByMajor, {
    majorId: major._id,
  });

  // Group courses by semester
  const grouped = new Map<number | null, typeof courses>();
  for (const course of courses) {
    const key = course.semester ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(course);
  }

  // Sort semesters: numbered first, then null (unassigned)
  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  return (
    <div>
      {/* Major Header */}
      <section className="border-b border-surface-200 bg-gradient-to-bl from-primary-50 to-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: university.name, href: `/${universitySlug}` },
              { label: major.name },
            ]}
          />
          <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl lg:text-4xl">
            {major.name}
          </h1>
          <p className="mt-2 text-surface-500">
            {university.name} ·{" "}
            {courses.length > 0
              ? `${courses.length} مادة`
              : "لا توجد مواد حالياً"}
          </p>
        </div>
      </section>

      {/* Study Plan */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <h2 className="mb-8 text-xl font-bold text-surface-800 sm:text-2xl">
          الخطة الدراسية
        </h2>

        {courses.length > 0 ? (
          <div className="space-y-10">
            {sortedKeys.map((semesterKey) => {
              const semesterCourses = grouped
                .get(semesterKey)!
                .sort((a, b) => a.order - b.order);
              const label =
                semesterKey !== null
                  ? semesterLabels[semesterKey] || `الفصل ${semesterKey}`
                  : "مواد أخرى";

              return (
                <div key={semesterKey ?? "other"}>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">
                      {semesterKey ?? "—"}
                    </span>
                    {label}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {semesterCourses.map((course) => (
                      <a
                        key={course._id}
                        href={`/${universitySlug}/${majorSlug}/${course.slug}`}
                        className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-surface-800 group-hover:text-primary-600">
                            {course.name}
                          </h4>
                          {course.courseCode && (
                            <p className="mt-0.5 text-sm text-surface-400">
                              {course.courseCode}
                            </p>
                          )}
                        </div>
                        <svg
                          className="h-5 w-5 shrink-0 rotate-180 text-surface-400 transition-colors group-hover:text-primary-500"
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
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white p-12 text-center">
            <p className="text-surface-500">
              لم تُضاف مواد بعد. ترقبوا التحديثات!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
