// web/src/lib/queries.ts
import { sql } from "./db";
import { CATEGORIES, type SourceRef, type StoryCardData, type StoryFull } from "./types";

export type Filters = { q?: string; category?: string; region?: string; publisher?: string; from?: string; to?: string; sort?: string; page?: number };
export const PAGE_SIZE = 20;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LIVE = sql`status in ('published','updated')`;

const cardCols = () => sql`id, slug, headline, card_summary, categories, region, evidence_label, is_limited, status,
  first_reported_at, last_material_update_at,
  media_url, media_type, media_source_name, media_source_url, media_alt_text, media_license,
  (select coalesce(array_agg(distinct s.name), '{}') from story_articles sa
     join source_articles a on a.id = sa.article_id join sources s on s.id = a.source_id
     where sa.story_id = stories.id) as publishers`;

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const page = Number.parseInt(one("page") ?? "1", 10);
  return {
    q: one("q")?.slice(0, 100), category: one("category"), region: one("region"), publisher: one("publisher"),
    from: one("from"), to: one("to"), sort: one("sort"),
    page: Number.isFinite(page) && page > 0 && page < 1000 ? page : 1,
  };
}

export async function listStories(f: Filters): Promise<{ stories: StoryCardData[]; hasNext: boolean }> {
  const page = f.page ?? 1;
  const conds = [sql`status in ('published','updated')`];
  const cat = CATEGORIES.find((c) => c.slug === f.category)?.name;
  if (cat) conds.push(sql`${cat} = any(categories)`);
  if (f.region === "africa") conds.push(sql`region in ('africa','ghana')`);
  if (f.region === "ghana") conds.push(sql`region = 'ghana'`);
  if (f.publisher) {
    conds.push(sql`exists (select 1 from story_articles sa join source_articles a on a.id = sa.article_id
      join sources s on s.id = a.source_id where sa.story_id = stories.id and s.domain = ${f.publisher})`);
  }
  if (f.from && DATE_RE.test(f.from)) conds.push(sql`first_reported_at >= ${f.from}::date`);
  if (f.to && DATE_RE.test(f.to)) conds.push(sql`first_reported_at < (${f.to}::date + 1)`);
  const q = f.q?.trim();
  if (q) conds.push(sql`search @@ websearch_to_tsquery('english', ${q})`);
  const where = conds.reduce((acc, c) => sql`${acc} and ${c}`);
  const order = q && f.sort !== "newest"
    ? sql`ts_rank(search, websearch_to_tsquery('english', ${q})) desc, first_reported_at desc`
    : sql`first_reported_at desc`;
  const rows = await sql<StoryCardData[]>`select ${cardCols()} from stories where ${where} order by ${order}
    limit ${PAGE_SIZE + 1} offset ${(page - 1) * PAGE_SIZE}`;
  return { stories: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
}

export const featuredStories = (n: number) =>
  sql<StoryCardData[]>`select ${cardCols()} from stories where ${LIVE} and featured order by first_reported_at desc limit ${n}`;

export const updatedStories = (n: number) =>
  sql<StoryCardData[]>`select ${cardCols()} from stories where status = 'updated' order by last_material_update_at desc limit ${n}`;

export async function getStory(slug: string): Promise<StoryFull | null> {
  const rows = await sql<StoryFull[]>`select ${cardCols()}, body, story_type, published_at, withdrawn_reason,
      (select m.slug from stories m where m.id = stories.merged_into) as merged_slug
    from stories where slug = ${slug}
      and (status in ('published','updated')
           or (status = 'withdrawn' and published_at is not null and withdrawn_reason is not null)
           or (status = 'withdrawn' and merged_into is not null))`;
  return rows[0] ?? null;
}

export async function getStoryDetail(id: string) {
  const [sources, corrections, links, related] = await Promise.all([
    sql<SourceRef[]>`select s.name as publisher, s.domain, a.title, a.canonical_url as url, a.published_at, sa.role, sa.is_syndicated
      from story_articles sa join source_articles a on a.id = sa.article_id join sources s on s.id = a.source_id
      where sa.story_id = ${id}
      order by case sa.role when 'primary' then 0 when 'independent' then 1 else 2 end, a.published_at nulls last`,
    sql<{ note: string; created_at: Date }[]>`select note, created_at from story_corrections
      where story_id = ${id} and is_public order by created_at desc`,
    sql<{ slug: string; headline: string; kind: string }[]>`
      select s.slug, s.headline, 'earlier' as kind from story_links l join stories s on s.id = l.to_story
        where l.from_story = ${id} and s.status in ('published','updated')
      union all
      select s.slug, s.headline, 'follow_up' as kind from story_links l join stories s on s.id = l.from_story
        where l.to_story = ${id} and s.status in ('published','updated')`,
    sql<{ slug: string; headline: string; first_reported_at: Date }[]>`
      select slug, headline, first_reported_at from stories
      where id <> ${id} and status in ('published','updated')
        and entity_keys && (select entity_keys from stories where id = ${id})
      order by first_reported_at desc limit 4`,
  ]);
  return { sources, corrections, links, related };
}

export const listSources = () =>
  sql<{ name: string; domain: string; source_type: string; is_primary: boolean; region_hint: string }[]>`
    select name, domain, source_type, is_primary, region_hint from sources where status = 'active' order by name`;