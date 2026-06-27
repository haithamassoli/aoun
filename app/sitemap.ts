import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { getCachedPublicSitemapUrls } from "@/lib/cached-public-data";

const STATIC_PUBLIC_PATHS = [
  "/",
  "/courses",
  "/gpa-calculator",
  "/academic-planner",
  "/focus",
  "/partners",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let urls: { path: string }[] = [];
  try {
    urls = await getCachedPublicSitemapUrls();
  } catch {
    // Fallback: at minimum include the home page
    urls = [{ path: "/" }];
  }

  const entries = [...STATIC_PUBLIC_PATHS, ...urls.map((entry) => entry.path)];
  const uniqueEntries = Array.from(new Set(entries));

  return uniqueEntries.map((path) => {
    const isHome = path === "/";
    const isNewsPage = path.endsWith("/news");
    const isToolPage = STATIC_PUBLIC_PATHS.includes(path);
    const segmentCount = path.split("/").filter(Boolean).length;

    return {
      url: `${SITE_URL}${path}`,
      changeFrequency: isHome
        ? "daily"
        : isNewsPage
          ? "daily"
          : isToolPage
            ? "monthly"
          : "weekly",
      priority: isHome ? 1 : path === "/courses" ? 0.9 : segmentCount <= 2 ? 0.8 : 0.6,
    };
  });
}
