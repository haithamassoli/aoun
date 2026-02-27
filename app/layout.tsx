import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "عون — مصادر أكاديمية للجامعات الأردنية",
  description:
    "منصة مجانية تجمع الملخصات والامتحانات والمصادر الأكاديمية لطلاب الجامعات الأردنية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ibmPlexArabic.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-md">
              <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-600">
                    عون
                  </span>
                </a>
                <nav className="flex items-center gap-6 text-sm font-medium text-surface-600">
                  <a
                    href="/"
                    className="transition-colors hover:text-primary-600"
                  >
                    الرئيسية
                  </a>
                </nav>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-surface-200 bg-surface-50">
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <p className="text-sm text-surface-500">
                    عون — مصادر أكاديمية مجانية لطلاب الجامعات الأردنية
                  </p>
                  <p className="text-sm text-surface-400">
                    مشروع تطوعي بإدارة مجتمعية
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
