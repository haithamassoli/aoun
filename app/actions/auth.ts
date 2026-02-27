"use server";

import { cookies } from "next/headers";
import { fetchAction, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const SESSION_COOKIE = "aoun_session";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function loginAction(email: string, password: string) {
  try {
    const result = await fetchAction(api.authActions.login, {
      email,
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return { success: true, user: result.user };
  } catch {
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await fetchMutation(api.auth.logout, { token });
    } catch {
      // Session may already be expired
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
