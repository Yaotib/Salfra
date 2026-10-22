
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { reopenArticle, retryJob } from "../actions";

export const dynamic = "force-dynamic";

const ITEM_STATES = ["held", "failed", "quarantined", "rejected"] as const;

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "success":
    case "completed":
    case "succeeded":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "running":
    case "processing":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "failed":
    case "error":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "held":
    case "quarantined":
    case "rejected":
      return "bg-amber-50 text-amber-800 ring-amber-600/20";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-500/20";
  }
}

function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = status || "unknown";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${statusStyle(value)}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  count,
}: {
  eyebrow: string;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-bold text-gray-950">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {description}
        </p>
      </div>

      {count !== undefined && (
        <span className="self-start rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-center">
          {count} records
        </span>
      )}
    </div>
  );
}

export default async function Jobs({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; state?: string }>;
}) {
  const { msg, state } = await searchParams;

  const show = ITEM_STATES.includes(
    state as (typeof ITEM_STATES)[number],
  )
    ? state!
    : "held";

  const [runs, jobs, items] = await Promise.all([
    sql<any[]>`
      select started_at, finished_at, status, trigger, stats, error
      from runs
      order by started_at desc
      limit 20
    `,
    sql<any[]>`
      select id, job_type, status, attempts, error, created_at
      from jobs
      order by created_at desc
      limit 20
    `,
    sql<any[]>`
      select
        a.id,
        a.title,
        a.reason,
        a.reject_kind,
        a.attempts,
        a.collected_at,
        a.canonical_url,
        s.name as publisher
      from source_articles a
      join sources s on s.id = a.source_id
      where a.state = ${show}
      order by a.collected_at desc
      limit 50
    `,
  ]);

  const failedJobs = jobs.filter(
    (job) => job.status === "failed",
  ).length;

  const activeRuns = runs.filter(
    (run) => run.status === "running",
  ).length;

  const runErrors = runs.filter(
    (run) => Boolean(run.error),
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          SALFRA / Administration
        </p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Jobs and items
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Monitor collection runs, inspect background job failures,
              and review articles that need attention.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 sm:self-auto">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                failedJobs > 0 || runErrors > 0
                  ? "bg-red-500"
                  : "bg-emerald-500"
              }`}
            />
            {failedJobs > 0 || runErrors > 0
              ? "Failures need review"
              : "Operations overview"}
          </span>
        </div>
      </header>

      {msg && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"
        >
          <span aria-hidden="true" className="font-bold">
            i
          </span>
          <p className="break-words">{msg}</p>
        </div>
      )}

      <section
        aria-label="Operations overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Recent collection runs
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {runs.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Latest 20 runs
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Active runs
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {activeRuns}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Marked as running in the recent results
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Failed background jobs
          </p>
          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${
              failedJobs > 0 ? "text-red-700" : "text-gray-950"
            }`}
          >
            {failedJobs}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Within the latest 20 jobs
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Runs with errors
          </p>
          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${
              runErrors > 0 ? "text-red-700" : "text-gray-950"
            }`}
          >
            {runErrors}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Within the latest 20 runs
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          eyebrow="Pipeline"
          title="Collection runs"
          description="Recent executions of the news collection pipeline."
          count={runs.length}
        />

        {runs.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-500">
            No collection runs have been recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {runs.map((run, index) => (
              <details
                key={`${run.started_at}-${index}`}
                className="group px-5 py-4 transition-colors hover:bg-gray-50/70 sm:px-6"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <StatusBadge status={run.status} />
                      <span className="text-sm font-semibold text-gray-800">
                        {run.trigger || "Unknown trigger"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>
                        Started {formatTime(run.started_at)}
                      </span>
                      <span className="font-medium text-blue-700">
                        View details{" "}
                        <span aria-hidden="true">⌄</span>
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Started
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {formatTime(run.started_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Finished
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {run.finished_at
                        ? formatTime(run.finished_at)
                        : "Not recorded"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Statistics
                    </p>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-700">
                      {run.stats != null
                        ? JSON.stringify(run.stats, null, 2)
                        : "No statistics recorded"}
                    </pre>
                  </div>

                  {run.error && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                        Error
                      </p>
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-red-100 bg-red-50 p-4 text-xs leading-5 text-red-800">
                        {String(run.error)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          eyebrow="Queue"
          title="Background jobs"
          description="Inspect queued work and retry failed jobs."
          count={jobs.length}
        />

        {jobs.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-500">
            No background jobs have been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    "Job type",
                    "Status",
                    "Attempts",
                    "Created",
                    "Error / action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="align-top transition-colors hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {job.job_type}
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] text-gray-400">
                        ID: {job.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>

                    <td className="px-5 py-4 text-sm tabular-nums text-gray-600">
                      {job.attempts ?? 0}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                      {formatTime(job.created_at)}
                    </td>

                    <td className="max-w-sm px-5 py-4">
                      {job.error && (
                        <p className="mb-3 whitespace-pre-wrap break-words text-xs leading-5 text-red-700">
                          {job.error}
                        </p>
                      )}

                      {job.status === "failed" ? (
                        <form action={retryJob}>
                          <input
                            type="hidden"
                            name="id"
                            value={job.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-gray-950 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          >
                            Retry job
                          </button>
                        </form>
                      ) : !job.error ? (
                        <span className="text-xs text-gray-400">
                          No error reported
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          eyebrow="Editorial review"
          title="Collected items"
          description="Review articles held by the pipeline, rejected, or quarantined."
          count={items.length}
        />

        <nav
          aria-label="Collected item state"
          className="flex flex-wrap gap-2 border-b border-gray-200 px-5 py-4 sm:px-6"
        >
          {ITEM_STATES.map((itemState) => {
            const active = itemState === show;

            return (
              <a
                key={itemState}
                href={`/admin/jobs?state=${itemState}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center rounded-full px-3.5 py-2 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  active
                    ? "bg-gray-950 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                }`}
              >
                {itemState}
                {active && (
                  <span className="ml-2 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
                    Active
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl text-gray-500">
              <span aria-hidden="true">✓</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              No {show} items found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              There are no matching collected items in this result set.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((article) => (
              <article
                key={article.id}
                className="space-y-4 px-5 py-5 transition-colors hover:bg-gray-50/60 sm:px-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <a
                      href={article.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-base font-bold leading-6 text-gray-950 underline-offset-4 hover:text-blue-800 hover:underline"
                    >
                      {article.title || "Untitled article"}
                    </a>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {article.publisher || "Unknown publisher"}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-gray-300"
                      >
                        ·
                      </span>
                      <span>
                        {formatTime(article.collected_at)}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-gray-300"
                      >
                        ·
                      </span>
                      <span>
                        Attempts: {article.attempts ?? 0}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={show} />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Review reason
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {article.reason || "No reason recorded"}
                  </p>

                  {article.reject_kind && (
                    <p className="mt-2 text-xs text-gray-500">
                      Reason category:{" "}
                      <span className="font-semibold text-gray-700">
                        {article.reject_kind}
                      </span>
                    </p>
                  )}
                </div>

                {show !== "quarantined" && (
                  <form
                    action={reopenArticle}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={article.id}
                    />

                    <label
                      htmlFor={`reopen-reason-${article.id}`}
                      className="sr-only"
                    >
                      Reason for reopening{" "}
                      {article.title || "article"}
                    </label>

                    <input
                      id={`reopen-reason-${article.id}`}
                      type="text"
                      name="reason"
                      required
                      minLength={3}
                      maxLength={500}
                      placeholder="Explain why this article should be reopened"
                      className="min-h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                      Reopen article
                    </button>
                  </form>
                )}

                {show === "quarantined" && (
                  <p className="text-xs leading-5 text-gray-500">
                    Reopening is disabled for quarantined items.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 bg-amber-50/70 px-5 py-4 sm:px-6">
          <p className="text-xs leading-5 text-amber-900">
            <span className="font-bold">Security safeguard:</span>{" "}
            Quarantined items, and security-related or malformed-data
            rejections, cannot be reopened from this page. The existing
            backend and database restrictions remain in control.
          </p>
        </div>
      </section>
    </main>
  );
}

