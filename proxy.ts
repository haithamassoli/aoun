import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LAST_MAJOR_COOKIE } from "@/lib/student-progress";

const SESSION_COOKIE = "aoun_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const lastMajor = request.cookies.get(LAST_MAJOR_COOKIE)?.value;
    const shouldSkipResume = request.nextUrl.searchParams.has(
      "lastMajorResumeFailed",
    );

    if (lastMajor && !shouldSkipResume) {
      return NextResponse.redirect(new URL("/resume-last-major", request.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === "/login") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login"],
};
