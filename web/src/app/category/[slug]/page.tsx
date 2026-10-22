
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";
import { CATEGORIES } from "@/lib/types";

type P = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export async function generateMetadata({
  params,
}: P): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);

  return cat
    ? {
        title: cat.name,
        description: `Explore the latest ${cat.name.toLowerCase()} stories on SALFRA, with AI-generated summaries and links to original sources.`,
        alternates: {
          canonical: `/category/${cat.slug}`,
        },
      }
    : {};
}

export default async function Category({
  params,
  searchParams,
}: P) {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);

  if (!cat) notFound();

  const filters = {
    ...parseFilters(await searchParams),
    category: slug,
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="border-b border-gray-200 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          SALFRA <span className="px-1.5 text-gray-300">/</span> Categories
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
          {cat.name}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
          Explore the latest developments, discover what matters, and follow
          the original sources for the full story.
        </p>
      </header>

      <section aria-label={`${cat.name} news`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Latest stories
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Curated {cat.name.toLowerCase()} coverage
            </p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <Feed
            filters={filters}
            basePath={`/category/${slug}`}
            hide={["category"]}
          />
        </div>
      </section>
    </div>
  );
}
