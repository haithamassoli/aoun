import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import Link from "next/link";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderAuth } from "@/components/header-auth";
import { getSessionToken } from "@/app/actions/auth";
import { PWARegister } from "@/components/pwa-register";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { VisitorTracker } from "@/components/visitor-tracker";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PublicRouteFrame } from "@/components/public-route-frame";
import { PublicShellChrome } from "@/components/public-shell-chrome";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "عون — مصادر أكاديمية للجامعات الأردنية",
    template: "%s — عون",
  },
  description:
    "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
  manifest: "/manifest.json",
  keywords: [
    "عون",
    "الجامعات الأردنية",
    "التكنو",
    "الأردنية",
    "الهاشمية",
    "اليرموك",
    "مصادر أكاديمية",
    "ملخصات",
    "امتحانات",
    "طلاب جامعات أردنية",
    "مراجعات أكاديمية",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "عون",
  },
  openGraph: {
    type: "website",
    locale: "ar_JO",
    siteName: "عون",
    title: "عون — مصادر أكاديمية للجامعات الأردنية",
    description:
      "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "عون — مصادر أكاديمية للجامعات الأردنية",
    description:
      "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionToken = await getSessionToken();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${ibmPlexArabic.className} font-sans antialiased`}>
        <PWARegister />
        <PWAInstallBanner />
        <ThemeProvider>
          <ConvexClientProvider sessionToken={sessionToken}>
            <VisitorTracker />
            <PublicShellChrome />
            <div className="flex min-h-screen flex-col">
              <header className="hidden border-b border-surface-200/80 bg-white/72 backdrop-blur-xl md:sticky md:top-0 md:z-50 md:block dark:border-surface-700/80 dark:bg-surface-950/72">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                  <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      عـون
                    </span>
                  </Link>
                  <nav
                    aria-label="التنقل الرئيسي"
                    className="flex items-center gap-1 text-sm font-medium text-surface-600 dark:text-surface-300"
                  >
                    <Link
                      href="/courses"
                      className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-100 hover:text-primary-600 dark:hover:bg-surface-800 dark:hover:text-primary-400 sm:block"
                    >
                      بحث المواد
                    </Link>
                    <Link
                      href="/gpa-calculator"
                      className=" rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-100 hover:text-primary-600 dark:hover:bg-surface-800 dark:hover:text-primary-400 sm:block"
                    >
                      حاسبة المعدل
                    </Link>
                    <Link
                      href="/academic-planner"
                      className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-100 hover:text-primary-600 dark:hover:bg-surface-800 dark:hover:text-primary-400 sm:block"
                    >
                      التقويم
                    </Link>
                    <Link
                      href="/settings"
                      className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-100 hover:text-primary-600 dark:hover:bg-surface-800 dark:hover:text-primary-400 sm:block"
                    >
                      الإعدادات
                    </Link>
                    <HeaderAuth />
                    <ThemeToggle />
                  </nav>
                </div>
              </header>

              <main className="flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
                <PublicRouteFrame>{children}</PublicRouteFrame>
              </main>

              <MobileBottomNav />

              <footer className="hidden border-t border-surface-200 bg-surface-50 md:block dark:border-surface-700 dark:bg-surface-950">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      عون — مصادر أكاديمية مجانية لطلاب الجامعات الأردنية
                    </p>
                    <p className="text-sm text-surface-400 dark:text-surface-500">
                      مشروع تطوعي بإدارة مجتمعية
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
