import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aoun.jo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let urls: { path: string }[] = [];
  try {
    urls = await fetchQuery(api.sitemap.getAllPublicUrls);
  } catch {
    // Fallback: at minimum include the home page
    urls = [{ path: "/" }];
  }

  return urls.map((entry) => ({
    url: `${BASE_URL}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: entry.path === "/" ? "daily" : "weekly",
    priority: entry.path === "/" ? 1 : entry.path.split("/").length <= 2 ? 0.8 : 0.6,
  }));
}
