// web/src/app/[page]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listSources } from "@/lib/queries";
import { INFO_SLUGS, PAGES } from "@/lib/pages";

export const dynamicParams = false;
export const revalidate = 3600;
type P = { params: Promise<{ page: string }> };

export function generateStaticParams() { return INFO_SLUGS.map((page) => ({ page })); }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = (await params).page;
  return { title: slug === "sources" ? "Sources" : PAGES[slug]?.title };
}

export default async function Info({ params }: P) {
  const slug = (await params).page;
  if (slug === "sources") {
    const sources = await listSources();
    return (<>
      <h1>Sources</h1>
      <p>These sources are approved manually and collected only through feeds or APIs they permit. Appearing here does not mean a publisher endorses this site.</p>
      <ul>{sources.map((s) => <li key={s.domain}>{s.name} ({s.domain}){s.is_primary ? ", official source" : ""}</li>)}</ul>
    </>);
  }
  const page = PAGES[slug];
  if (!page) notFound();
  return (<><h1>{page.title}</h1>{page.paragraphs.map((t, i) => <p key={i}>{t}</p>)}</>);
}