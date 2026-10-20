
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { saveSource, setSourceStatus } from "../actions";

export const dynamic = "force-dynamic";

const SOURCE_TYPES = [
  "lab_blog",
  "company_blog",
  "publisher",
  "research",
  "government",
  "github",
  "other",
];

const ACCESS_METHODS = ["rss", "atom", "api"];
const REGIONS = ["global", "africa", "ghana"];

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "paused":
      return "bg-amber-50 text-amber-800 ring-amber-600/20";
    case "disabled":
      return "bg-gray-100 text-gray-600 ring-gray-500/20";
    default:
      return "bg-red-50 text-red-700 ring-red-600/20";
  }
}

function SourceStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${statusStyle(status)}`}
    >
      {status}
    </span>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        min={min}
        className="min-h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function SourceForm({ s }: { s?: any }) {
  const prefix = s ? `source-${s.id}` : "new-source";

  const termsDate = s?.terms_reviewed_at
    ? new Date(s.terms_reviewed_at).toISOString().slice(0, 10)
    : "";

  return (
    <form action={saveSource} className="space-y-6">
      {s && <input type="hidden" name="id" value={s.id} />}

      <div>
        <h3 className="text-sm font-bold text-gray-900">
          Source details
        </h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Identify the publisher and configure how SALFRA collects its content.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor={`${prefix}-name`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Source name <span className="text-red-600">*</span>
          </label>
          <input
            id={`${prefix}-name`}
            type="text"
            name="name"
            defaultValue={s?.name ?? ""}
            required
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${prefix}-domain`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Canonical domain <span className="text-red-600">*</span>
          </label>
          <input
            id={`${prefix}-domain`}
            type="text"
            name="domain"
            defaultValue={s?.domain ?? ""}
            placeholder="example.com"
            required
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor={`${prefix}-feed-url`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Feed or API URL <span className="text-red-600">*</span>
          </label>
          <input
            id={`${prefix}-feed-url`}
            type="url"
            name="feed_url"
            defaultValue={s?.feed_url ?? ""}
            placeholder="https://example.com/feed.xml"
            required
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900">
          Collection configuration
        </h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Classify the source and select its access method and regional scope.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor={`${prefix}-type`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Source type
          </label>
          <select
            id={`${prefix}-type`}
            name="source_type"
            defaultValue={s?.source_type ?? "publisher"}
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${prefix}-access`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Access method
          </label>
          <select
            id={`${prefix}-access`}
            name="access_method"
            defaultValue={s?.access_method ?? "rss"}
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {ACCESS_METHODS.map((method) => (
              <option key={method} value={method}>
                {method.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${prefix}-region`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Region
          </label>
          <select
            id={`${prefix}-region`}
            name="region_hint"
            defaultValue={s?.region_hint ?? "global"}
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region === "global"
                  ? "Global"
                  : region === "africa"
                    ? "Africa"
                    : "Ghana"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
        <h3 className="text-sm font-bold text-gray-900">
          Source permissions
        </h3>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="is_primary"
            value="on"
            defaultChecked={Boolean(s?.is_primary)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-800">
              Official or primary source
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-gray-500">
              Identify first-party sources such as official research labs,
              company blogs, or government publications.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="allow_fulltext"
            value="on"
            defaultChecked={Boolean(s?.allow_fulltext)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-800">
              Full-page fetching permitted
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-gray-500">
              Enable only when the source&apos;s terms allow this type of
              retrieval.
            </span>
          </span>
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900">
          Terms and compliance
        </h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Record the source&apos;s terms and the outcome of your review.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor={`${prefix}-terms-url`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Terms URL
          </label>
          <input
            id={`${prefix}-terms-url`}
            type="url"
            name="terms_url"
            defaultValue={s?.terms_url ?? ""}
            placeholder="https://example.com/terms"
            className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <Field
          label="Terms last reviewed"
          name="terms_reviewed_at"
          type="date"
          defaultValue={termsDate}
        />

        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor={`${prefix}-terms-notes`}
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Terms review notes
          </label>
          <textarea
            id={`${prefix}-terms-notes`}
            name="terms_notes"
            rows={3}
            defaultValue={s?.terms_notes ?? ""}
            placeholder="Record what access, retrieval, and reuse are permitted."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="sm:max-w-xs">
          <Field
            label="Polling interval (minutes)"
            name="poll_interval_minutes"
            type="number"
            min={1}
            defaultValue={s?.poll_interval_minutes ?? ""}
          />
          <p className="mt-1 text-[11px] leading-5 text-gray-400">
            Optional source-specific interval.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-gray-500">
          {s
            ? "Save changes to update this source's configuration."
            : "New sources should remain paused until they have been reviewed."}
        </p>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {s ? "Save source changes" : "Add source"}
        </button>
      </div>
    </form>
  );
}

export default async function Sources({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;

  const sources = await sql<any[]>`
    select *
    from sources
    order by status, name
  `;

  const activeCount = sources.filter(
    (source) => source.status === "active"
  ).length;

  const pausedCount = sources.filter(
    (source) => source.status === "paused"
  ).length;

  const disabledCount = sources.filter(
    (source) => source.status === "disabled"
  ).length;

  const needsTermsCount = sources.filter(
    (source) => !source.terms_reviewed_at
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          SALFRA / Source management
        </p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Sources
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Manage trusted publishers, collection endpoints, regional
              coverage, and source permissions.
            </p>
          </div>

          <a
            href="#add-source"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            + Add source
          </a>
        </div>
      </header>

      {msg && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"
        >
          {msg}
        </div>
      )}

      <section
        aria-label="Source overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Total sources
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {sources.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Configured source records
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Active sources
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
            {activeCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Currently marked active
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Paused sources
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">
            {pausedCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Not currently active
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Terms review missing
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {needsTermsCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            No review date recorded
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Source directory
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Expand a source to edit its configuration or change its status.
            </p>
          </div>

          <span className="self-start rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-auto">
            {disabledCount} disabled
          </span>
        </div>

        {sources.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-base font-bold text-gray-950">
              No sources configured
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Add a trusted source to start building your source directory.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sources.map((source) => (
              <details key={source.id} className="group">
                <summary className="cursor-pointer list-none px-5 py-5 transition-colors hover:bg-gray-50/70 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          source.status === "active"
                            ? "bg-emerald-500"
                            : source.status === "paused"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                        }`}
                        aria-hidden="true"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-bold text-gray-950">
                            {source.name}
                          </h3>
                          <SourceStatus status={source.status} />

                          {source.is_primary && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                              Primary
                            </span>
                          )}

                          {!source.terms_reviewed_at && (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">
                              Terms review missing
                            </span>
                          )}
                        </div>

                        <p className="mt-1 break-all text-xs text-gray-500">
                          {source.domain}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span>
                            {(source.source_type || "other").replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                          <span>{source.access_method?.toUpperCase()}</span>
                          <span className="capitalize">
                            {source.region_hint || "global"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pl-6 text-xs text-gray-500 lg:pl-0">
                      <span>
                        <span className="font-semibold text-gray-700">
                          Failures:
                        </span>{" "}
                        {source.failure_count ?? 0}
                      </span>

                      <span>
                        <span className="font-semibold text-gray-700">
                          Last success:
                        </span>{" "}
                        {source.last_success_at
                          ? formatTime(source.last_success_at)
                          : "Never"}
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-gray-400 transition-transform group-open:rotate-180"
                      >
                        ▾
                      </span>
                    </div>
                  </div>

                  {source.paused_reason && (
                    <p className="mt-3 ml-6 break-words text-xs leading-5 text-amber-800">
                      <span className="font-semibold">Pause reason:</span>{" "}
                      {source.paused_reason}
                    </p>
                  )}
                </summary>

                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-5 sm:px-6">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                    <SourceForm s={source} />
                  </div>

                  <div className="mt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Source status controls
                    </h4>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {["active", "paused", "disabled"]
                        .filter((status) => status !== source.status)
                        .map((status) => (
                          <form key={status} action={setSourceStatus}>
                            <input
                              type="hidden"
                              name="id"
                              value={source.id}
                            />
                            <input
                              type="hidden"
                              name="to"
                              value={status}
                            />

                            <button
                              type="submit"
                              className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                                status === "active"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                  : status === "paused"
                                    ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {status === "active"
                                ? "Enable / resume"
                                : status === "paused"
                                  ? "Pause source"
                                  : "Disable source"}
                            </button>
                          </form>
                        ))}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-gray-500">
                      Activating a source should only be done after its terms
                      have been reviewed and its feed or API has been verified.
                      The existing server action remains responsible for
                      enforcing permitted status transitions.
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section
        id="add-source"
        className="scroll-mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Source onboarding
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">
            Add a source
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Add a feed or API endpoint. New sources should start paused while
            their access permissions and terms are reviewed.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <SourceForm />
        </div>
      </section>
    </main>
  );
}
