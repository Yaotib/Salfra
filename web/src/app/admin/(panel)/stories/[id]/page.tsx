
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

          <div>
            <FieldLabel htmlFor="merge-target">
              Target story ID or slug
            </FieldLabel>
            <TextInput
              id="merge-target"
              name="target"
              placeholder="Paste the target story ID or slug"
              required
            />
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs leading-5 text-red-800">
              Merging can affect story relationships and publication records.
              Confirm that the target is correct before proceeding.
            </p>
          </div>

          <ActionButton variant="danger">Merge into target story</ActionButton>
        </form>
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
