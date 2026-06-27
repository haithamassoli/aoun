import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderAuth } from "@/components/header-auth";
import { getSessionToken } from "@/app/actions/auth";
import { PWARegister } from "@/components/pwa-register";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { VisitorTracker } from "@/components/visitor-tracker";
import { VisitorMilestoneCelebration } from "@/components/visitor-milestone-celebration";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PublicRouteFrame } from "@/components/public-route-frame";
import { PublicShellChrome } from "@/components/public-shell-chrome";
import { DeveloperSupportButton } from "@/components/developer-support-button";
import { FocusAudioProvider } from "@/components/focus-audio-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import { StudyTimerProvider } from "@/components/study-timer-provider";
import { BookmarksNavLink } from "@/components/bookmarks/bookmarks-nav-link";
import { JsonLd } from "@/components/json-ld";
import { thmanyahSans } from "@/fonts";
import { SITE_URL } from "@/lib/site-url";
import { STUDENT_TOOL_NAV_ITEMS } from "@/lib/student-tools-nav";
import "./globals.css";

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

const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "عون",
      url: SITE_URL,
      description:
        "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "عون",
      alternateName: "Aoun Jo Study",
      url: SITE_URL,
      inLanguage: "ar-JO",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/courses?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionToken = await getSessionToken();

  return (
    <html
      lang="ar"
      dir="rtl"
      className={thmanyahSans.variable}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <JsonLd data={siteStructuredData} />
        <PostHogProvider>
          <PWARegister />
          <PWAInstallBanner />
          <ThemeProvider>
            <ConvexClientProvider sessionToken={sessionToken}>
              <VisitorTracker />
              <VisitorMilestoneCelebration />
              <PublicShellChrome />
              <div className="flex min-h-screen flex-col">
                <header className="hidden border-b border-surface-200/80 bg-white/72 backdrop-blur-xl md:sticky md:top-0 md:z-50 md:block dark:border-surface-700/80 dark:bg-surface-950/72">
                  <nav
                    aria-label="التنقل الرئيسي"
                    className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
                  >
                    <Link href="/" className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        عــون
                      </span>
                    </Link>
                    {/* <
                      className="flex items-center gap-1 text-sm font-medium text-surface-600 dark:text-surface-300"
                    ></nav> */}

                    <div className="flex items-center gap-1 text-sm font-medium text-surface-600 dark:text-surface-300">
                      {STUDENT_TOOL_NAV_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-100 hover:text-primary-600 dark:hover:bg-surface-800 dark:hover:text-primary-400 sm:block"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <Link
                        href="/settings"
                        className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-100 hover:text-primary-600 dark:hover:bg-surface-800 dark:hover:text-primary-400 sm:block"
                      >
                        الإعـدادات
                      </Link>
                      <HeaderAuth />
                      <BookmarksNavLink />
                      <ThemeToggle />
                    </div>
                  </nav>
                </header>

                <main className="flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
                  <FocusAudioProvider>
                    <StudyTimerProvider>
                      <PublicRouteFrame>{children}</PublicRouteFrame>
                    </StudyTimerProvider>
                  </FocusAudioProvider>
                </main>

                <MobileBottomNav />

                <footer className="hidden border-t border-surface-200 bg-surface-50 md:block dark:border-surface-700 dark:bg-surface-950">
                  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        عون — مصادر أكاديـمية مجانية لطلاب الجامعات الأردنية
                      </p>
                      <DeveloperSupportButton />
                    </div>
                  </div>
                </footer>
              </div>
            </ConvexClientProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
