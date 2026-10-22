
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

function isEnabled(value: unknown): boolean {
  return value === true || value === "true";
}

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireAdmin([]);

  const { msg } = await searchParams;
  const settings = Object.fromEntries((await sql<any[]>`select key, value from settings`).map((r) => [r.key, r.value]));
  return (
    <>
      <h1>Settings (owner only)</h1>

      {msg && (
        <p role="status" className="notice">
          {msg}
        </p>
      )}

      <h2>Switches</h2>

      {BOOLS.map(([key, label, description]) => {
        const enabled = isEnabled(settings[key]);

        return (
          <form key={key} action={updateSetting}>
            <input type="hidden" name="key" value={key} />
            <input
              type="hidden"
              name="value"
              value={String(!enabled)}
            />

            <p>
              <strong>{label}: {enabled ? "ON" : "OFF"}</strong>{" "}
              <button
                type="submit"
                className={
                  key === "publishing_paused" && !enabled
                    ? "danger"
                    : undefined
                }
              >
                {enabled ? "Turn off" : "Turn on"}
              </button>
            </p>

            <p className="meta">{description}</p>
          </form>
        );
      })}

      <h2>Limits</h2>

      {NUMS.map((setting) => (
        <form key={setting.key} action={updateSetting}>
          <input
            type="hidden"
            name="key"
            value={setting.key}
          />

          <p>
            <label>
              <strong>{setting.label}</strong>
              <br />
              {setting.description}
              <br />
              <input
                type="number"
                name="value"
                min={setting.min}
                max={setting.max}
                required
                defaultValue={String(settings[setting.key] ?? "")}
              />
            </label>{" "}
            <button type="submit">Save</button>
          </p>
        </form>
      ))}

      <p className="meta">
        Changing the collection interval here changes the worker&apos;s guard.
        The GitHub Actions cron schedule is separate and lives in
        .github/workflows/collect.yml.
      </p>
    </>
  );
}