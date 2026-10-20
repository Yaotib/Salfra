
import Link from "next/link";
import { listSources, listStories, type Filters } from "@/lib/queries";
import { CATEGORIES } from "@/lib/types";
import { StoryCard } from "./StoryCard";

function pageHref(base: string, f: Filters, page: number) {
  const params = new URLSearchParams();

  for (const key of [
    "q",
    "category",
    "region",
    "publisher",
    "from",
    "to",
    "sort",
  ] as const) {
    if (f[key]) params.set(key, f[key] as string);
  }

  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export async function Feed({
  filters,
  basePath,
  hide = [],
  showSearch = false,
}: {
  filters: Filters;
  basePath: string;
  hide?: string[];
  showSearch?: boolean;
}) {
  const [{ stories, hasNext }, sources] = await Promise.all([
    listStories(filters),
    listSources(),
  ]);

  const page = filters.page ?? 1;

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.region ||
      filters.publisher ||
      filters.from ||
      filters.to ||
      filters.sort,
  );

  return (
    <div className="w-full min-w-0">
      <form
        className="mb-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
        method="get"
        action={basePath}
        aria-label="Filter stories"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-950">
              Refine your feed
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Find stories by topic, region, publisher, or date.
            </p>
          </div>

          {hasActiveFilters && (
            <Link
              href={basePath}
              className="text-xs font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showSearch && (
            <div className="sm:col-span-2">
              <label
                htmlFor="feed-search"
                className="mb-1.5 block text-xs font-semibold text-gray-700"
              >
                Search stories
              </label>
              <input
                id="feed-search"
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Search AI and technology news..."
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {!hide.includes("category") && (
            <div>
              <label
                htmlFor="feed-category"
                className="mb-1.5 block text-xs font-semibold text-gray-700"
              >
                Category
              </label>
              <select
                id="feed-category"
                name="category"
                defaultValue={filters.category ?? ""}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!hide.includes("region") && (
            <div>
              <label
                htmlFor="feed-region"
                className="mb-1.5 block text-xs font-semibold text-gray-700"
              >
                Region
              </label>
              <select
                id="feed-region"
                name="region"
                defaultValue={filters.region ?? ""}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All regions</option>
                <option value="africa">Africa</option>
                <option value="ghana">Ghana</option>
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="feed-publisher"
              className="mb-1.5 block text-xs font-semibold text-gray-700"
            >
              Publisher
            </label>
            <select
              id="feed-publisher"
              name="publisher"
              defaultValue={filters.publisher ?? ""}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All publishers</option>
              {sources.map((source) => (
                <option key={source.domain} value={source.domain}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="feed-from"
              className="mb-1.5 block text-xs font-semibold text-gray-700"
            >
              Published from
            </label>
            <input
              id="feed-from"
              type="date"
              name="from"
              defaultValue={filters.from}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="feed-to"
              className="mb-1.5 block text-xs font-semibold text-gray-700"
            >
              Published to
            </label>
            <input
              id="feed-to"
              type="date"
              name="to"
              defaultValue={filters.to}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {filters.q && (
            <div>
              <label
                htmlFor="feed-sort"
                className="mb-1.5 block text-xs font-semibold text-gray-700"
              >
                Sort results
              </label>
              <select
                id="feed-sort"
                name="sort"
                defaultValue={filters.sort ?? ""}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Most relevant</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-gray-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Apply filters
          </button>
        </div>
      </form>

      {stories.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-gray-300 px-5 py-12 text-center"
        >
          <div
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500"
          >
            <span>⌕</span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-gray-950">
            No stories found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
            Try a different search, widen your date range, or remove some
            filters to discover more AI and technology news.
          </p>

          <Link
            href={basePath}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
          >
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className="min-w-0">
          {stories.map((story) => (
            <StoryCard key={story.id} s={story} />
          ))}
        </div>
      )}

      <nav
        className="mt-5 flex items-center justify-between gap-4 border-t border-gray-200 py-5"
        aria-label="Story pagination"
      >
        <div>
          {page > 1 && (
            <Link
              rel="prev"
              href={pageHref(basePath, filters, page - 1)}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
            >
              ← Newer stories
            </Link>
          )}
        </div>

        <span className="text-xs text-gray-500">Page {page}</span>

        <div>
          {hasNext && (
            <Link
              rel="next"
              href={pageHref(basePath, filters, page + 1)}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
            >
              Older stories →
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
