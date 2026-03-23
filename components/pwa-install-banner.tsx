"use client";

import { useEffect, useState } from "react";

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "aoun-install-banner-dismissed-at";
const DISMISS_DAYS = 3;

function isIosSafariBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
  return isIOS && isSafari;
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;

    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;

    const elapsedMs = Date.now() - dismissedAt;
    return elapsedMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures and fall back to a non-persistent dismiss.
  }
}

function shouldStartVisible(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneMode()) return false;
  if (wasRecentlyDismissed()) return false;
  return isIosSafariBrowser(window.navigator.userAgent);
}

export function PWAInstallBanner() {
  const [isEligibleViewport, setIsEligibleViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1024px)").matches;
  });
  const [isVisible, setIsVisible] = useState(shouldStartVisible);
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredInstallPromptEvent | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const updateViewport = () => setIsEligibleViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPromptEvent);
      setIsVisible(true);
    };

    const onAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const isStandalone = isStandaloneMode();
  const canShowIosHint =
    typeof window !== "undefined" &&
    isIosSafariBrowser(window.navigator.userAgent) &&
    !isStandalone;

  const shouldRender = isVisible && isEligibleViewport && !isStandalone;
  if (!shouldRender) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsVisible(false);
      setDeferredPrompt(null);
      return;
    }

    markDismissed();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    markDismissed();
    setIsVisible(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 px-4 md:bottom-4 md:px-6">
      <section className="pointer-events-auto mx-auto w-full max-w-xl rounded-2xl border border-primary-200 bg-white/95 p-4 shadow-xl shadow-primary-900/10 backdrop-blur-md dark:border-primary-800 dark:bg-surface-900/95">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            <span className="text-lg font-bold">عـون</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              ثبت تطبيق عـون على جهازك
            </p>
            <p className="mt-1 text-xs leading-5 text-surface-600 dark:text-surface-300">
              افتحه بسرعة من الشاشة الرئيسية واحصل على تجربة كاملة بدون تبويب
              المتصفح.
            </p>

            {canShowIosHint && !deferredPrompt ? (
              <p className="mt-2 text-xs text-primary-700 dark:text-primary-300">
                على iPhone/iPad: اضغط زر المشاركة ثم اختر &quot;Add to Home
                Screen&quot;.
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-2">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  ثبت التطبيق
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-surface-200 px-3 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
