
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function MetricCard({
  label,
  value,
  description,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClasses = {
    default: "border-gray-200 bg-white",
    warning: "border-amber-200 bg-amber-50/60",
    danger: "border-red-200 bg-red-50/60",
    success: "border-emerald-200 bg-emerald-50/60",
  };

  const content = (
    <div
      className={`h-full rounded-2xl border p-4 no-underline transition hover:shadow-sm sm:p-5 ${toneClasses[tone]}`}
    >
      <p className="text-sm font-medium text-gray-600 no-underline">
        {label}
      </p>

      <p className="mt-3 break-words text-3xl font-semibold tracking-tight text-gray-950 no-underline">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-gray-500 no-underline">
        {description}
      </p>

      {href && (
        <p className="mt-3 text-xs font-semibold text-gray-700 no-underline">
          View details
          <span aria-hidden="true">&nbsp;→</span>
        </p>
      )}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block h-full rounded-2xl no-underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const classes =
    normalized === "success" ||
    normalized === "completed" ||
    normalized === "enabled"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "failed" ||
          normalized === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : normalized === "running" ||
            normalized === "started"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : normalized === "partial" ||
              normalized === "warning" ||
              normalized === "paused"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-gray-200 bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

function UsageBar({
  label,
  used,
  limit,
  unit = "",
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const percentage =
    Number.isFinite(used) &&
    Number.isFinite(limit) &&
    limit > 0
      ? Math.min(100, Math.max(0, (used / limit) * 100))
      : 0;

  const isHigh = percentage >= 85;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className="text-sm tabular-nums text-gray-600">
          {used.toLocaleString()} / {limit.toLocaleString()}
          {unit}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit > 0 ? limit : 100}
        aria-valuenow={limit > 0 ? Math.min(used, limit) : 0}
      >
        <div
          className={`h-full rounded-full transition-all ${
            isHigh ? "bg-amber-500" : "bg-gray-800"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {limit <= 0 && (
        <p className="mt-1 text-xs text-gray-500">
          No positive limit is configured.
        </p>
      )}
    </div>
  );
}

export default async function Dashboard() {
  const [c] = await sql<any[]>`
    select
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
      pg_database_size(current_database())::float8 as db_bytes
  `;

  const settings = Object.fromEntries(
    (
      await sql<any[]>`
        select key, value from settings
      `
    ).map((r) => [r.key, r.value]),
  );

  const runs = await sql<any[]>`
    select started_at, status, trigger, stats, error
    from runs
    order by started_at desc
    limit 6
  `;

  const dbBytes = Number(c.db_bytes);
  const dbLimitMb = Number(settings.db_limit_mb);
  const dbLimitBytes = dbLimitMb * 1024 * 1024;

  const dbPct =
    Number.isFinite(dbLimitBytes) && dbLimitBytes > 0
      ? (dbBytes / dbLimitBytes) * 100
      : 0;

  const publishingPaused =
    settings.publishing_paused === true ||
    settings.publishing_paused === "true";

  const collectionPaused =
    settings.collection_paused === true ||
    settings.collection_paused === "true";

  const autoPublishEnabled =
    settings.auto_publish_enabled === true ||
    settings.auto_publish_enabled === "true";

  return (
    <main className="space-y-8 pb-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            SALFRA / Operations
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Monitor the news pipeline, editorial queue, source health, and
            resource usage from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/review"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-gray-800 hover:no-underline"
          >
            Open review queue
          </Link>

          <Link
            href="/admin/jobs"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 no-underline transition hover:bg-gray-50 hover:no-underline"
          >
            View pipeline
          </Link>
        </div>
      </header>

      {(publishingPaused || collectionPaused) && (
        <section className="space-y-3" aria-label="System alerts">
          {publishingPaused && (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <span className="mt-0.5 text-lg" aria-hidden="true">
                !
              </span>

              <div>
                <p className="font-semibold text-red-900">
                  Publishing is paused
                </p>

                <p className="mt-1 text-sm leading-5 text-red-800">
                  The publishing kill switch is enabled. Check the publishing
                  pipeline before resuming.
                </p>

                <Link
                  href="/admin/settings"
                  className="mt-2 inline-block text-sm font-semibold text-red-900 no-underline hover:underline"
                >
                  Review publishing settings
                </Link>
              </div>
            </div>
          )}

          {collectionPaused && (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <span className="mt-0.5 text-lg" aria-hidden="true">
                !
              </span>

              <div>
                <p className="font-semibold text-amber-950">
                  Collection is paused
                </p>

                <p className="mt-1 text-sm leading-5 text-amber-900">
                  The collection pause setting is enabled. Check the scheduler
                  and worker configuration before expecting new items.
                </p>

                <Link
                  href="/admin/settings"
                  className="mt-2 inline-block text-sm font-semibold text-amber-950 no-underline hover:underline"
                >
                  Review collection settings
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">
              Editorial overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current queue and recent publishing activity.
            </p>
          </div>

          <Link
            href="/admin/review"
            className="shrink-0 text-sm font-semibold text-gray-700 no-underline hover:no-underline"
          >
            Review stories
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Awaiting review"
            value={c.awaiting}
            description={`${c.high_risk} flagged as high-risk or priority`}
            href="/admin/review"
            tone={Number(c.awaiting) > 0 ? "warning" : "success"}
          />

          <MetricCard
            label="Needs attention"
            value={c.attention}
            description="Stories with corrections, source changes, or proposals"
            href="/admin/review"
            tone={Number(c.attention) > 0 ? "warning" : "default"}
          />

          <MetricCard
            label="Published in 24 hours"
            value={c.published_24h}
            description={`Daily publishing cap: ${String(settings.max_stories_per_day)}`}
            href="/admin/stories"
          />

          <MetricCard
            label="Auto-publishing"
            value={autoPublishEnabled ? "ON" : "OFF"}
            description="Configured auto-publish setting"
            href="/admin/settings"
            tone={autoPublishEnabled ? "warning" : "success"}
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-950">
            Source health
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Collected items and source links that may need investigation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active sources"
            value={c.sources_active}
            description={`${c.sources_paused} sources currently paused`}
            href="/admin/sources"
            tone="success"
          />

          <MetricCard
            label="Held items"
            value={c.held}
            description="Collected items awaiting further handling"
            href="/admin/jobs?state=held"
            tone={Number(c.held) > 0 ? "warning" : "default"}
          />

          <MetricCard
            label="Failed or quarantined"
            value={c.problem_articles}
            description="Items collected in the last 7 days"
            href="/admin/jobs?state=failed"
            tone={Number(c.problem_articles) > 0 ? "danger" : "success"}
          />

          <MetricCard
            label="Broken live-story links"
            value={c.broken_links}
            description="Distinct source articles linked to published stories"
            href="/admin/stories"
            tone={Number(c.broken_links) > 0 ? "danger" : "success"}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Resource usage
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Usage based on the current database and recorded AI calls.
            </p>
          </div>

          <div className="space-y-6">
            <UsageBar
              label="AI calls today"
              used={Number(c.llm_calls_today)}
              limit={Number(settings.llm_daily_call_budget)}
            />

            <UsageBar
              label="Database storage"
              used={Number((dbBytes / 1024 / 1024).toFixed(0))}
              limit={dbLimitMb}
              unit=" MB"
            />

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Database utilization
                </span>

                <span
                  className={`text-lg font-semibold tabular-nums ${
                    dbPct >= 85 ? "text-amber-700" : "text-gray-950"
                  }`}
                >
                  {dbPct.toFixed(0)}%
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                {Number.isFinite(dbLimitMb) && dbLimitMb > 0
                  ? `${(dbBytes / 1024 / 1024).toFixed(1)} MB used out of ${dbLimitMb} MB configured.`
                  : "The configured database limit is missing or invalid."}
              </p>
            </div>
          </div>

          <Link
            href="/admin/settings"
            className="mt-5 inline-block text-sm font-semibold text-gray-700 no-underline hover:no-underline"
          >
            Manage operational settings
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-950">
              Pipeline controls
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current operational settings, not live worker health checks.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Publishing
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Global publishing pause setting
                </p>
              </div>

              <StatusBadge
                status={publishingPaused ? "Paused" : "Enabled"}
              />
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Collection
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Collection pause setting
                </p>
              </div>

              <StatusBadge
                status={collectionPaused ? "Paused" : "Enabled"}
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Auto-publish
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Automatic publishing configuration
                </p>
              </div>

              <StatusBadge status={autoPublishEnabled ? "On" : "Off"} />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs leading-5 text-amber-900">
              Settings show configured values only. Confirm the worker and
              scheduler enforce them before relying on them as operational
              safeguards.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">
              Recent pipeline runs
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The six most recent recorded runs.
            </p>
          </div>

          <Link
            href="/admin/jobs"
            className="text-sm font-semibold text-gray-700 no-underline hover:no-underline"
          >
            View all jobs and items
          </Link>
        </div>

        {runs.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
              ↻
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No pipeline runs yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Recorded runs will appear here after the worker executes.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {runs.map((run, index) => (
                <div
                  key={`${run.started_at}-${index}`}
                  className="space-y-3 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge
                      status={String(run.status ?? "Unknown")}
                    />

                    <span className="text-xs text-gray-500">
                      {formatTime(run.started_at)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Trigger
                    </p>

                    <p className="mt-1 break-words text-sm font-medium text-gray-900">
                      {String(run.trigger ?? "Unknown")}
                    </p>
                  </div>

                  <details className="rounded-xl bg-gray-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700">
                      View run details
                    </summary>

                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-600">
                      {run.error != null
                        ? String(run.error)
                        : JSON.stringify(run.stats, null, 2) ??
                          "No details recorded"}
                    </pre>
                  </details>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3 font-semibold">Started</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Trigger</th>
                    <th className="px-6 py-3 font-semibold">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {runs.map((run, index) => (
                    <tr
                      key={`${run.started_at}-${index}`}
                      className="align-top transition hover:bg-gray-50/70"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {formatTime(run.started_at)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={String(run.status ?? "Unknown")}
                        />
                      </td>

                      <td className="max-w-48 break-words px-6 py-4 text-gray-700">
                        {String(run.trigger ?? "Unknown")}
                      </td>

                      <td className="min-w-64 px-6 py-4">
                        <details>
                          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-950">
                            {run.error != null
                              ? "View error"
                              : "View stats"}
                          </summary>

                          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                            {run.error != null
                              ? String(run.error)
                              : JSON.stringify(run.stats, null, 2) ??
                                "No details recorded"}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 pt-4">
        <p className="text-xs leading-5 text-gray-500">
          Dashboard counts reflect the database queries shown here. They do not
          independently confirm that scheduled workers are currently running.
        </p>
      </footer>
    </main>
  );
}
