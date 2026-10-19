// web/src/components/Feed.tsx
import Link from "next/link";
import { listSources, listStories, type Filters } from "@/lib/queries";
import { CATEGORIES } from "@/lib/types";
import { StoryCard } from "./StoryCard";

function pageHref(base: string, f: Filters, page: number) {
  const p = new URLSearchParams();
  for (const k of ["q", "category", "region", "publisher", "from", "to", "sort"] as const) {
    if (f[k]) p.set(k, f[k] as string);
  }
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function Feed({ filters, basePath, hide = [], showSearch = false }: {
  filters: Filters; basePath: string; hide?: string[]; showSearch?: boolean;
}) {
  const [{ stories, hasNext }, sources] = await Promise.all([listStories(filters), listSources()]);
  const page = filters.page ?? 1;
  return (
    <>
      <form className="filters" method="get" action={basePath} aria-label="Filter stories">
        {showSearch && <input type="search" name="q" defaultValue={filters.q} placeholder="Search AI and tech news" aria-label="Search" />}
        {!hide.includes("category") && (
          <select name="category" defaultValue={filters.category ?? ""} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        )}
        {!hide.includes("region") && (
          <select name="region" defaultValue={filters.region ?? ""} aria-label="Region">
            <option value="">All regions</option>
            <option value="africa">Africa</option>
            <option value="ghana">Ghana</option>
          </select>
        )}
        <select name="publisher" defaultValue={filters.publisher ?? ""} aria-label="Publisher">
          <option value="">All publishers</option>
          {sources.map((s) => <option key={s.domain} value={s.domain}>{s.name}</option>)}
        </select>
        <label>From <input type="date" name="from" defaultValue={filters.from} /></label>
        <label>To <input type="date" name="to" defaultValue={filters.to} /></label>
        {filters.q && (
          <select name="sort" defaultValue={filters.sort ?? ""} aria-label="Sort order">
            <option value="">Most relevant</option>
            <option value="newest">Newest first</option>
          </select>
        )}
        <button type="submit">Apply</button>
      </form>
      {stories.length === 0 ? (
        <div role="status" className="notice">
          <p>No stories match. Check the spelling, widen the date range, or remove a filter.</p>
          <p><Link href="/stories">See the latest stories</Link></p>
        </div>
      ) : stories.map((s) => <StoryCard key={s.id} s={s} />)}
      <nav className="pager" aria-label="Pagination">
        <span>{page > 1 && <Link rel="prev" href={pageHref(basePath, filters, page - 1)}>← Newer</Link>}</span>
        <span>{hasNext && <Link rel="next" href={pageHref(basePath, filters, page + 1)}>Older →</Link>}</span>
      </nav>
    </>
  );
}