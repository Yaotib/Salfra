// web/src/app/region/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";

const REGIONS: Record<string, string> = { ghana: "Ghana", africa: "Africa (including Ghana)" };
type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const name = REGIONS[(await params).slug];
  return name ? { title: `${name} technology news` } : {};
}

export default async function Region({ params, searchParams }: P) {
  const { slug } = await params;
  if (!REGIONS[slug]) notFound();
  const filters = { ...parseFilters(await searchParams), region: slug };
  return (<><h1>{REGIONS[slug]}</h1><Feed filters={filters} basePath={`/region/${slug}`} hide={["region"]} /></>);
}