"use client";

import { useState, type FormEvent } from "react";
import { loginAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginAction(email, password);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error ?? "حدث خطأ غير متوقع");
      }
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white">
            عـ
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            تسجيل الدخول
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            سجّل دخولك للوصول إلى لوحة التحكم
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200"
              >
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:bg-surface-800"
                dir="ltr"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200"
              >
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:bg-surface-800"
                dir="ltr"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-surface-400 dark:text-surface-500">
          ليس لديك حساب؟ تواصل مع مدير النظام عبر{" "}
          <a
            href="https://wa.me/+962776193666"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            واتساب
          </a>
          .
        </p>
      </div>
    </div>
  );
}
