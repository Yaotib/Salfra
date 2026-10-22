
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function priorityStyle(priority: unknown) {
  const value = Number(priority);

  if (value >= 8) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  if (value >= 5) {
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  }

  return "bg-gray-100 text-gray-700 ring-gray-500/20";
}

function flagStyle(flag: string) {
  const value = flag.toLowerCase();

  if (
    value.includes("security") ||
    value.includes("misinformation") ||
    value.includes("fabricat") ||
    value.includes("malformed")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    value.includes("source") ||
    value.includes("correction") ||
    value.includes("risk")
  ) {
    return "bg-amber-50 text-amber-800";
  }

  return "bg-gray-100 text-gray-600";
}

export default async function Review() {
  const rows = await sql<any[]>`
    select
      id,
      headline,
      status,
      evidence_label,
      risk_flags,
      review_priority,
      needs_attention,
      is_limited,
      created_at
    from stories
    where status = 'awaiting_review'
      or (needs_attention is not null and status <> 'withdrawn')
    order by
      (needs_attention is not null) desc,
      review_priority desc,
      created_at asc
    limit 100
  `;

  const attentionCount = rows.filter(
    (row) => row.needs_attention != null
  ).length;

  const awaitingCount = rows.filter(
    (row) => row.status === "awaiting_review"
  ).length;

  const limitedCount = rows.filter(
    (row) => row.is_limited
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          SALFRA / Editorial operations
        </p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Review queue
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Review stories requiring editorial attention, verify evidence,
              and inspect flagged content before taking action.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 sm:self-auto">
            <span
              className={`h-2 w-2 rounded-full ${
                rows.length > 0 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {rows.length > 0 ? "Review required" : "Queue clear"}
          </span>
        </div>
      </header>

      <section
        aria-label="Review queue overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Stories in queue
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {rows.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Maximum 100 matching stories
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Need attention
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">
            {attentionCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Corrections, source changes, or other attention markers
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Limited coverage
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {limitedCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Stories marked as having limited coverage
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Stories requiring review
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Attention markers first, then priority, then oldest stories.
            </p>
          </div>

          <span className="self-start rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-auto">
            {awaitingCount} awaiting review
          </span>
        </div>

        {rows.length === 0 ? (
          <div role="status" className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              <span aria-hidden="true">✓</span>
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-950">
              Nothing waiting for review
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              There are currently no stories matching the review queue
              criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => {
              const flags: string[] = Array.isArray(row.risk_flags)
                ? row.risk_flags.filter(
                    (flag: unknown): flag is string =>
                      typeof flag === "string" && flag.trim().length > 0
                  )
                : [];

              const allFlags = [
                ...flags,
                ...(row.is_limited ? ["Limited coverage"] : []),
              ];

              return (
                <article
                  key={row.id}
                  className="px-5 py-5 transition-colors hover:bg-gray-50/70 sm:px-6"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${priorityStyle(row.review_priority)}`}
                        >
                          Priority {row.review_priority ?? 0}
                        </span>

                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                          {(row.status || "unknown").replaceAll("_", " ")}
                        </span>

                        {row.needs_attention && (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                            Attention needed
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 break-words text-lg font-bold leading-snug tracking-tight text-gray-950 sm:text-xl">
                        <Link
                          href={`/admin/stories/${row.id}`}
                          className="decoration-2 underline-offset-4 transition-colors hover:text-blue-800 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          {row.headline || "Untitled story"}
                        </Link>
                      </h3>

                      {row.needs_attention && (
                        <p className="mt-2 break-words text-sm leading-6 text-amber-800">
                          <span className="font-semibold">
                            Attention reason:
                          </span>{" "}
                          {row.needs_attention}
                        </p>
                      )}

                      <div className="mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Risk flags
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {allFlags.length > 0 ? (
                            allFlags.map((flag, index) => (
                              <span
                                key={`${flag}-${index}`}
                                className={`inline-flex max-w-full break-words rounded-lg px-2.5 py-1.5 text-xs font-medium ${flagStyle(flag)}`}
                              >
                                {flag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">
                              No risk flags recorded
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                        <span>
                          <span className="font-semibold text-gray-700">
                            Evidence:
                          </span>{" "}
                          {row.evidence_label || "Not specified"}
                        </span>

                        <span>
                          <span className="font-semibold text-gray-700">
                            Created:
                          </span>{" "}
                          {formatTime(row.created_at)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/stories/${row.id}`}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                      Review story
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 sm:px-6">
          <p className="text-xs leading-5 text-gray-500">
            The queue shows up to 100 stories. Review priority and risk labels
            are informational; editorial decisions remain in the existing
            story review workflow.
          </p>
        </div>
      </section>
    </main>
  );
}
