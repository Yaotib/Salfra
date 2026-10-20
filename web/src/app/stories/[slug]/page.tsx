
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatTime, iso, SITE_URL } from "@/lib/format";
import { getStory, getStoryDetail } from "@/lib/queries";
import { EVIDENCE_LABELS } from "@/lib/types";

export const revalidate = 300;

type P = { params: Promise<{ slug: string }> };

const ROLE: Record<string, string> = {
  primary: "Primary source",
  independent: "Independent report",
  additional: "Additional coverage",
};

export async function generateMetadata({
  params,
}: P): Promise<Metadata> {
  const s = await getStory((await params).slug);

  if (!s || s.merged_slug) {
    return { title: "Story not found" };
  }

  return {
    title: s.headline,
    description: s.card_summary,
    alternates: {
      canonical: `/stories/${s.slug}`,
    },
    openGraph: {
      type: "article",
      title: s.headline,
      description: s.card_summary,
      url: `${SITE_URL}/stories/${s.slug}`,
    },
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
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 xl:grid-cols-[minmax(0,760px)_300px]">
        <article className="min-w-0">
          <header className="border-b border-gray-200 px-5 py-6 sm:px-8 sm:py-8">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 no-underline transition-colors hover:text-blue-700 hover:no-underline"
            >
              <span aria-hidden="true">←</span>
              Back to latest stories
            </Link>

            <ul
              className="mt-5 flex flex-wrap gap-2 list-none p-0"
              aria-label="Topics"
            >
              {s.categories.map((category) => (
                <li
                  key={category}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
                >
                  {category}
                </li>
              ))}

              {s.region !== "global" && (
                <li className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {s.region === "ghana" ? "Ghana" : "Africa"}
                </li>
              )}
            </ul>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-[2.75rem]">
              {s.headline}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs leading-5 text-gray-500 sm:text-sm">
              <p>
                First reported{" "}
                <time dateTime={iso(s.first_reported_at)}>
                  {formatTime(s.first_reported_at)}
                </time>
              </p>

              {s.last_material_update_at && (
                <p>
                  <span aria-hidden="true" className="mr-2 text-gray-300">
                    ·
                  </span>
                  Updated{" "}
                  <time dateTime={iso(s.last_material_update_at)}>
                    {formatTime(s.last_material_update_at)}
                  </time>
                </p>
              )}
            </div>
          </header>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {withdrawn ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-900"
                role="alert"
              >
                <h2 className="text-base font-bold">
                  This story has been withdrawn
                </h2>

                {s.withdrawn_reason && (
                  <p className="mt-2">{s.withdrawn_reason}</p>
                )}
              </div>
            ) : (
              <div className="space-y-7">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                  <p className="text-sm leading-6 text-gray-700">
                    <strong className="font-bold text-gray-950">
                      AI-generated summary.
                    </strong>{" "}
                    This summary may contain errors. Read the original sources
                    below to verify details and get the full context.{" "}
                    <Link
                      href="/methodology"
                      className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700"
                    >
                      How we curate
                    </Link>
                  </p>
                </div>

                {s.is_limited && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <strong className="font-bold">Limited coverage.</strong>{" "}
                    Only a headline and short description were accessible, so
                    this is not a full summary.
                  </div>
                )}

                {label && (
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="inline-flex shrink-0 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      {label.label}
                    </span>

                    <p className="text-sm leading-6 text-gray-500">
                      {label.help}
                    </p>
                  </div>
                )}

                <section aria-labelledby="what-happened">
                  <h2
                    id="what-happened"
                    className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl"
                  >
                    What happened
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-gray-700">
                    {b.what_happened}
                  </p>
                </section>

                {b.why_it_matters && (
                  <section
                    aria-labelledby="why-it-matters"
                    className="border-t border-gray-200 pt-6"
                  >
                    <h2
                      id="why-it-matters"
                      className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl"
                    >
                      Why it matters
                    </h2>

                    <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-gray-700">
                      {b.why_it_matters}
                    </p>
                  </section>
                )}

                {(b.uncertain || b.conflicting) && (
                  <section
                    aria-labelledby="uncertainty"
                    className="border-t border-gray-200 pt-6"
                  >
                    <h2
                      id="uncertainty"
                      className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl"
                    >
                      What remains uncertain
                    </h2>

                    <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-gray-700">
                      {b.uncertain ||
                        "Reports differ on a material point. Consult the original sources below for further context."}
                    </p>
                  </section>
                )}
              </div>
            )}

            <section
              aria-labelledby="story-sources"
              className="mt-10 border-t border-gray-200 pt-7"
            >
              <div className="mb-5">
                <h2
                  id="story-sources"
                  className="text-xl font-extrabold tracking-tight text-gray-950"
                >
                  Original sources
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Follow the links to read the original reporting and verify
                  the details.
                </p>
              </div>

              {sources.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 p-5 text-sm leading-6 text-gray-500">
                  No source links are currently available for this story.
                </p>
              ) : (
                <ol className="list-none divide-y divide-gray-200 rounded-xl border border-gray-200 p-0">
                  {sources.map((source, index) => (
                    <li
                      key={source.url}
                      className="px-4 py-4 sm:px-5"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 font-mono text-xs text-gray-400"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {source.is_syndicated
                              ? "Syndicated copy"
                              : ROLE[source.role] ?? "Additional coverage"}
                          </p>

                          <a
                            href={source.url}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="mt-1 block break-words text-sm font-bold leading-6 text-gray-950 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-blue-700"
                          >
                            {source.title}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {source.publisher}
                            {source.published_at && (
                              <>
                                {" · "}
                                <time dateTime={iso(source.published_at)}>
                                  {formatTime(source.published_at)}
                                </time>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {corrections.length > 0 && (
              <section
                aria-labelledby="corrections"
                className="mt-10 border-t border-gray-200 pt-7"
              >
                <h2
                  id="corrections"
                  className="text-xl font-extrabold tracking-tight text-gray-950"
                >
                  Corrections and updates
                </h2>

                <ol className="mt-4 list-none space-y-3 p-0">
                  {corrections.map((correction) => (
                    <li
                      key={iso(correction.created_at)}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <time
                        dateTime={iso(correction.created_at)}
                        className="text-xs font-medium text-gray-500"
                      >
                        {formatTime(correction.created_at)}
                      </time>

                      <p className="mt-2 text-sm leading-7 text-gray-700">
                        {correction.note}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </article>

        <aside className="min-w-0 border-t border-gray-200 px-5 py-6 sm:px-8 lg:border-l lg:border-t-0 lg:px-5">
          <section aria-labelledby="story-navigation">
            <h2
              id="story-navigation"
              className="text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              Explore SALFRA
            </h2>

            <nav className="mt-3 space-y-1">
              <Link
                href="/stories"
                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
              >
                Latest stories
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/search"
                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
              >
                Search news
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/methodology"
                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 hover:no-underline"
              >
                Our methodology
                <span aria-hidden="true">→</span>
              </Link>
            </nav>
          </section>

          {links.length > 0 && (
            <section
              aria-labelledby="connected-stories"
              className="mt-7 border-t border-gray-200 pt-6"
            >
              <h2
                id="connected-stories"
                className="text-base font-extrabold tracking-tight text-gray-950"
              >
                Story timeline
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Earlier coverage and follow-ups.
              </p>

              <ul className="mt-3 list-none divide-y divide-gray-200 p-0">
                {links.map((link) => (
                  <li key={`${link.kind}-${link.slug}`} className="py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {link.kind === "earlier" ? "Earlier story" : "Follow-up"}
                    </p>

                    <Link
                      href={`/stories/${link.slug}`}
                      className="mt-1 block text-sm font-semibold leading-6 text-gray-800 no-underline transition-colors hover:text-blue-700 hover:underline"
                    >
                      {link.headline}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section
              aria-labelledby="related-stories"
              className="mt-7 border-t border-gray-200 pt-6"
            >
              <h2
                id="related-stories"
                className="text-base font-extrabold tracking-tight text-gray-950"
              >
                Related stories
              </h2>

              <ul className="mt-3 list-none divide-y divide-gray-200 p-0">
                {related.map((story) => (
                  <li key={story.slug} className="py-3">
                    <Link
                      href={`/stories/${story.slug}`}
                      className="block text-sm font-semibold leading-6 text-gray-800 no-underline transition-colors hover:text-blue-700 hover:underline"
                    >
                      {story.headline}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-7 border-t border-gray-200 pt-5 text-xs leading-6 text-gray-500">
            SALFRA summaries are AI-generated and may contain errors. Check
            the original sources before relying on important details.
          </p>
        </aside>
      </div>
    </div>
  );
}
