import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let urls: { path: string }[] = [];
  try {
    urls = await fetchQuery(api.sitemap.getAllPublicUrls);
  } catch {
    // Fallback: at minimum include the home page
    urls = [{ path: "/" }];
  }

  return urls.map((entry) => {
    const isHome = entry.path === "/";
    const isNewsPage = entry.path.endsWith("/news");
    const segmentCount = entry.path.split("/").filter(Boolean).length;

    return {
      url: `${SITE_URL}${entry.path}`,
      lastModified: new Date(),
      changeFrequency: isHome
        ? "daily"
        : isNewsPage
          ? "daily"
          : "weekly",
      priority: isHome ? 1 : segmentCount <= 2 ? 0.8 : 0.6,
    };
  });
}
