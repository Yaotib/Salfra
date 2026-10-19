// web/src/app/admin/(panel)/stories/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { applyProposal, dismissAttention, mergeStories, rejectProposal, requestRegeneration, saveEdit, setStoryStatus, splitArticle } from "../../actions";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

export default async function StoryEditor({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }>;
}) {
  const { id } = await params;
  const { msg } = await searchParams;
  if (!UUID.test(id)) notFound();
  const [s] = await sql<any[]>`select * from stories where id = ${id}`;
  if (!s) notFound();
  const [articles, versions, corrections, events] = await Promise.all([
    sql<any[]>`select a.id, a.title, a.canonical_url, a.excerpt, a.published_at, a.source_changed_at, a.link_status,
        so.name as publisher, sa.role, sa.is_syndicated
      from story_articles sa join source_articles a on a.id = sa.article_id join sources so on so.id = a.source_id
      where sa.story_id = ${id} order by sa.role, a.published_at`,
    sql<any[]>`select * from story_versions where story_id = ${id} order by version desc`,
    sql<any[]>`select note, is_public, created_by, created_at from story_corrections where story_id = ${id} order by created_at desc`,
    sql<any[]>`select at, actor, action, note from audit_events where target_type = 'story' and target_id = ${id} order by at desc limit 15`,
  ]);
  const current = versions.find((v) => v.status === "current");
  const proposals = versions.filter((v) => v.status === "proposed");
  const live = ["published", "updated"].includes(s.status);
  const b = s.body ?? {};
  return (
    <>
      <h1>{s.headline}</h1>
      {msg && <p role="status" className="notice">{msg}</p>}
      <p>Status: <strong>{s.status}</strong> · Evidence: {s.evidence_label} · Region: {s.region} · Flags: {s.risk_flags.join(", ") || "none"}
        {s.needs_attention && <> · <strong>Needs attention: {s.needs_attention}</strong></>}</p>
      {live && <p><a href={`/stories/${s.slug}`}>View public page</a></p>}

      <section><h2>Actions</h2>
        {["awaiting_review", "approved"].includes(s.status) && (
          <form action={setStoryStatus} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="published" /><button>Approve and publish</button></form>
        )}
        {live && (
          <form action={setStoryStatus} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="awaiting_review" /><button>Unpublish (back to review)</button></form>
        )}
        {s.status === "withdrawn" && !s.merged_into && (
          <form action={setStoryStatus} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="awaiting_review" /><button>Restore to review</button></form>
        )}
        {s.status === "awaiting_review" && (
          <form action={setStoryStatus} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="draft" /><button>Hold (back to draft)</button></form>
        )}
        <form action={setStoryStatus}>
          <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="withdrawn" />
          <label>Withdraw with a public reason <input type="text" name="reason" /></label> <button className="danger">Withdraw</button>
        </form>
        <form action={requestRegeneration} className="inline"><input type="hidden" name="id" value={id} /><button>Request regenerated summary</button></form>
        {s.needs_attention && (
          <form action={dismissAttention}><input type="hidden" name="id" value={id} />
            <label>Dismiss flag, reason: <input type="text" name="reason" /></label> <button>Dismiss</button></form>
        )}
      </section>

      {proposals.map((p) => (
        <section key={p.id} className="notice"><h2>Proposed revision v{p.version}</h2>
          <p><strong>{p.headline}</strong></p><p>{p.card_summary}</p>
          <p className="prewrap">{p.body.what_happened}</p><p className="prewrap">{p.body.why_it_matters}</p><p className="prewrap">{p.body.uncertain}</p>
          <p className="meta">Reason: {p.reason} · Check every claim against the sources below before applying.</p>
          <form action={applyProposal}><input type="hidden" name="id" value={id} /><input type="hidden" name="version_id" value={p.id} />
            {live && <label>Public update note (required, story is live) <input type="text" name="correction_note" /></label>} <button>Apply</button></form>
          <form action={rejectProposal}><input type="hidden" name="id" value={id} /><input type="hidden" name="version_id" value={p.id} /><button>Reject proposal</button></form>
        </section>
      ))}

      <section><h2>Edit</h2>
        <form action={saveEdit}>
          <input type="hidden" name="id" value={id} />
          <p><label>Headline<input type="text" name="headline" defaultValue={s.headline} /></label></p>
          <p><label>Card summary (2-3 sentences)<textarea name="card_summary" defaultValue={s.card_summary} /></label></p>
          <p><label>What happened<textarea name="what_happened" defaultValue={b.what_happened ?? ""} /></label></p>
          <p><label>Why it matters<textarea name="why_it_matters" defaultValue={b.why_it_matters ?? ""} /></label></p>
          <p><label>What remains uncertain<textarea name="uncertain" defaultValue={b.uncertain ?? ""} /></label></p>
          <fieldset><legend>Categories</legend>
            {CATEGORIES.map((c) => (<label key={c.slug}><input type="checkbox" name="categories" value={c.name} defaultChecked={s.categories.includes(c.name)} /> {c.name} </label>))}
          </fieldset>
          <p><label>Region <select name="region" defaultValue={s.region}><option>global</option><option>africa</option><option>ghana</option></select></label></p>
          <p><label><input type="checkbox" name="material" /> Material correction (shows a public notice{live ? " and marks the story Updated" : ""})</label></p>
          <p><label>Public correction note (required when material)<input type="text" name="correction_note" /></label></p>
          <button>Save as new version</button>
        </form>
      </section>

      <section><h2>Evidence: linked sources</h2>
        <table><thead><tr><th>Publisher</th><th>Role</th><th>Article</th><th>Excerpt used</th><th>Link</th><th></th></tr></thead><tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td>{a.publisher}</td><td>{a.is_syndicated ? "syndicated" : a.role}</td>
              <td><a href={a.canonical_url} target="_blank" rel="noopener noreferrer">{a.title}</a><br />
                <span className="meta">{a.published_at ? formatTime(a.published_at) : "no date"}{a.source_changed_at && <strong> · changed at source {formatTime(a.source_changed_at)}</strong>}</span></td>
              <td>{a.excerpt}</td><td>{a.link_status ?? "unchecked"}</td>
              <td>{articles.length > 1 && (<form action={splitArticle}><input type="hidden" name="id" value={id} /><input type="hidden" name="article_id" value={a.id} /><button>Split out</button></form>)}</td>
            </tr>
          ))}
        </tbody></table>
      </section>

      <section><h2>Extracted claims (current version)</h2>
        <table><thead><tr><th>Claim</th><th>Supporting quote</th><th>Source</th></tr></thead><tbody>
          {(current?.claims ?? []).map((c: any, i: number) => (<tr key={i}><td>{c.text}</td><td>{c.quote}</td><td>{c.publisher}</td></tr>))}
        </tbody></table>
        {!current?.claims?.length && <p className="meta">No claims stored for this version (for example after a manual edit with no prior claims).</p>}
      </section>

      <section><h2>Merge this story into another</h2>
        <form action={mergeStories}><input type="hidden" name="id" value={id} />
          <label>Target story id or slug <input type="text" name="target" /></label> <button className="danger">Merge</button></form>
      </section>

      <section><h2>Versions</h2>
        <ul>{versions.map((v) => <li key={v.id}>v{v.version} · {v.status} · {v.is_manual ? "manual" : "AI"} · {v.created_by} · {formatTime(v.created_at)} · {v.reason}</li>)}</ul>
        <h2>Public corrections</h2>
        <ul>{corrections.map((c, i) => <li key={i}>{formatTime(c.created_at)}: {c.note} ({c.created_by})</li>)}</ul>
        <h2>Audit (latest)</h2>
        <ul>{events.map((e, i) => <li key={i}>{formatTime(e.at)} · {e.actor} · {e.action}{e.note ? ` · ${e.note}` : ""}</li>)}</ul>
      </section>
    </>
  );
}