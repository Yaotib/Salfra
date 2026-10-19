// web/src/app/admin/(panel)/audit/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Audit() {
  const rows = await sql<any[]>`select at, actor, action, target_type, target_id, before, after, note from audit_events order by at desc limit 150`;
  return (
    <>
      <h1>Audit log</h1>
      <table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Change</th></tr></thead><tbody>
        {rows.map((r, i) => (<tr key={i}><td>{formatTime(r.at)}</td><td>{r.actor}</td><td>{r.action}</td><td>{r.target_type} {r.target_id}</td>
          <td>{r.note}{r.before && <> · before: {JSON.stringify(r.before).slice(0, 160)}</>}{r.after && <> · after: {JSON.stringify(r.after).slice(0, 160)}</>}</td></tr>))}
      </tbody></table>
    </>
  );
}