
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatTime, iso, SITE_URL } from "@/lib/format";
import { getStory, getStoryDetail } from "@/lib/queries";
import { EVIDENCE_LABELS } from "@/lib/types";
import { StoryMedia } from "@/components/StoryMedia";

export const revalidate = 300;

type P = { params: Promise<{ slug: string }> };

const ROLE: Record<string, string> = {
  primary: "Primary source",
  independent: "Independent report",
  additional: "Additional coverage",
};

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await getStory((await params).slug);
  if (!s || s.merged_slug) return { title: "Story not found" };
  const og: Metadata["openGraph"] = {
    type: "article",
    title: s.headline,
    description: s.card_summary,
    url: `${SITE_URL}/stories/${s.slug}`,
  };
  if (s.media_url && s.media_type === "image") {
    og.images = [{ url: s.media_url, alt: s.media_alt_text || s.headline }];
  }
  return {
    title: s.headline,
    description: s.card_summary,
    alternates: {
      canonical: `/stories/${s.slug}`,
    },
    openGraph: og,
  };
}

export default async function StoryPage({ params }: P) {
  const s = await getStory((await params).slug);
  if (!s) notFound();
  if (s.merged_slug) redirect(`/stories/${s.merged_slug}`);

  const withdrawn = s.status === "withdrawn";
  const { sources, corrections, links, related } = await getStoryDetail(
    s.id,
  );

  const label = EVIDENCE_LABELS[s.evidence_label];
  const b = s.body ?? {};

  return (
    <article>
      <ul className="tags" aria-label="Topics">
        {s.categories.map((c) => <li key={c} className="tag">{c}</li>)}
        {s.region !== "global" && <li className="tag">{s.region === "ghana" ? "Ghana" : "Africa"}</li>}
      </ul>
      <h1>{s.headline}</h1>
      <p className="meta">
        First reported <time dateTime={iso(s.first_reported_at)}>{formatTime(s.first_reported_at)}</time>
        {s.last_material_update_at && <> · Updated <time dateTime={iso(s.last_material_update_at)}>{formatTime(s.last_material_update_at)}</time></>}
      </p>
      <StoryMedia
        mediaUrl={s.media_url}
        mediaType={s.media_type}
        sourceName={s.media_source_name}
        sourceUrl={s.media_source_url}
        altText={s.media_alt_text}
        license={s.media_license}
        headline={s.headline}
      />
      {withdrawn ? (
        <div className="notice" role="alert"><strong>This story has been withdrawn.</strong> {s.withdrawn_reason}</div>
      ) : (
        <>
          <p className="notice"><strong>AI-generated summary.</strong> It may contain errors. Please read the original sources below.{" "}
            <Link href="/methodology">How we curate</Link></p>
          {s.is_limited && <p className="notice">Limited entry: only a headline and short description were accessible, so this is not a full summary.</p>}
          {label && <p><span className="badge">{label.label}</span> <span className="meta">{label.help}</span></p>}
          <h2>What happened</h2><p className="prewrap">{b.what_happened}</p>
          {b.why_it_matters && (<><h2>Why it matters</h2><p className="prewrap">{b.why_it_matters}</p></>)}
          {(b.uncertain || b.conflicting) && (<><h2>What remains uncertain</h2><p className="prewrap">{b.uncertain || "Reports differ on a material point. See the sources below."}</p></>)}
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
        <section aria-labelledby="corr"><h2 id="corr">Corrections and updates</h2>
          <ul>{corrections.map((c) => <li key={iso(c.created_at)}><time dateTime={iso(c.created_at)}>{formatTime(c.created_at)}</time>: {c.note}</li>)}</ul>
        </section>
      )}
      {links.length > 0 && (
        <section><h2>Connected stories</h2>
          <ul>{links.map((l) => <li key={l.slug}>{l.kind === "earlier" ? "Earlier: " : "Follow-up: "}<Link href={`/stories/${l.slug}`}>{l.headline}</Link></li>)}</ul>
        </section>
      )}
      {related.length > 0 && (
        <section><h2>Related stories</h2>
          <ul>{related.map((r) => <li key={r.slug}><Link href={`/stories/${r.slug}`}>{r.headline}</Link></li>)}</ul>
        </section>
      )}
    </article>
  );
}
