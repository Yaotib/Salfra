
import Link from "next/link";
import { StoryCard } from "@/components/StoryCard";
import {
  featuredStories,
  listStories,
  updatedStories,
} from "@/lib/queries";

export const revalidate = 300;

const TOPICS = [
  { href: "/category/ai-news", label: "AI News" },
  { href: "/category/global-tech", label: "Global Tech" },
  { href: "/category/product-releases", label: "Product Releases" },
  { href: "/category/african-tech", label: "African Tech" },
];

const REGIONS = [
  { href: "/region/ghana", label: "Ghana" },
  { href: "/region/africa", label: "Africa" },
];

const LATEST_COUNT = 15;

export default async function Home() {
  const [featured, latest, updated] = await Promise.all([
    featuredStories(3),
    listStories({}),
    updatedStories(4),
  ]);

  const latestStories = latest.stories.slice(0, LATEST_COUNT);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[190px_minmax(0,600px)_300px] xl:grid-cols-[210px_minmax(0,600px)_320px]">
        {/* Left navigation */}
        <aside className="hidden border-r border-gray-200 md:block">
          <div className="sticky top-24 space-y-7 px-4 py-5">
            <nav aria-label="Main navigation">
              <ul className="list-none space-y-2 p-0">
                <li>
                  <Link
                    href="/"
                    aria-current="page"
                    className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-3 text-sm font-bold text-gray-950 no-underline"
                  >
                    <span className="text-lg" aria-hidden="true">
                      ⌂
                    </span>
                    Home
                  </Link>
                </li>

                <li>
                  <Link
                    href="/stories"
                    className="flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
                  >
                    <span className="text-lg" aria-hidden="true">
                      ≡
                    </span>
                    Latest news
                  </Link>
                </li>

                <li>
                  <Link
                    href="/search"
                    className="flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
                  >
                    <span className="text-lg" aria-hidden="true">
                      ⌕
                    </span>
                    Search
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="border-t border-gray-200 pt-5">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                Topics
              </p>

              <ul className="mt-3 list-none space-y-1 p-0">
                {TOPICS.map((topic) => (
                  <li key={topic.href}>
                    <Link
                      href={topic.href}
                      className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
                    >
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                Regions
              </p>

              <ul className="mt-3 list-none space-y-1 p-0">
                {REGIONS.map((region) => (
                  <li key={region.href}>
                    <Link
                      href={region.href}
                      className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
                    >
                      {region.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/sources"
              className="block rounded-full border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-800 no-underline transition-colors hover:bg-gray-100 hover:no-underline"
            >
              Our sources
            </Link>
          </div>
        </aside>

        {/* Central news timeline */}
        <main className="min-w-0 border-gray-200 md:border-r">
          {latestStories.length > 0 ? (
            <div>
              {latestStories.map((story) => (
                <article
                  key={story.id}
                  className="min-w-0 border-b border-gray-200 px-4 py-5 transition-colors hover:bg-gray-50/70 sm:px-5"
                >
                  <StoryCard s={story} />
                </article>
              ))}
            </div>
          ) : (
            <div role="status" className="px-6 py-16 text-center">
              <h2 className="text-xl font-bold text-gray-950">
                Your feed is getting ready
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                No stories have been published yet. Check back for curated
                AI and technology updates.
              </p>
            </div>
          )}

          <div className="border-b border-gray-200 px-5 py-6 text-center">
            <Link
              href="/stories"
              className="inline-flex w-full items-center justify-center rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-blue-700 hover:no-underline sm:w-auto"
            >
              Explore all stories
            </Link>
          </div>

          <footer className="px-5 py-6">
            <p className="text-xs leading-5 text-gray-500">
              SALFRA uses AI-generated summaries to help you discover news
              faster. Summaries may contain errors. Check original sources
              for full context and accuracy.
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
              <Link href="/about" className="no-underline hover:underline">
                About
              </Link>
              <Link
                href="/methodology"
                className="no-underline hover:underline"
              >
                Methodology
              </Link>
              <Link
                href="/corrections"
                className="no-underline hover:underline"
              >
                Corrections
              </Link>
              <Link href="/privacy" className="no-underline hover:underline">
                Privacy
              </Link>
            </div>
          </footer>
        </main>

        {/* Right discovery sidebar */}
        <aside className="hidden min-w-0 space-y-5 px-4 py-5 lg:block">
          <form
            action="/search"
            method="get"
            role="search"
            className="flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 transition-colors focus-within:border-blue-500 focus-within:bg-white"
          >
            <span aria-hidden="true" className="text-lg text-gray-400">
              ⌕
            </span>

            <input
              type="search"
              name="q"
              placeholder="Search SALFRA"
              aria-label="Search SALFRA"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
            />
          </form>

          {featured.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="px-4 py-4">
                <h2 className="text-lg font-extrabold tracking-tight text-gray-950">
                  Featured
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Selected AI and technology stories
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {featured.map((story) => (
                  <article key={story.id} className="px-4 py-4">
                    <Link
                      href={`/stories/${story.slug}`}
                      className="text-sm font-bold leading-6 text-gray-900 no-underline transition-colors hover:text-blue-700 hover:no-underline"
                    >
                      {story.headline}
                    </Link>

                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">
                      {story.card_summary}
                    </p>
                  </article>
                ))}
              </div>

              <Link
                href="/stories"
                className="block border-t border-gray-200 px-4 py-3 text-sm font-medium text-blue-700 no-underline hover:bg-gray-50 hover:no-underline"
              >
                See all stories →
              </Link>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="px-4 py-4">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-950">
                Explore SALFRA
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {REGIONS.map((region) => (
                <Link
                  key={region.href}
                  href={region.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-800 no-underline transition-colors hover:bg-gray-50 hover:no-underline"
                >
                  <span>{region.label} technology news</span>
                  <span aria-hidden="true" className="text-gray-400">
                    →
                  </span>
                </Link>
              ))}

              {TOPICS.map((topic) => (
                <Link
                  key={topic.href}
                  href={topic.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-800 no-underline transition-colors hover:bg-gray-50 hover:no-underline"
                >
                  <span>{topic.label}</span>
                  <span aria-hidden="true" className="text-gray-400">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {updated.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="px-4 py-4">
                <h2 className="text-lg font-extrabold tracking-tight text-gray-950">
                  Recently updated
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {updated.map((story) => (
                  <article key={story.id} className="px-4 py-3">
                    <Link
                      href={`/stories/${story.slug}`}
                      className="text-sm font-semibold leading-5 text-gray-800 no-underline transition-colors hover:text-blue-700 hover:no-underline"
                    >
                      {story.headline}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          <p className="px-1 text-xs leading-5 text-gray-400">
            Summaries are AI-generated. Follow the original sources to
            verify important details.
          </p>
        </aside>
      </div>
    </div>
  );
}
