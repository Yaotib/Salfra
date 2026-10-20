
/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { updateSetting } from "../actions";

export const dynamic = "force-dynamic";

const BOOLS: [string, string, string][] = [
  [
    "publishing_paused",
    "Publishing kill switch",
    "Pause all publishing while leaving collection and review operations separate.",
  ],
  [
    "collection_paused",
    "Pause collection",
    "Stop collection activity controlled by this setting.",
  ],
  [
    "auto_publish_enabled",
    "Automatic publishing",
    "Allow eligible low-risk stories to be published automatically. Keep disabled until the pilot passes.",
  ],
];

const NUMS = [
  {
    key: "max_stories_per_day",
    label: "Daily publishing limit",
    description: "Maximum stories permitted per day.",
    min: 1,
    max: 500,
  },
  {
    key: "llm_daily_call_budget",
    label: "Daily LLM call budget",
    description: "Maximum language-model calls allowed per day.",
    min: 0,
    max: 100000,
  },
  {
    key: "freshness_hours",
    label: "Content freshness window",
    description: "How many hours of content freshness to allow.",
    min: 1,
    max: 8760,
  },
  {
    key: "source_failure_threshold",
    label: "Source failure threshold",
    description: "Failures before a source is treated as unhealthy.",
    min: 1,
    max: 100,
  },
  {
    key: "review_queue_max",
    label: "Review queue limit",
    description: "Maximum review items permitted by the configured guard.",
    min: 1,
    max: 10000,
  },
  {
    key: "collection_interval_minutes",
    label: "Collection interval",
    description:
      "Worker guard interval in minutes. The scheduler has a separate configuration.",
    min: 1,
    max: 10080,
  },
];

function isEnabled(value: unknown) {
  return value === true || value === "true";
}

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireAdmin([]);

  const { msg } = await searchParams;

  const settingsRows = await sql<any[]>`
    select key, value
    from settings
  `;

  const settings = Object.fromEntries(
    settingsRows.map((row) => [row.key, row.value])
  );

  const publishingPaused = isEnabled(settings.publishing_paused);
  const collectionPaused = isEnabled(settings.collection_paused);
  const autoPublishEnabled = isEnabled(settings.auto_publish_enabled);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 pb-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          SALFRA / Administration
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              System settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Manage publishing controls, collection behavior, and operational
              limits for the SALFRA pipeline.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Owner access
          </span>
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

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[10px] font-bold ${
              publishingPaused
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {publishingPaused ? "PAUSED" : "ACTIVE"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-gray-950">
                Publishing status
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  publishingPaused
                    ? "bg-amber-50 text-amber-800"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {publishingPaused ? "Paused" : "Not paused"}
              </span>
            </div>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              {publishingPaused
                ? "The publishing pause setting is enabled."
                : "The publishing pause setting is disabled. Other controls and pipeline safeguards still apply."}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-bold text-amber-900">
            Publishing kill switch
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            Use this control when you need to stop publishing quickly. Confirm
            that the worker and publishing pipeline enforce this setting
            before relying on it as an emergency stop.
          </p>

          <form action={updateSetting} className="mt-4">
            <input
              type="hidden"
              name="key"
              value="publishing_paused"
            />
            <input
              type="hidden"
              name="value"
              value={String(!publishingPaused)}
            />

            <button
              type="submit"
              className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                publishingPaused
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600"
                  : "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600"
              }`}
            >
              {publishingPaused
                ? "Resume publishing"
                : "Pause all publishing"}
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Pipeline controls
          </p>
          <h2 className="mt-1 text-base font-bold text-gray-950">
            Operational switches
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Enable or disable individual behaviors. Check the consequences
            before changing a live system.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {BOOLS.filter(([key]) => key !== "publishing_paused").map(
            ([key, label, description]) => {
              const enabled = isEnabled(settings[key]);

              return (
                <div
                  key={key}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        {label}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          enabled
                            ? "bg-amber-50 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {enabled ? "ON" : "OFF"}
                      </span>
                    </div>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                      {description}
                    </p>
                  </div>

                  <form action={updateSetting} className="shrink-0">
                    <input type="hidden" name="key" value={key} />
                    <input
                      type="hidden"
                      name="value"
                      value={String(!enabled)}
                    />

                    <button
                      type="submit"
                      className={`inline-flex min-h-10 min-w-28 items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                        enabled
                          ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          : "bg-gray-950 text-white hover:bg-blue-700"
                      }`}
                    >
                      Turn {enabled ? "off" : "on"}
                    </button>
                  </form>
                </div>
              );
            }
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Resource limits
          </p>
          <h2 className="mt-1 text-base font-bold text-gray-950">
            Pipeline configuration
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Update numeric settings individually. Use conservative values
            until production behavior is well understood.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          {NUMS.map((item) => (
            <form
              key={item.key}
              action={updateSetting}
              className="flex flex-col border-b border-gray-100 p-5 sm:p-6"
            >
              <input
                type="hidden"
                name="key"
                value={item.key}
              />

              <label
                htmlFor={`setting-${item.key}`}
                className="text-sm font-bold text-gray-900"
              >
                {item.label}
              </label>

              <p className="mt-1 min-h-10 text-xs leading-5 text-gray-500">
                {item.description}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <input
                  id={`setting-${item.key}`}
                  type="number"
                  name="value"
                  min={item.min}
                  max={item.max}
                  step={1}
                  required
                  defaultValue={
                    settings[item.key] == null
                      ? ""
                      : String(settings[item.key])
                  }
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-gray-950 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Save
                </button>
              </div>

              <p className="mt-2 break-words font-mono text-[10px] text-gray-400">
                {item.key}
              </p>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 sm:p-6">
        <div>
          <h2 className="text-sm font-bold text-blue-950">
            Worker and scheduler configuration
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-900/80">
            The collection interval setting changes the worker&apos;s
            configured guard. It does not automatically change the GitHub
            Actions schedule. The cron schedule is configured separately in
            <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs text-blue-950">
              .github/workflows/collect.yml
            </code>
            .
          </p>

          <p className="mt-2 text-xs leading-5 text-blue-900/70">
            Form-level number limits improve usability, but the server
            action should also validate allowed keys, ranges, permissions,
            and value types before saving settings.
          </p>
        </div>
      </section>
    </main>
  );
}
