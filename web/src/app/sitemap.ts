// web/src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";
import { SITE_URL } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { INFO_SLUGS } from "@/lib/pages";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await sql<{ slug: string; modified_at: Date }[]>`
    select slug, modified_at from stories where status in ('published','updated') order by first_reported_at desc limit 5000`;
  const fixed = ["", "/stories", ...CATEGORIES.map((c) => `/category/${c.slug}`), "/region/ghana", "/region/africa", ...INFO_SLUGS.map((s) => `/${s}`)];
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...rows.map((r) => ({ url: `${SITE_URL}/stories/${r.slug}`, lastModified: r.modified_at })),
  ];
}