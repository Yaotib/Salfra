
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { applyProposal, dismissAttention, mergeStories, rejectProposal, requestRegeneration, saveEdit, setStoryStatus, splitArticle } from "../../actions";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

function statusStyle(status: string) {
  switch (status) {
    case "published":
    case "updated":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "approved":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "awaiting_review":
      return "bg-amber-50 text-amber-800 ring-amber-600/20";
    case "draft":
      return "bg-gray-100 text-gray-700 ring-gray-500/20";
    case "withdrawn":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-500/20";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyle(status)}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-0.5 text-base font-bold text-gray-950">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold text-gray-700"
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  name,
  defaultValue,
  placeholder,
  required = false,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      name={name}
      type="text"
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
    />
  );
}

function TextArea({
  id,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  required = false,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
    />
  );
}

function ActionButton({
  children,
  variant = "primary",
  type = "submit",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "subtle";
  type?: "submit" | "button";
}) {
  const styles = {
    primary:
      "border-transparent bg-gray-950 text-white hover:bg-blue-700",
    secondary:
      "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    subtle:
      "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function DataValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-medium text-gray-800">
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center">
      <p className="text-sm font-bold text-gray-800">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function displayDate(value: any) {
  return value ? formatTime(value) : "No date recorded";
}

export default async function StoryEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { id } = await params;
  const { msg } = await searchParams;

  if (!UUID.test(id)) notFound();

  const [s] = await sql<any[]>`
    select *
    from stories
    where id = ${id}
  `;

  if (!s) notFound();

  const [articles, versions, corrections, events] = await Promise.all([
    sql<any[]>`
      select
        a.id,
        a.title,
        a.canonical_url,
        a.excerpt,
        a.published_at,
        a.source_changed_at,
        a.link_status,
        so.name as publisher,
        sa.role,
        sa.is_syndicated
      from story_articles sa
      join source_articles a on a.id = sa.article_id
      join sources so on so.id = a.source_id
      where sa.story_id = ${id}
      order by sa.role, a.published_at
    `,
    sql<any[]>`
      select *
      from story_versions
      where story_id = ${id}
      order by version desc
    `,
    sql<any[]>`
      select note, is_public, created_by, created_at
      from story_corrections
      where story_id = ${id}
      order by created_at desc
    `,
    sql<any[]>`
      select at, actor, action, note
      from audit_events
      where target_type = 'story' and target_id = ${id}
      order by at desc
      limit 15
    `,
  ]);

  const current = versions.find((v) => v.status === "current");
  const proposals = versions.filter((v) => v.status === "proposed");
  const live = ["published", "updated"].includes(s.status);
  const body =
    s.body && typeof s.body === "object" && !Array.isArray(s.body)
      ? s.body
      : {};

  const categories: string[] = Array.isArray(s.categories)
    ? s.categories
    : [];

  const riskFlags: string[] = Array.isArray(s.risk_flags)
    ? s.risk_flags.filter((flag: unknown): flag is string =>
        typeof flag === "string"
      )
    : [];

  const claims = Array.isArray(current?.claims) ? current.claims : [];

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
          <p><label>What happened<textarea name="what_happened" defaultValue={body.what_happened ?? ""} /></label></p>
          <p><label>Why it matters<textarea name="why_it_matters" defaultValue={body.why_it_matters ?? ""} /></label></p>
          <p><label>What remains uncertain<textarea name="uncertain" defaultValue={body.uncertain ?? ""} /></label></p>
          <fieldset><legend>Categories</legend>
            {CATEGORIES.map((c) => (<label key={c.slug}><input type="checkbox" name="categories" value={c.name} defaultChecked={categories.includes(c.name)} /> {c.name} </label>))}
          </fieldset>
          <fieldset><legend>Featured Media &amp; Attribution</legend>
            <p><label>Media URL (Image or Video)<input type="url" name="media_url" defaultValue={s.media_url ?? ""} placeholder="https://..." /></label></p>
            <p><label>Media Type
              <select name="media_type" defaultValue={s.media_type ?? ""}>
                <option value="">None</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label></p>
            <p><label>Media Source / Credit Name<input type="text" name="media_source_name" defaultValue={s.media_source_name ?? ""} placeholder="e.g. Reuters, TechCrunch" /></label></p>
            <p><label>Media Source URL<input type="url" name="media_source_url" defaultValue={s.media_source_url ?? ""} placeholder="https://..." /></label></p>
            <p><label>Alternative Text (Accessibility)<input type="text" name="media_alt_text" defaultValue={s.media_alt_text ?? ""} /></label></p>
            <p><label>License / Rights Note<input type="text" name="media_license" defaultValue={s.media_license ?? ""} placeholder="e.g. Editorial use, CC BY 4.0" /></label></p>
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
          {claims.map((c: any, i: number) => (<tr key={i}><td>{c.text}</td><td>{c.quote}</td><td>{c.publisher}</td></tr>))}
        </tbody></table>
        {!claims.length && <p className="meta">No claims stored for this version (for example after a manual edit with no prior claims).</p>}
      </section>

      <section><h2>Merge this story into another</h2>
        <form action={mergeStories}><input type="hidden" name="id" value={id} />
          <label>Target story id or slug <input type="text" name="target" /></label> <button className="danger">Merge</button></form>
      </section>

      <section><h2>Versions</h2>
        <ul>{versions.map((v) => <li key={v.id}>v{v.version} · {v.status} · {v.is_manual ? "manual" : "AI"} · {v.created_by} · {formatTime(v.created_at)} · {v.reason}</li>)}</ul>
        <h2>Public corrections</h2>
        <ul>{corrections.map((c, i) => <li key={i}>{formatTime(c.created_at)}: {c.note} ({c.created_by})</li>)}</ul>
      </section>

      <Section
        eyebrow="System record"
        title={`Audit trail (${events.length})`}
        description="The latest audit events returned for this story, up to 15 records."
      >
        {events.length === 0 ? (
          <EmptyState
            title="No audit events returned"
            description="There are no matching audit records in the current query results."
          />
        ) : (
          <div className="space-y-0">
            {events.map((event, index) => (
              <article
                key={`${event.at}-${index}`}
                className="flex gap-3 border-b border-gray-100 py-4 last:border-b-0"
              >
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <span className="text-xs font-bold">A</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-bold text-gray-900">
                      {event.action}
                    </p>
                    <span className="text-xs text-gray-400">
                      {displayDate(event.at)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Actor: {event.actor || "Unknown"}
                  </p>

                  {event.note && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                      {event.note}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
