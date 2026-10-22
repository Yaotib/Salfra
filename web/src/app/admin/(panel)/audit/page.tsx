
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime, iso } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "No data recorded";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function actionStyle(action: string) {
  const value = action.toLowerCase();

  if (
    value.includes("delete") ||
    value.includes("reject") ||
    value.includes("fail") ||
    value.includes("revoke")
  ) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  if (
    value.includes("publish") ||
    value.includes("approve") ||
    value.includes("create")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (value.includes("update") || value.includes("edit")) {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  return "bg-gray-100 text-gray-700 ring-gray-500/20";
}

export default async function Audit() {
  const rows = await sql<any[]>`
    select
      at,
      actor,
      action,
      target_type,
      target_id,
      before,
      after,
      note
    from audit_events
    order by at desc
    limit 150
  `;

  const recordedActors = new Set(
    rows.map((row) => row.actor).filter(Boolean)
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            SALFRA / Administration
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
            Audit log
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review administrative activity and changes recorded across SALFRA.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Activity records
        </div>
      </header>

      <section
        aria-label="Audit log statistics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Records displayed
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {rows.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Maximum 150 most recent records
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Actors recorded
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {recordedActors.size}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Distinct non-empty actor values in this list
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Latest activity
          </p>
          <p className="mt-2 text-lg font-bold text-gray-950">
            {rows.length > 0 ? formatTime(rows[0].at) : "No activity"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Based on the most recent returned record
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Recent activity
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Newest actions appear first.
            </p>
          </div>

          <span className="text-xs font-medium text-gray-400">
            Showing {rows.length} {rows.length === 1 ? "record" : "records"}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl text-gray-500">
              <span aria-hidden="true">↻</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              No activity recorded yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Administrative actions will appear here when audit events have
              been recorded.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {rows.map((row, index) => (
                <details key={`${row.at}-${index}`} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${actionStyle(String(row.action ?? ""))}`}
                        >
                          {row.action || "Unknown action"}
                        </span>

                        <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                          {row.target_type || "Unknown target"}
                          {row.target_id != null && ` · ${row.target_id}`}
                        </p>

                        <p className="mt-1 break-words text-xs text-gray-500">
                          {row.actor || "Unknown actor"}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="mt-1 text-gray-400 transition-transform group-open:rotate-180"
                      >
                        ▾
                      </span>
                    </div>

                    <time
                      dateTime={iso(row.at)}
                      className="mt-3 block text-xs text-gray-400"
                    >
                      {formatTime(row.at)}
                    </time>
                  </summary>

                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Note
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-gray-700">
                        {row.note || "No note recorded"}
                      </p>
                    </div>

                    {row.before != null && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          Before
                        </p>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                          {formatValue(row.before)}
                        </pre>
                      </div>
                    )}

                    {row.after != null && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          After
                        </p>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                          {formatValue(row.after)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      When
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Actor
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Target
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, index) => (
                    <tr
                      key={`${row.at}-${index}`}
                      className="align-top transition-colors hover:bg-gray-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-xs leading-5 text-gray-500">
                        <time dateTime={iso(row.at)}>
                          {formatTime(row.at)}
                        </time>
                      </td>

                      <td className="max-w-48 break-words px-5 py-4 text-sm font-medium text-gray-700">
                        {row.actor || "Unknown actor"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${actionStyle(String(row.action ?? ""))}`}
                        >
                          {row.action || "Unknown action"}
                        </span>
                      </td>

                      <td className="max-w-52 break-words px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800">
                          {row.target_type || "Unknown target"}
                        </p>
                        {row.target_id != null && (
                          <p className="mt-1 break-all font-mono text-xs text-gray-400">
                            {row.target_id}
                          </p>
                        )}
                      </td>

                      <td className="min-w-72 max-w-xl px-5 py-4">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                          {row.note || "No note recorded"}
                        </p>

                        {(row.before != null || row.after != null) && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-semibold text-blue-700 hover:text-blue-900">
                              Inspect recorded changes
                            </summary>

                            <div className="mt-3 space-y-3">
                              {row.before != null && (
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Before
                                  </p>
                                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                                    {formatValue(row.before)}
                                  </pre>
                                </div>
                              )}

                              {row.after != null && (
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    After
                                  </p>
                                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                                    {formatValue(row.after)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 sm:px-6">
          <p className="text-xs leading-5 text-gray-500">
            This view displays the 150 most recent audit events. It does not
            modify or delete audit records.
          </p>
        </div>
      </section>
    </main>
  );
}
