// web/src/components/StoryCard.tsx
import Link from "next/link";
import { formatTime, iso } from "@/lib/format";
import type { StoryCardData } from "@/lib/types";

export function StoryCard({ s }: { s: StoryCardData }) {
  const regionTag = s.region === "ghana" ? "Ghana" : s.region === "africa" ? "Africa" : null;
  return (
    <article className="card">
      <ul className="tags" aria-label="Topics">
        {s.categories.map((c) => <li key={c} className="tag">{c}</li>)}
        {regionTag && <li className="tag">{regionTag}</li>}
        {s.status === "updated" && <li className="badge">Updated</li>}
        {s.is_limited && <li className="badge">Limited entry</li>}
      </ul>
      <h2><Link href={`/stories/${s.slug}`}>{s.headline}</Link></h2>
      <p>{s.card_summary}</p>
      <p className="meta">
        AI-generated summary · Sources: {s.publishers.join(", ")} ·{" "}
        <time dateTime={iso(s.first_reported_at)}>{formatTime(s.first_reported_at)}</time>
      </p>
    </article>
  );
}