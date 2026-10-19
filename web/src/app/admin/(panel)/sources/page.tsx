// web/src/app/admin/(panel)/sources/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { saveSource, setSourceStatus } from "../actions";

export const dynamic = "force-dynamic";

function SourceForm({ s }: { s?: any }) {
  return (
    <form action={saveSource}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <p><label>Name <input type="text" name="name" defaultValue={s?.name} required /></label></p>
      <p><label>Canonical domain <input type="text" name="domain" defaultValue={s?.domain} required /></label></p>
      <p><label>Feed or API URL <input type="url" name="feed_url" defaultValue={s?.feed_url} required /></label></p>
      <p><label>Type <select name="source_type" defaultValue={s?.source_type ?? "publisher"}>
        {["lab_blog", "company_blog", "publisher", "research", "government", "github", "other"].map((t) => <option key={t}>{t}</option>)}</select></label>{" "}
        <label>Access <select name="access_method" defaultValue={s?.access_method ?? "rss"}>{["rss", "atom", "api"].map((t) => <option key={t}>{t}</option>)}</select></label>{" "}
        <label>Region <select name="region_hint" defaultValue={s?.region_hint ?? "global"}>{["global", "africa", "ghana"].map((t) => <option key={t}>{t}</option>)}</select></label></p>
      <p><label><input type="checkbox" name="is_primary" defaultChecked={s?.is_primary} /> Official or primary source</label>{" "}
        <label><input type="checkbox" name="allow_fulltext" defaultChecked={s?.allow_fulltext} /> Full-page fetch allowed by its terms</label></p>
      <p><label>Terms URL <input type="url" name="terms_url" defaultValue={s?.terms_url ?? ""} /></label></p>
      <p><label>Terms review notes (what is permitted)<textarea name="terms_notes" defaultValue={s?.terms_notes ?? ""} /></label></p>
      <p><label>Terms last reviewed <input type="date" name="terms_reviewed_at" defaultValue={s?.terms_reviewed_at ? new Date(s.terms_reviewed_at).toISOString().slice(0, 10) : ""} /></label>{" "}
        <label>Poll every (minutes, optional) <input type="number" name="poll_interval_minutes" defaultValue={s?.poll_interval_minutes ?? ""} /></label></p>
      <button>{s ? "Save changes" : "Add source (starts paused)"}</button>
    </form>
  );
}

export default async function Sources({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const sources = await sql<any[]>`select * from sources order by status, name`;
  return (
    <>
      <h1>Sources</h1>
      {msg && <p role="status" className="notice">{msg}</p>}
      <p className="meta">A source cannot be active until a terms review date is recorded. Access denials pause a source immediately, and resuming it is your decision.</p>
      {sources.map((s) => (
        <details key={s.id}><summary><strong>{s.name}</strong> · {s.status}{s.paused_reason && <> · paused: {s.paused_reason}</>} · failures {s.failure_count} · last success {s.last_success_at ? formatTime(s.last_success_at) : "never"}</summary>
          <SourceForm s={s} />
          {["active", "paused", "disabled"].filter((t) => t !== s.status).map((t) => (
            <form key={t} action={setSourceStatus} className="inline"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="to" value={t} />
              <button>{t === "active" ? "Enable / resume" : t === "paused" ? "Pause" : "Disable"}</button></form>
          ))}
        </details>
      ))}
      <h2>Add a source</h2><SourceForm />
    </>
  );
}