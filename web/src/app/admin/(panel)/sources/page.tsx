
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { saveSource, setSourceStatus } from "../actions";
import { FeedbackToast } from "@/components/FeedbackToast";

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
