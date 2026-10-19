// web/src/app/feed.xml/route.ts
import { escapeXml, SITE_NAME, SITE_URL } from "@/lib/format";
import { listStories } from "@/lib/queries";

export const revalidate = 600;

export async function GET() {
  const { stories } = await listStories({});
  const items = stories.map((s) => `<item><title>${escapeXml(s.headline)}</title>
<link>${SITE_URL}/stories/${s.slug}</link><guid isPermaLink="true">${SITE_URL}/stories/${s.slug}</guid>
<pubDate>${new Date(s.first_reported_at).toUTCString()}</pubDate>
<description>${escapeXml(`${s.card_summary} (AI-generated summary. See the linked sources.)`)}</description></item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(SITE_NAME)}</title>
<link>${SITE_URL}</link><description>AI and technology news, summarised with links to the original reporting.</description>
<language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}