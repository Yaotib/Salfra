
import type { Metadata } from "next";
import Link from "next/link";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/format";
import MobileMenu from "@/components/MobileMenu";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: AI and technology news, summarised`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Curated AI and technology news, including Ghana and Africa. AI-generated summaries that link to the original reporting.",
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FOOTER = [
  ["/about", "About"],
  ["/methodology", "Methodology & AI disclosure"],
  ["/corrections", "Corrections"],
  ["/sources", "Sources"],
  ["/contact", "Contact"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/region/ghana", "Ghana"],
  ["/region/africa", "Africa"],
  ["/feed.xml", "RSS"],
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className="min-h-screen overflow-x-clip bg-white font-sans text-gray-950 antialiased">
        <a
          className="skip focus-visible:z-[100] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          href="#main"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-16 items-center justify-between py-2 sm:min-h-[4.5rem]">
              <Link
                href="/"
                className="group flex min-w-0 shrink-0 flex-col no-underline hover:no-underline"
                aria-label={`${SITE_NAME} home`}
              >
                <span className="text-xl font-extrabold tracking-tight text-gray-950 transition-colors group-hover:text-blue-700 sm:text-2xl">
                  {SITE_NAME}
                  <span className="text-blue-700">.</span>
                </span>

                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500 sm:text-[10px] sm:tracking-[0.2em]">
                  AI &amp; technology briefing
                </span>
              </Link>

              <div className="md:hidden">
                <MobileMenu />
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="w-full min-w-0">
          {children}
        </main>

        <footer className="mt-10 border-t border-gray-200 bg-gray-50 sm:mt-12">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <div className="grid min-w-0 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
              <div className="min-w-0">
                <Link
                  href="/"
                  className="inline-block text-xl font-extrabold tracking-tight text-gray-950 no-underline hover:text-blue-700 hover:no-underline"
                >
                  {SITE_NAME}
                  <span className="text-blue-700">.</span>
                </Link>

                <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600 sm:leading-7">
                  AI and technology news, curated and summarised, with links
                  to original reporting and a focus on developments that matter.
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 sm:tracking-[0.18em]">
                  Explore SALFRA
                </p>

                <nav
                  aria-label="Footer navigation"
                  className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
                >
                  {FOOTER.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="inline-flex min-h-11 min-w-0 items-center py-2 text-sm font-medium leading-5 text-gray-600 no-underline transition-colors hover:text-blue-700 hover:no-underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:min-h-9"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            <div className="mt-7 border-t border-gray-200 pt-5 sm:mt-9">
              <p className="max-w-3xl text-xs leading-5 text-gray-500 sm:leading-6">
                Summaries are AI-generated and may contain errors. Always
                check the linked original sources for context and accuracy.
              </p>

              <p className="mt-3 text-xs leading-5 text-gray-400 sm:mt-4">
                © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
