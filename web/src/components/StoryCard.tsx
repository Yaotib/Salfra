
import Link from "next/link";
import { formatTime, iso } from "@/lib/format";
import type { StoryCardData } from "@/lib/types";

export function StoryCard({ s }: { s: StoryCardData }) {
  const regionTag =
    s.region === "ghana"
      ? "Ghana"
      : s.region === "africa"
        ? "Africa"
        : null;

  return (
    <article className="card">
      {s.media_url && (
        <div className="card-media-wrap mb-3 overflow-hidden rounded-lg relative">
          <Link href={`/stories/${s.slug}`} tabIndex={-1} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.media_url}
              alt={s.media_alt_text || s.headline}
              loading="lazy"
              decoding="async"
              className="card-media-img w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
            />
          </Link>
          {s.media_type === "video" && (
            <span className="card-video-pill absolute bottom-2 right-2 bg-black/75 backdrop-blur text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1" aria-label="Video story">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Video
            </span>
          )}
        </div>
      )}

      <ul className="tags" aria-label="Topics">
        {s.categories.map((c) => <li key={c} className="tag">{c}</li>)}
        {regionTag && <li className="tag">{regionTag}</li>}
        {s.status === "updated" && <li className="badge">Updated</li>}
        {s.is_limited && <li className="badge">Limited entry</li>}
      </ul>

      <h2 className="text-lg font-bold leading-snug tracking-tight text-gray-950 sm:text-xl">
        <Link
          href={`/stories/${s.slug}`}
          className="decoration-2 underline-offset-4 transition-colors group-hover:text-blue-800 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {s.headline}
        </Link>
      </h2>

      <p className="mt-2.5 text-sm leading-6 text-gray-600 sm:text-[15px] sm:leading-7">
        {s.card_summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-gray-500">
        <span className="font-semibold text-gray-700">
          {s.publishers.length === 1 ? "Source" : "Sources"}
        </span>

        <span className="min-w-0 break-words">
          {s.publishers.length > 0
            ? s.publishers.join(", ")
            : "Source details unavailable"}
        </span>

        {s.media_source_name && (
          <>
            <span aria-hidden="true" className="text-gray-300">
              ·
            </span>
            <span>Media: {s.media_source_name}</span>
          </>
        )}

        <span aria-hidden="true" className="text-gray-300">
          ·
        </span>

        <time dateTime={iso(s.first_reported_at)}>
          {formatTime(s.first_reported_at)}
        </time>
      </div>

      <p className="mt-2 text-[11px] font-medium text-gray-400">
        AI-generated summary
      </p>
    </article>
  );
}
