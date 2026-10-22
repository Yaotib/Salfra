// web/src/lib/types.ts
export type StoryCardData = {
  id: string; slug: string; headline: string; card_summary: string; categories: string[];
  region: string; evidence_label: string; is_limited: boolean; status: string;
  first_reported_at: Date; last_material_update_at: Date | null; publishers: string[];
  media_url: string | null; media_type: "image" | "video" | null;
  media_source_name: string | null; media_source_url: string | null;
  media_alt_text: string | null; media_license: string | null;
};
export type StoryBody = { what_happened?: string; why_it_matters?: string; uncertain?: string; conflicting?: boolean; limited?: boolean };
export type StoryFull = StoryCardData & {
  body: StoryBody; story_type: string; published_at: Date | null;
  withdrawn_reason: string | null; merged_slug: string | null;
};
export type SourceRef = { publisher: string; domain: string; title: string; url: string; published_at: Date | null; role: string; is_syndicated: boolean };

export const CATEGORIES = [
  { slug: "ai-news", name: "AI News" },
  { slug: "global-tech", name: "Global Tech" },
  { slug: "product-releases", name: "Product Releases" },
  { slug: "african-tech", name: "African Tech" },
];

export const EVIDENCE_LABELS: Record<string, { label: string; help: string }> = {
  primary_source_available: { label: "Primary source available", help: "An original announcement, paper or official notice is linked below." },
  multiple_publishers: { label: "Reported by multiple publishers", help: "More than one publisher covered this. That does not by itself mean independent confirmation." },
  independently_corroborated: { label: "Independently corroborated", help: "Genuinely independent sources support the key claims." },
  single_source: { label: "Single-source report", help: "This currently relies on one reporting source." },
  reports_differ: { label: "Reports differ", help: "Sources disagree on a material point. See the uncertainty section." },
  verification_incomplete: { label: "Verification incomplete", help: "Important evidence was not available to us." },
};