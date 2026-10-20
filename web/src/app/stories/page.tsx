
import type { Metadata } from "next";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Latest stories",
  description:
    "Browse the latest curated AI and technology news on SALFRA, with AI-generated summaries and links to original sources.",
  alternates: {
    canonical: "/stories",
  },
};

export default async function Stories({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const filters = parseFilters(await searchParams);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="border-b border-gray-200 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          SALFRA <span className="px-1.5 text-gray-300">/</span> News
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
          Latest stories
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
          Stay informed with curated AI and technology developments from
          around the world, including Ghana and Africa. Read the summaries
          and follow the original sources for full context.
        </p>
      </header>

      <section aria-label="Latest AI and technology stories">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-gray-950">
            News feed
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            AI, global technology, product releases, and African tech
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <Feed
            filters={filters}
            basePath="/stories"
          />
        </div>
      </section>
    </div>
  );
}
