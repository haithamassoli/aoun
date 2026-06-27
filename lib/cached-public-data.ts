import "server-only";

import { fetchQuery } from "convex/nextjs";
import type {
  FunctionReference,
  FunctionReturnType,
  PaginationOptions,
} from "convex/server";
import { cacheLife } from "next/cache";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type QueryResult<Query extends FunctionReference<"query">> =
  FunctionReturnType<Query>;

export async function getCachedUniversities(): Promise<
  QueryResult<typeof api.universities.list>
> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.universities.list);
}

export async function getCachedPartners(): Promise<
  QueryResult<typeof api.partners.list>
> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.partners.list);
}

export async function getCachedPublicVisitorsTotal(): Promise<
  QueryResult<typeof api.dashboard.getPublicVisitorsTotal>
> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.dashboard.getPublicVisitorsTotal);
}

export async function getCachedUniversityBySlug(
  slug: string,
): Promise<QueryResult<typeof api.universities.getBySlug>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.universities.getBySlug, { slug });
}

export async function getCachedMajorsByUniversity(
  universityId: Id<"universities">,
): Promise<QueryResult<typeof api.majors.listByUniversity>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.majors.listByUniversity, { universityId });
}

export async function getCachedMajorByUniversityAndSlug(
  universityId: Id<"universities">,
  slug: string,
): Promise<QueryResult<typeof api.majors.getByUniversityAndSlug>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.majors.getByUniversityAndSlug, { universityId, slug });
}

export async function getCachedCoursesByMajor(
  majorId: Id<"majors">,
): Promise<QueryResult<typeof api.courses.listByMajor>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.courses.listByMajor, { majorId });
}

export async function getCachedCourseByMajorAndSlug(
  majorId: Id<"majors">,
  slug: string,
): Promise<QueryResult<typeof api.courses.getByMajorAndSlug>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.courses.getByMajorAndSlug, { majorId, slug });
}

export async function getCachedResourcesByCourse(
  courseId: Id<"courses">,
): Promise<QueryResult<typeof api.resources.listByCourse>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.resources.listByCourse, { courseId });
}

export async function getCachedLatestNewsByMajor(
  majorId: Id<"majors">,
): Promise<QueryResult<typeof api.news.getLatestByMajor>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.news.getLatestByMajor, { majorId });
}

export async function getCachedNewsPageByMajor(
  majorId: Id<"majors">,
  paginationOpts: PaginationOptions,
): Promise<QueryResult<typeof api.news.listByMajor>> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.news.listByMajor, { majorId, paginationOpts });
}

export async function getCachedPublicSitemapUrls(): Promise<
  QueryResult<typeof api.sitemap.getAllPublicUrls>
> {
  "use cache";
  cacheLife("minutes");
  return fetchQuery(api.sitemap.getAllPublicUrls);
}
