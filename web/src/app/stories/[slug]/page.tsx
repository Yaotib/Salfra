// web/src/app/stories/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatTime, iso, SITE_URL } from "@/lib/format";
import { getStory, getStoryDetail } from "@/lib/queries";
import { EVIDENCE_LABELS } from "@/lib/types";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };
const ROLE: Record<string, string> = { primary: "Primary source", independent: "Independent report", additional: "Additional coverage" };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStory(slug);
  if (!s || s.merged_slug) return { title: "Story not found" };
  return {
    title: s.headline, description: s.card_summary, alternates: { canonical: `/stories/${s.slug}` },
    openGraph: { type: "article", title: s.headline, description: s.card_summary, url: `${SITE_URL}/stories/${s.slug}` },
  };
}

export default async function StoryPage({ params }: P) {
  const { slug } = await params;
  const s = await getStory(slug);
  if (!s) notFound();
  if (s.merged_slug) redirect(`/stories/${s.merged_slug}`);
  const withdrawn = s.status === "withdrawn";
  const { sources, corrections, links, related } = await getStoryDetail(s.id);
  const label = EVIDENCE_LABELS[s.evidence_label];
  const b = s.body ?? {};

  return (
    <article>
      <ul className="tags" aria-label="Topics">
        {s.categories.map((c) => <li key={c} className="tag">{c}</li>)}
        {s.region !== "global" && (
          <li className={`tag tag-${s.region}`}>
            {s.region === "ghana" ? "Ghana" : "Africa"}
          </li>
        )}
        {s.status === "updated" && <li className="badge badge-updated">Updated</li>}
        {s.is_limited && <li className="badge badge-limited">Limited entry</li>}
      </ul>

      <h1>{s.headline}</h1>

      <p className="meta">
        First reported <time dateTime={iso(s.first_reported_at)}>{formatTime(s.first_reported_at)}</time>
        {s.last_material_update_at && <> · Updated <time dateTime={iso(s.last_material_update_at)}>{formatTime(s.last_material_update_at)}</time></>}
      </p>

      {withdrawn ? (
        <div className="notice notice-warning" role="alert">
          <strong>This story has been withdrawn.</strong> {s.withdrawn_reason}
        </div>
      ) : (
        <>
          <p className="notice">
            <strong>AI-generated summary.</strong> It may contain errors. Please read the original sources below.{" "}
            <Link href="/methodology">How we curate</Link>
          </p>

          {s.is_limited && (
            <p className="notice">Limited entry: only a headline and short description were accessible, so this is not a full summary.</p>
          )}

          {label && (
            <p style={{ margin: "14px 0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="badge">{label.label}</span>
              <span className="meta">{label.help}</span>
            </p>
          )}

          <div className="evidence-container">
            {b.what_happened && (
              <section className="panel-box panel-happened" aria-labelledby="panel-happened-title">
                <h2 id="panel-happened-title" className="panel-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  What Happened
                </h2>
                <p className="panel-body prewrap">{b.what_happened}</p>
              </section>
            )}

            {b.why_it_matters && (
              <section className="panel-box panel-matters" aria-labelledby="panel-matters-title">
                <h2 id="panel-matters-title" className="panel-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Why It Matters
                </h2>
                <p className="panel-body prewrap">{b.why_it_matters}</p>
              </section>
            )}

            {(b.uncertain || b.conflicting) && (
              <section className="panel-box panel-uncertain" aria-labelledby="panel-uncertain-title">
                <h2 id="panel-uncertain-title" className="panel-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  What Remains Uncertain
                </h2>
                <p className="panel-body prewrap">{b.uncertain || "Reports differ on a material point. See the sources below."}</p>
              </section>
            )}
          </div>
        </>
      )}

      <h2>Sources</h2>
      <ol className="sources">
        {sources.map((x) => (
          <li key={x.url}>
            <strong>{x.is_syndicated ? "Syndicated copy" : ROLE[x.role]}:</strong>{" "}
            <a href={x.url} rel="noopener noreferrer" target="_blank">{x.title}</a> ({x.publisher}
            {x.published_at && <>, <time dateTime={iso(x.published_at)}>{formatTime(x.published_at)}</time></>})
          </li>
        ))}
      </ol>

      {corrections.length > 0 && (
        <section aria-labelledby="corr">
          <h2 id="corr">Corrections and updates</h2>
          <ul>
            {corrections.map((c) => (
              <li key={iso(c.created_at)}>
                <time dateTime={iso(c.created_at)}>{formatTime(c.created_at)}</time>: {c.note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h2>Connected stories</h2>
          <ul>
            {links.map((l) => (
              <li key={l.slug}>
                {l.kind === "earlier" ? "Earlier: " : "Follow-up: "}
                <Link href={`/stories/${l.slug}`}>{l.headline}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2>Related stories</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/stories/${r.slug}`}>{r.headline}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}