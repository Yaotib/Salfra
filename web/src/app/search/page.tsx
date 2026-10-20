
import type { Metadata } from "next";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Search",
  robots: {
    index: false,
    follow: true,
  },
};

type SearchPageProps = {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const filters = parseFilters(await searchParams);

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Page heading */}
      <header className="border-b border-gray-200 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Discover
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
          Search
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Find AI and technology news from around the world, including
          developments in Ghana and Africa.
        </p>
      </header>

      {/* Search and results */}
      <section
        aria-label="Search AI and technology news"
        className="px-5 py-5 sm:px-6"
      >
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-950">
            Explore the news
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Enter keywords and use the available filters to narrow
            your results.
          </p>
        </div>

        <Feed
          filters={filters}
          basePath="/search"
          showSearch
        />
      </section>
    </div>
  );
}
