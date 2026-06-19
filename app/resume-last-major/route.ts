import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import {
  type LastVisitedMajor,
  LAST_MAJOR_COOKIE,
  LAST_MAJOR_COOKIE_MAX_AGE,
  encodeLastVisitedMajorCookie,
  parseLastVisitedMajorCookie,
} from "@/lib/student-progress";

export const dynamic = "force-dynamic";

function isSecureRequest(requestUrl: URL) {
  return requestUrl.protocol === "https:";
}

function majorUrl(requestUrl: URL, target: LastVisitedMajor) {
  return new URL(
    `/${encodeURIComponent(target.universitySlug)}/${encodeURIComponent(
      target.majorSlug,
    )}`,
    requestUrl,
  );
}

function clearLastMajorCookie(response: NextResponse, requestUrl: URL) {
  response.cookies.set(LAST_MAJOR_COOKIE, "", {
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    secure: isSecureRequest(requestUrl),
  });
}

function redirectHome(requestUrl: URL, searchParams?: Record<string, string>) {
  const homeUrl = new URL("/", requestUrl);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    homeUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(homeUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const storedTarget = parseLastVisitedMajorCookie(
    request.cookies.get(LAST_MAJOR_COOKIE)?.value,
  );

  if (!storedTarget) {
    const response = redirectHome(requestUrl);
    clearLastMajorCookie(response, requestUrl);
    return response;
  }

  let validatedTarget: LastVisitedMajor | null = null;

  try {
    validatedTarget = await fetchQuery(api.majors.validateLastVisitedMajor, {
      universitySlug: storedTarget.universitySlug,
      majorSlug: storedTarget.majorSlug,
    });
  } catch {
    return redirectHome(requestUrl, { lastMajorResumeFailed: "1" });
  }

  if (!validatedTarget) {
    const response = redirectHome(requestUrl);
    clearLastMajorCookie(response, requestUrl);
    return response;
  }

  const response = NextResponse.redirect(majorUrl(requestUrl, validatedTarget));
  response.cookies.set(
    LAST_MAJOR_COOKIE,
    encodeLastVisitedMajorCookie(validatedTarget),
    {
      path: "/",
      sameSite: "lax",
      maxAge: LAST_MAJOR_COOKIE_MAX_AGE,
      secure: isSecureRequest(requestUrl),
    },
  );
  return response;
}
