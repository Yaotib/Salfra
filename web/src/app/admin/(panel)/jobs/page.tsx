// web/src/app/admin/(panel)/jobs/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { reopenArticle, retryJob } from "../actions";

export const dynamic = "force-dynamic";

export default async function Jobs({ searchParams }: { searchParams: Promise<{ msg?: string; state?: string }> }) {
  const { msg, state } = await searchParams;
  const show = ["rejected", "held", "failed", "quarantined"].includes(state ?? "") ? state! : "held";
  const [runs, jobs, items] = await Promise.all([
    sql<any[]>`select started_at, finished_at, status, trigger, stats, error from runs order by started_at desc limit 20`,
    sql<any[]>`select id, job_type, status, attempts, error, created_at from jobs order by created_at desc limit 20`,
    sql<any[]>`select a.id, a.title, a.reason, a.reject_kind, a.attempts, a.collected_at, a.canonical_url, s.name as publisher
      from source_articles a join sources s on s.id = a.source_id
      where a.state = ${show} order by a.collected_at desc limit 50`,
  ]);
  return (
    <>
      <h1>Jobs and items</h1>
      {msg && <p role="status" className="notice">{msg}</p>}
      <h2>Collection runs</h2>
      <table><thead><tr><th>Started</th><th>Finished</th><th>Status</th><th>Trigger</th><th>Stats / error</th></tr></thead><tbody>
        {runs.map((r, i) => (<tr key={i}><td>{formatTime(r.started_at)}</td><td>{r.finished_at ? formatTime(r.finished_at) : "-"}</td><td>{r.status}</td><td>{r.trigger}</td><td>{r.error ?? JSON.stringify(r.stats)}</td></tr>))}
      </tbody></table>
      <h2>Background jobs</h2>
      <table><thead><tr><th>Type</th><th>Status</th><th>Attempts</th><th>Error</th><th>Created</th><th></th></tr></thead><tbody>
        {jobs.map((j) => (<tr key={j.id}><td>{j.job_type}</td><td>{j.status}</td><td>{j.attempts}</td><td>{j.error}</td><td>{formatTime(j.created_at)}</td>
          <td>{j.status === "failed" && <form action={retryJob}><input type="hidden" name="id" value={j.id} /><button>Retry</button></form>}</td></tr>))}
      </tbody></table>
      <h2>Collected items</h2>
      <nav aria-label="Item state">{["held", "failed", "quarantined", "rejected"].map((st) => <a key={st} href={`/admin/jobs?state=${st}`}>{st}{st === show ? " (showing)" : ""}</a>)}</nav>
      <table><thead><tr><th>Item</th><th>Publisher</th><th>Reason</th><th>Reopen</th></tr></thead><tbody>
        {items.map((a) => (
          <tr key={a.id}><td><a href={a.canonical_url} target="_blank" rel="noopener noreferrer">{a.title}</a><br /><span className="meta">{formatTime(a.collected_at)} · attempts {a.attempts}</span></td>
            <td>{a.publisher}</td><td>{a.reject_kind ? `${a.reject_kind}: ` : ""}{a.reason}</td>
            <td>{show !== "quarantined" && (
              <form action={reopenArticle}><input type="hidden" name="id" value={a.id} /><input type="text" name="reason" placeholder="Why reopen?" /> <button>Reopen</button></form>)}</td></tr>
        ))}
      </tbody></table>
      <p className="meta">Quarantined items, and rejections for security or malformed data, cannot be reopened from here. The database blocks it on purpose.</p>
    </>
  );
}