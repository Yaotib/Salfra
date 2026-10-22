"use client";

import { useState } from "react";

export type StoryMediaProps = {
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  sourceName: string | null;
  sourceUrl: string | null;
  altText: string | null;
  license: string | null;
  headline: string;
};

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // YouTube
    if (host.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    if (host.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\/+/, "");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }

    // Vimeo
    if (host.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch (err) {
    console.warn("Could not parse embed URL:", err);
  }
  return null;
}

export function StoryMedia({
  mediaUrl,
  mediaType,
  sourceName,
  sourceUrl,
  altText,
  license,
  headline,
}: StoryMediaProps) {
  const [loadError, setLoadError] = useState(false);

  if (!mediaUrl || loadError) {
    return null;
  }

  const isVideo = mediaType === "video";
  const embedUrl = isVideo ? getEmbedUrl(mediaUrl) : null;
  const description = altText || headline;

  return (
    <figure className="story-media-container" aria-label={isVideo ? "Story video" : "Story image"}>
      <div className="story-media-stage">
        {isVideo ? (
          embedUrl ? (
            <div className="story-video-embed">
              <iframe
                src={embedUrl}
                title={description}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
                className="story-video-iframe"
              />
            </div>
          ) : (
            <video
              controls
              playsInline
              preload="metadata"
              className="story-video-player"
              aria-label={description}
              onError={() => setLoadError(true)}
            >
              <source src={mediaUrl} />
              Your browser does not support the video tag.
            </video>
          )
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mediaUrl}
            alt={description}
            loading="lazy"
            decoding="async"
            className="story-media-img"
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      <figcaption className="media-citation">
        <span className="media-credit">
          {isVideo ? "Video: " : "Image: "}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {sourceName || "Original reporting"}
            </a>
          ) : (
            <span>{sourceName || "Original reporting"}</span>
          )}
        </span>
        {license && <span className="media-license"> · {license}</span>}
      </figcaption>
    </figure>
  );
}
