import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import Link from "next/link";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderAuth } from "@/components/header-auth";
import { getSessionToken } from "@/app/actions/auth";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aoun.jo";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "عون — مصادر أكاديمية للجامعات الأردنية",
    template: "%s — عون",
  },
  description:
    "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
  manifest: "/manifest.json",
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
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "عون — مصادر أكاديمية للجامعات الأردنية",
    description:
      "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
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
        <ThemeProvider>
          <ConvexClientProvider sessionToken={sessionToken}>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-md dark:border-surface-700 dark:bg-surface-950/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                  <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      عون
                    </span>
                  </Link>
                  <nav
                    aria-label="التنقل الرئيسي"
                    className="flex items-center gap-4 text-sm font-medium text-surface-600 dark:text-surface-300"
                  >
                    <Link
                      href="/"
                      className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      الرئيسية
                    </Link>
                    <HeaderAuth />
                    <ThemeToggle />
                  </nav>
                </div>
              </header>

              <main className="flex-1">{children}</main>

              <footer className="border-t border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-950">
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
