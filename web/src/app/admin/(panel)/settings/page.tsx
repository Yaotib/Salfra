// web/src/app/admin/(panel)/settings/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { updateSetting } from "../actions";

export const dynamic = "force-dynamic";
const BOOLS: [string, string][] = [["publishing_paused", "Kill switch: pause ALL publishing"], ["collection_paused", "Pause collection"], ["auto_publish_enabled", "Auto-publish low-risk stories (leave OFF until the pilot passes)"]];
const NUMS = ["max_stories_per_day", "llm_daily_call_budget", "freshness_hours", "source_failure_threshold", "review_queue_max", "collection_interval_minutes"];

export default async function Settings({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin([]);
  const { msg } = await searchParams;
  if (msg === undefined && false) redirect("/admin");
  const s = Object.fromEntries((await sql<any[]>`select key, value from settings`).map((r) => [r.key, r.value]));
  return (
    <>
      <h1>Settings (owner only)</h1>
      {msg && <p role="status" className="notice">{msg}</p>}
      <h2>Switches</h2>
      {BOOLS.map(([k, label]) => (
        <form key={k} action={updateSetting}><input type="hidden" name="key" value={k} /><input type="hidden" name="value" value={String(!s[k])} />
          <p>{label}: <strong>{s[k] ? "ON" : "off"}</strong> <button className={k === "publishing_paused" && !s[k] ? "danger" : undefined}>{s[k] ? "Turn off" : "Turn on"}</button></p></form>
      ))}
      <h2>Limits</h2>
      {NUMS.map((k) => (
        <form key={k} action={updateSetting}><input type="hidden" name="key" value={k} />
          <label>{k} <input type="number" name="value" defaultValue={String(s[k])} /></label> <button>Save</button></form>
      ))}
      <p className="meta">Changing the collection interval here changes the worker&apos;s guard. The GitHub Actions cron schedule is separate and lives in .github/workflows/collect.yml.</p>
    </>
  );
}