
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";

const REGIONS: Record<string, string> = {
  ghana: "Ghana",
  africa: "Africa (including Ghana)",
};

type P = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export async function generateMetadata({
  params,
}: P): Promise<Metadata> {
  const name = REGIONS[(await params).slug];

  return name
    ? {
        title: `${name} technology news`,
        description: `Discover curated AI and technology news from ${name}, with AI-generated summaries and links to original sources.`,
        alternates: {
          canonical: `/region/${(await params).slug}`,
        },
      }
    : {};
}

export default async function Region({
  params,
  searchParams,
}: P) {
  const { slug } = await params;
  const name = REGIONS[slug];

  if (!name) notFound();

  const filters = {
    ...parseFilters(await searchParams),
    region: slug,
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="border-b border-gray-200 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          SALFRA <span className="px-1.5 text-gray-300">/</span> Regions
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
          {name}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
          Follow AI and technology developments across {name}, with curated
          stories and links to the original reporting.
        </p>
      </header>

      <section aria-label={`${name} technology news`}>
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-gray-950">
            Latest stories
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Curated regional technology coverage
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <Feed
            filters={filters}
            basePath={`/region/${slug}`}
            hide={["region"]}
          />
        </div>
      </section>
    </div>
  );
}
