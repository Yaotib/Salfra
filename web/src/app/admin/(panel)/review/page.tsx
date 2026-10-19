// web/src/app/admin/(panel)/review/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Review() {
  const rows = await sql<any[]>`select id, headline, status, evidence_label, risk_flags, review_priority, needs_attention,
      is_limited, created_at from stories
    where status = 'awaiting_review' or (needs_attention is not null and status <> 'withdrawn')
    order by (needs_attention is not null) desc, review_priority desc, created_at asc limit 100`;
  return (
    <>
      <h1>Review queue</h1>
      <p className="meta">Items needing attention (corrections, source changes, proposals) come first, then risk, then age.</p>
      {rows.length === 0 && <p role="status">Nothing waiting for review.</p>}
      <table><thead><tr><th>Story</th><th>Status</th><th>Flags</th><th>Evidence</th><th>Created</th></tr></thead><tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td><Link href={`/admin/stories/${r.id}`}>{r.headline}</Link></td>
            <td>{r.status}{r.needs_attention && <strong> · {r.needs_attention}</strong>}</td>
            <td>{[...r.risk_flags, r.is_limited ? "limited" : ""].filter(Boolean).join(", ") || "none"}</td>
            <td>{r.evidence_label}</td><td>{formatTime(r.created_at)}</td>
          </tr>
        ))}
      </tbody></table>
    </>
  );
}