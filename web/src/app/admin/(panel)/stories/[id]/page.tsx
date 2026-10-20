
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import {
  applyProposal,
  dismissAttention,
  mergeStories,
  rejectProposal,
  requestRegeneration,
  saveEdit,
  setStoryStatus,
  splitArticle,
} from "../../actions";

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
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <Link
          href="/admin/review"
          className="font-semibold hover:text-blue-700"
        >
          Review queue
        </Link>
        <span>/</span>
        <span>Story editor</span>
        <span className="ml-auto font-mono text-[10px] text-gray-400">
          ID: {id}
        </span>
      </div>

      {msg && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"
        >
          {msg}
        </div>
      )}

      <header className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={s.status} />
            {s.evidence_label && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Evidence: {s.evidence_label}
              </span>
            )}
            {s.region && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                {s.region}
              </span>
            )}
          </div>

          <h1 className="mt-4 break-words text-2xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-3xl">
            {s.headline}
          </h1>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
            <DataValue label="Linked sources" value={articles.length} />
            <DataValue label="Story versions" value={versions.length} />
            <DataValue
              label="Last publication status"
              value={<StatusBadge status={s.status} />}
            />
          </div>

          {riskFlags.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Risk flags
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {riskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {s.needs_attention && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-950">
                Editorial attention required
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-amber-900">
                {s.needs_attention}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {live && (
              <a
                href={`/stories/${s.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                View public story ↗
              </a>
            )}
            <a
              href="#story-actions"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gray-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Story actions
            </a>
            <a
              href="#story-edit"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Edit story
            </a>
          </div>
        </div>
      </header>

      <Section
        id="story-actions"
        eyebrow="Editorial controls"
        title="Story actions"
        description="Manage publication status and request editorial follow-up."
      >
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Publication workflow
            </p>

            <div className="flex flex-wrap gap-2">
              {["awaiting_review", "approved"].includes(s.status) && (
                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="to" value="published" />
                  <ActionButton>Approve and publish</ActionButton>
                </form>
              )}

              {live && (
                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="to" value="awaiting_review" />
                  <ActionButton variant="secondary">
                    Unpublish to review
                  </ActionButton>
                </form>
              )}

              {s.status === "withdrawn" && !s.merged_into && (
                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="to" value="awaiting_review" />
                  <ActionButton variant="secondary">
                    Restore to review
                  </ActionButton>
                </form>
              )}

              {s.status === "awaiting_review" && (
                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="to" value="draft" />
                  <ActionButton variant="secondary">
                    Hold as draft
                  </ActionButton>
                </form>
              )}

              <form action={requestRegeneration}>
                <input type="hidden" name="id" value={id} />
                <ActionButton variant="secondary">
                  Request regenerated summary
                </ActionButton>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 lg:grid-cols-2">
            <form
              action={setStoryStatus}
              className="rounded-xl border border-red-200 bg-red-50/50 p-4"
            >
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="to" value="withdrawn" />

              <h3 className="text-sm font-bold text-red-950">
                Withdraw story
              </h3>
              <p className="mt-1 text-xs leading-5 text-red-800">
                Use when a story must be withdrawn. Provide the public reason
                required by your editorial policy.
              </p>

              <div className="mt-3">
                <FieldLabel htmlFor="withdraw-reason">
                  Public withdrawal reason
                </FieldLabel>
                <TextInput
                  id="withdraw-reason"
                  name="reason"
                  placeholder="Explain why this story is being withdrawn"
                />
              </div>

              <div className="mt-3">
                <ActionButton variant="danger">Withdraw story</ActionButton>
              </div>
            </form>

            {s.needs_attention && (
              <form
                action={dismissAttention}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <input type="hidden" name="id" value={id} />

                <h3 className="text-sm font-bold text-amber-950">
                  Resolve attention flag
                </h3>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Record why this attention flag should be dismissed.
                </p>

                <div className="mt-3">
                  <FieldLabel htmlFor="dismiss-reason">
                    Reason for dismissal
                  </FieldLabel>
                  <TextInput
                    id="dismiss-reason"
                    name="reason"
                    placeholder="Explain the resolution"
                  />
                </div>

                <div className="mt-3">
                  <ActionButton variant="secondary">Dismiss flag</ActionButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </Section>

      {proposals.length > 0 && (
        <Section
          eyebrow="AI-assisted revisions"
          title={`Proposed revisions (${proposals.length})`}
          description="Review each proposal against the linked source material before applying it."
        >
          <div className="space-y-5">
            {proposals.map((proposal) => (
              <article
                key={proposal.id}
                className="overflow-hidden rounded-xl border border-blue-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50/70 px-4 py-3">
                  <h3 className="text-sm font-bold text-blue-950">
                    Proposed revision v{proposal.version}
                  </h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-blue-800 ring-1 ring-blue-200">
                    Pending decision
                  </span>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Proposed headline
                    </p>
                    <p className="mt-1 text-base font-bold leading-6 text-gray-950">
                      {proposal.headline}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Card summary
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">
                      {proposal.card_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold text-gray-700">
                        What happened
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {proposal.body?.what_happened || "Not provided"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold text-gray-700">
                        Why it matters
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {proposal.body?.why_it_matters || "Not provided"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold text-gray-700">
                        What remains uncertain
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {proposal.body?.uncertain || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold text-amber-950">
                      Reason for proposal
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                      {proposal.reason || "No reason recorded"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-amber-800">
                      Verify factual claims against the linked evidence before
                      applying this revision.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                    <form action={applyProposal} className="space-y-3">
                      <input type="hidden" name="id" value={id} />
                      <input
                        type="hidden"
                        name="version_id"
                        value={proposal.id}
                      />

                      {live && (
                        <div>
                          <FieldLabel htmlFor={`correction-${proposal.id}`}>
                            Public update note (required for a live story)
                          </FieldLabel>
                          <TextInput
                            id={`correction-${proposal.id}`}
                            name="correction_note"
                            placeholder="Explain what changed for readers"
                            required
                          />
                        </div>
                      )}

                      <ActionButton>Apply proposed revision</ActionButton>
                    </form>

                    <form action={rejectProposal}>
                      <input type="hidden" name="id" value={id} />
                      <input
                        type="hidden"
                        name="version_id"
                        value={proposal.id}
                      />
                      <ActionButton variant="secondary">
                        Reject proposal
                      </ActionButton>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      <Section
        id="story-edit"
        eyebrow="Editorial workspace"
        title="Edit story"
        description="Save your changes as a new version. Review factual accuracy and uncertainty before saving."
      >
        <form action={saveEdit} className="space-y-5">
          <input type="hidden" name="id" value={id} />

          <div>
            <FieldLabel htmlFor="story-headline">Headline</FieldLabel>
            <TextInput
              id="story-headline"
              name="headline"
              defaultValue={s.headline}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="story-summary">
              Card summary (2–3 sentences)
            </FieldLabel>
            <TextArea
              id="story-summary"
              name="card_summary"
              defaultValue={s.card_summary}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel htmlFor="what-happened">
                What happened
              </FieldLabel>
              <TextArea
                id="what-happened"
                name="what_happened"
                defaultValue={body.what_happened ?? ""}
                placeholder="Describe the reported event or development."
              />
            </div>

            <div>
              <FieldLabel htmlFor="why-it-matters">
                Why it matters
              </FieldLabel>
              <TextArea
                id="why-it-matters"
                name="why_it_matters"
                defaultValue={body.why_it_matters ?? ""}
                placeholder="Explain the significance without overstating it."
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel htmlFor="uncertain">
                What remains uncertain
              </FieldLabel>
              <TextArea
                id="uncertain"
                name="uncertain"
                defaultValue={body.uncertain ?? ""}
                placeholder="Record limitations, unknowns, or claims not independently verified."
              />
            </div>
          </div>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-sm font-bold text-gray-900">
              Categories
            </legend>
            <p className="mb-3 text-xs leading-5 text-gray-500">
              Select every category that appropriately describes this story.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CATEGORIES.map((category) => (
                <label
                  key={category.slug}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={category.name}
                    defaultChecked={categories.includes(category.name)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <FieldLabel htmlFor="story-region">Region</FieldLabel>
            <select
              id="story-region"
              name="region"
              defaultValue={s.region}
              className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
            >
              <option value="global">Global</option>
              <option value="africa">Africa</option>
              <option value="ghana">Ghana</option>
            </select>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="material"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
              />
              <span>
                <span className="block text-sm font-bold text-amber-950">
                  Material correction
                </span>
                <span className="mt-1 block text-xs leading-5 text-amber-900">
                  Use for a significant factual correction. According to the
                  existing workflow, this displays a public notice and, for a
                  live story, marks the story as updated.
                </span>
              </span>
            </label>

            <div className="mt-4">
              <FieldLabel htmlFor="public-correction-note">
                Public correction note
              </FieldLabel>
              <TextInput
                id="public-correction-note"
                name="correction_note"
                placeholder="Explain the material correction for readers"
              />
              <p className="mt-1 text-xs text-amber-800">
                Required by the editorial workflow when material correction is
                selected. The server action must enforce this requirement.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">
              Changes are submitted through the existing save action.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Save as new version
            </button>
          </div>
        </form>
      </Section>

      <Section
        eyebrow="Source verification"
        title={`Linked evidence (${articles.length})`}
        description="Inspect original reporting, source changes, excerpts, and link status before making editorial decisions."
      >
        {articles.length === 0 ? (
          <EmptyState
            title="No linked sources"
            description="This story has no linked source articles in the current records."
          />
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <article
                key={article.id}
                className="rounded-xl border border-gray-200 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                    {article.is_syndicated
                      ? "Syndicated"
                      : article.role || "Source"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                    Link: {article.link_status ?? "unchecked"}
                  </span>
                </div>

                <h3 className="mt-3 break-words text-base font-bold leading-6 text-gray-950">
                  <a
                    href={article.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-700 hover:underline"
                  >
                    {article.title || article.canonical_url}
                    <span className="ml-1 text-xs text-gray-400">↗</span>
                  </a>
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Publisher:{" "}
                  <span className="font-semibold text-gray-800">
                    {article.publisher}
                  </span>
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DataValue
                    label="Published"
                    value={displayDate(article.published_at)}
                  />
                  <DataValue
                    label="Last changed at source"
                    value={
                      article.source_changed_at
                        ? formatTime(article.source_changed_at)
                        : "No change recorded"
                    }
                  />
                </div>

                {article.excerpt && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Stored excerpt
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {article.excerpt}
                    </p>
                  </div>
                )}

                {articles.length > 1 && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <form action={splitArticle}>
                      <input type="hidden" name="id" value={id} />
                      <input
                        type="hidden"
                        name="article_id"
                        value={article.id}
                      />
                      <ActionButton variant="secondary">
                        Split article into separate story
                      </ActionButton>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Fact checking"
        title={`Extracted claims (${claims.length})`}
        description="Review stored claims and supporting quotations associated with the current version."
      >
        {claims.length === 0 ? (
          <EmptyState
            title="No extracted claims stored"
            description="This version has no stored claims. This can occur after a manual edit when no prior claims are attached."
          />
        ) : (
          <div className="space-y-3">
            {claims.map((claim: any, index: number) => (
              <article
                key={index}
                className="rounded-xl border border-gray-200 p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Claim {index + 1}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-gray-900">
                  {claim.text || "No claim text recorded"}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Supporting quote
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {claim.quote || "No supporting quote recorded"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Publisher
                    </p>
                    <p className="mt-2 break-words text-sm font-medium text-gray-800">
                      {claim.publisher || "Not recorded"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Editorial history"
        title={`Versions (${versions.length})`}
        description="Review the saved version sequence, including whether each version was manual or AI-generated."
      >
        {versions.length === 0 ? (
          <EmptyState
            title="No versions found"
            description="No version records were returned for this story."
          />
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <article
                key={version.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-950">
                      Version {version.version}
                    </h3>
                    <StatusBadge status={version.status} />
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                      {version.is_manual ? "Manual" : "AI"}
                    </span>
                  </div>

                  <p className="mt-2 break-words text-sm text-gray-700">
                    {version.reason || "No reason recorded"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    By {version.created_by || "Unknown"}
                  </p>
                </div>

                <p className="shrink-0 text-xs text-gray-400">
                  {displayDate(version.created_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Transparency"
        title="Public corrections"
        description="A record of corrections associated with this story."
      >
        {corrections.length === 0 ? (
          <EmptyState
            title="No correction records"
            description="No corrections have been recorded for this story."
          />
        ) : (
          <div className="space-y-3">
            {corrections.map((correction, index) => (
              <article
                key={`${correction.created_at}-${index}`}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      correction.is_public
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {correction.is_public ? "Public" : "Not public"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {displayDate(correction.created_at)}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                  {correction.note}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Recorded by {correction.created_by || "Unknown"}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Story relationships"
        title="Merge this story"
        description="Merge this story into another existing story using its ID or slug. Check the target carefully before submitting."
      >
        <form action={mergeStories} className="space-y-3">
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
      </Section>

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
    </main>
  );
}
