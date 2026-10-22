import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/format";
import { ThemeToggle } from "@/components/ThemeToggle";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: AI and technology news, summarised`, template: `%s · ${SITE_NAME}` },
  description: "Curated AI and technology news, including Ghana and Africa. AI-generated summaries that link to the original reporting.",
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

const NAV = [
  ["/stories", "Latest"],
  ["/category/ai-news", "AI News"],
  ["/category/global-tech", "Global Tech"],
  ["/category/product-releases", "Product Releases"],
  ["/category/african-tech", "African Tech"],
  ["/search", "Search"],
];

const FOOTER = [
  ["/about", "About"],
  ["/methodology", "Methodology and AI disclosure"],
  ["/corrections", "Corrections"],
  ["/sources", "Sources"],
  ["/contact", "Contact"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/region/ghana", "Ghana"],
  ["/region/africa", "Africa"],
  ["/feed.xml", "RSS"],
];

const themeScript = `(function() {
  try {
    var saved = localStorage.getItem('salfra-theme');
    var theme = saved;
    if (!theme || (theme !== 'light' && theme !== 'dark' && theme !== 'eye-protection')) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (err) {
    console.warn('Initial theme application degraded:', err);
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${newsreader.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site">
          <div className="wrap">
            <Link className="brand" href="/">{SITE_NAME}</Link>
            <div className="header-nav-wrap">
              <nav className="main" aria-label="Main">
                {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main id="main" className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap">
            <p>Summaries are AI-generated and may contain errors. Always check the linked original sources.</p>
            <nav aria-label="Footer">
              {FOOTER.map(([href, label]) => <span key={href}><Link href={href}>{label}</Link>{" · "}</span>)}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}