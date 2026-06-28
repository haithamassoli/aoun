import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function getPublicUniversities() {
  "use cache";
  cacheLife("max");
  cacheTag("universities");
  return await fetchQuery(api.universities.list);
}

export async function getPublicPartners() {
  "use cache";
  cacheLife("max");
  cacheTag("partners");
  return await fetchQuery(api.partners.list);
}

export async function getPublicVisitorsTotal() {
  "use cache";
  cacheLife("hours");
  cacheTag("visitors");
  return await fetchQuery(api.dashboard.getPublicVisitorsTotal);
}

export async function getUniversityBySlug(slug: string) {
  "use cache";
  cacheTag("universities");
  const university = await fetchQuery(api.universities.getBySlug, { slug });
  if (university) {
    cacheLife("max");
  } else {
    cacheLife("minutes");
  }
  return university;
}

export async function getMajorsByUniversity(universityId: Id<"universities">) {
  "use cache";
  cacheLife("max");
  cacheTag("majors");
  return await fetchQuery(api.majors.listByUniversity, { universityId });
}

export async function getMajorByUniversityAndSlug(
  universityId: Id<"universities">,
  slug: string,
) {
  "use cache";
  cacheTag("majors");
  const major = await fetchQuery(api.majors.getByUniversityAndSlug, {
    universityId,
    slug,
  });
  if (major) {
    cacheLife("max");
  } else {
    cacheLife("minutes");
  }
  return major;
}

export async function getCoursesByMajor(majorId: Id<"majors">) {
  "use cache";
  cacheLife("max");
  cacheTag("courses");
  return await fetchQuery(api.courses.listByMajor, { majorId });
}

export async function getCourseByMajorAndSlug(
  majorId: Id<"majors">,
  slug: string,
) {
  "use cache";
  cacheTag("courses");
  const course = await fetchQuery(api.courses.getByMajorAndSlug, {
    majorId,
    slug,
  });
  if (course) {
    cacheLife("max");
  } else {
    cacheLife("minutes");
  }
  return course;
}

export async function getResourcesByCourse(courseId: Id<"courses">) {
  "use cache";
  cacheLife("max");
  cacheTag("resources");
  return await fetchQuery(api.resources.listByCourse, { courseId });
}

export async function getLatestNewsByMajor(majorId: Id<"majors">) {
  "use cache";
  cacheLife("days");
  cacheTag("news");
  return await fetchQuery(api.news.getLatestByMajor, { majorId });
}

export async function getNewsPageByMajor(
  majorId: Id<"majors">,
  pageSize: number,
) {
  "use cache";
  cacheLife("days");
  cacheTag("news");
  return await fetchQuery(api.news.listByMajor, {
    majorId,
    paginationOpts: {
      cursor: null,
      numItems: pageSize,
    },
  });
}

export async function getPublicSitemapUrls() {
  "use cache";
  cacheLife("max");
  cacheTag("sitemap");
  return await fetchQuery(api.sitemap.getAllPublicUrls);
}
