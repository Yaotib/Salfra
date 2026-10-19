// web/src/app/admin/(panel)/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";

export default async function Dashboard() {
  const [c] = await sql<any[]>`select
    (select count(*) from stories where status = 'awaiting_review')::int as awaiting,
    (select count(*) from stories where status = 'awaiting_review' and (cardinality(risk_flags) > 0 or review_priority > 0))::int as high_risk,
    (select count(*) from stories where needs_attention is not null and status <> 'withdrawn')::int as attention,
    (select count(*) from stories where status in ('published','updated') and published_at > now() - interval '24 hours')::int as published_24h,
    (select count(*) from source_articles where state in ('failed','quarantined') and collected_at > now() - interval '7 days')::int as problem_articles,
    (select count(*) from source_articles where state = 'held')::int as held,
    (select count(*) from sources where status = 'active')::int as sources_active,
    (select count(*) from sources where status = 'paused')::int as sources_paused,
    (select count(distinct a.id) from source_articles a join story_articles sa on sa.article_id = a.id
       join stories s on s.id = sa.story_id where a.link_status = 'broken' and s.status in ('published','updated'))::int as broken_links,
    (select count(*) from llm_usage where at >= date_trunc('day', now()))::int as llm_calls_today,
    pg_database_size(current_database())::float8 as db_bytes`;
  const settings = Object.fromEntries((await sql<any[]>`select key, value from settings`).map((r) => [r.key, r.value]));
  const runs = await sql<any[]>`select started_at, status, trigger, stats, error from runs order by started_at desc limit 6`;
  const dbPct = (c.db_bytes / (Number(settings.db_limit_mb) * 1024 * 1024)) * 100;
  return (
    <>
      <h1>Dashboard</h1>
      {settings.publishing_paused && <p className="notice" role="alert"><strong>Publishing is PAUSED (kill switch on).</strong></p>}
      {settings.collection_paused && <p className="notice" role="alert"><strong>Collection is paused.</strong></p>}
      <ul>
        <li>Awaiting review: <strong>{c.awaiting}</strong> ({c.high_risk} high-risk or limited; queue limit {String(settings.review_queue_max)})</li>
        <li>Stories needing attention (corrections, source changes, proposals): <strong>{c.attention}</strong></li>
        <li>Published in the last 24 hours: {c.published_24h} (daily cap {String(settings.max_stories_per_day)})</li>
        <li>Held items: {c.held} · Failed or quarantined (7 days): {c.problem_articles}</li>
        <li>Sources: {c.sources_active} active, {c.sources_paused} paused · Broken source links on live stories: {c.broken_links}</li>
        <li>AI calls today: {c.llm_calls_today} of {String(settings.llm_daily_call_budget)}</li>
        <li>Database: {(c.db_bytes / 1024 / 1024).toFixed(0)} MB ({dbPct.toFixed(0)}% of {String(settings.db_limit_mb)} MB)</li>
        <li>Auto-publish: {settings.auto_publish_enabled ? "ON" : "off"}</li>
      </ul>
      <h2>Recent runs</h2>
      <table><thead><tr><th>Started</th><th>Status</th><th>Trigger</th><th>Stats</th></tr></thead><tbody>
        {runs.map((r, i) => (<tr key={i}><td>{formatTime(r.started_at)}</td><td>{r.status}</td><td>{r.trigger}</td>
          <td>{r.error ?? JSON.stringify(r.stats)}</td></tr>))}
      </tbody></table>
    </>
  );
}