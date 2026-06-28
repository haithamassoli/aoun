import { revalidateTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import {
  PUBLIC_CACHE_TAGS,
  type PublicCacheTag,
} from "@/lib/public-cache";

const PUBLIC_CACHE_TAG_SET = new Set<string>(PUBLIC_CACHE_TAGS);

function getBodyValue(body: unknown, key: string) {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  return (body as Record<string, unknown>)[key];
}

function parseTags(value: unknown): PublicCacheTag[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const tags = new Set<PublicCacheTag>();
  for (const tag of value) {
    if (typeof tag !== "string" || !PUBLIC_CACHE_TAG_SET.has(tag)) {
      return null;
    }
    tags.add(tag as PublicCacheTag);
  }

  return tags.size > 0 ? [...tags] : null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const token = getBodyValue(body, "token");
  const tags = parseTags(getBodyValue(body, "tags"));

  if (typeof token !== "string" || !token) {
    return Response.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  if (!tags) {
    return Response.json({ error: "INVALID_TAGS" }, { status: 400 });
  }

  const user = await fetchQuery(api.auth.getCurrentUser, { token });
  if (!user) {
    return Response.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  if (user.role !== "admin" && user.role !== "contributor") {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return Response.json({ revalidated: tags });
}
