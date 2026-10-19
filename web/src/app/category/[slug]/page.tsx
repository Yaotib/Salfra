// web/src/app/category/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/Feed";
import { parseFilters } from "@/lib/queries";
import { CATEGORIES } from "@/lib/types";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? { title: cat.name, alternates: { canonical: `/category/${cat.slug}` } } : {};
}

export default async function Category({ params, searchParams }: P) {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) notFound();
  const filters = { ...parseFilters(await searchParams), category: slug };
  return (<><h1>{cat.name}</h1><Feed filters={filters} basePath={`/category/${slug}`} hide={["category"]} /></>);
}