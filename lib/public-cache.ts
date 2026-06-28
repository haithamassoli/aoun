export const PUBLIC_CACHE_TAGS = [
  "universities",
  "partners",
  "visitors",
  "majors",
  "courses",
  "resources",
  "news",
  "sitemap",
] as const;

export type PublicCacheTag = (typeof PUBLIC_CACHE_TAGS)[number];

export const PUBLIC_CACHE_TAG_GROUPS = {
  universities: ["universities", "sitemap"],
  majors: ["majors", "sitemap"],
  majorDetails: ["majors"],
  courses: ["courses", "sitemap"],
  courseDetails: ["courses"],
} as const satisfies Record<string, readonly PublicCacheTag[]>;

export async function revalidatePublicCache(
  token: string | null | undefined,
  tags: readonly PublicCacheTag[],
) {
  if (!token || tags.length === 0) {
    return;
  }

  try {
    const response = await fetch("/api/revalidate-public-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tags }),
    });

    if (!response.ok) {
      throw new Error(`Cache revalidation failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("Failed to revalidate public cache", error);
  }
}
