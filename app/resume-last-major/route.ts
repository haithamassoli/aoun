import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import {
  type LastVisitedMajor,
  HOME_LAST_MAJOR_REDIRECT_SESSION_COOKIE,
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

function setRedirectedThisSession(response: NextResponse, requestUrl: URL) {
  response.cookies.set(HOME_LAST_MAJOR_REDIRECT_SESSION_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(requestUrl),
  });
}

function clearLastMajorCookie(response: NextResponse, requestUrl: URL) {
  response.cookies.set(LAST_MAJOR_COOKIE, "", {
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    secure: isSecureRequest(requestUrl),
  });
}

function redirectHome(requestUrl: URL) {
  return NextResponse.redirect(new URL("/", requestUrl));
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
    const response = redirectHome(requestUrl);
    setRedirectedThisSession(response, requestUrl);
    return response;
  }

  if (!validatedTarget) {
    const response = redirectHome(requestUrl);
    clearLastMajorCookie(response, requestUrl);
    return response;
  }

  const response = NextResponse.redirect(majorUrl(requestUrl, validatedTarget));
  setRedirectedThisSession(response, requestUrl);
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
