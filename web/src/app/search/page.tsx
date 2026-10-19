// web/src/app/search/page.tsx
import type { Metadata } from "next";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);
  return (<><h1>Search</h1><Feed filters={filters} basePath="/search" showSearch /></>);
}