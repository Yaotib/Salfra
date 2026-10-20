
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
    <article className="group border-b border-gray-200 px-5 py-5 transition-colors hover:bg-gray-50/70 sm:px-6">
      <ul
        className="mb-3 flex list-none flex-wrap items-center gap-2 p-0"
        aria-label="Story topics and status"
      >
        {s.categories.map((category) => (
          <li
            key={category}
            className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800"
          >
            {category}
          </li>
        ))}

        {regionTag && (
          <li className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
            {regionTag}
          </li>
        )}

        {s.status === "updated" && (
          <li className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Updated
          </li>
        )}

        {s.is_limited && (
          <li className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-500">
            Limited coverage
          </li>
        )}
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
