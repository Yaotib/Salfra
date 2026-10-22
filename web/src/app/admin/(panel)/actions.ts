// web/src/app/admin/(panel)/actions.ts
"use server";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";

type DB = postgres.Sql;
const J = (v: unknown) => sql.json(v as postgres.JSONValue);
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function audit(db: DB, actor: string, action: string, targetType: string, targetId: string | null,
                     before?: unknown, after?: unknown, note?: string) {
  await db`insert into audit_events (actor, action, target_type, target_id, before, after, note)
    values (${actor}, ${action}, ${targetType}, ${targetId}, ${before === undefined ? null : J(before)},
            ${after === undefined ? null : J(after)}, ${note ?? null})`;
}

async function attempt(fn: () => Promise<string>): Promise<string> {
  try { return await fn(); } catch (e) {
    const m = (e as Error).message ?? "Unknown error";
    if (m.includes("violates check constraint")) return "Error: rejected by a database rule (for example, a source cannot be active without a terms review date).";
    return `Error: ${m}`.slice(0, 220);
  }
}

function back(path: string, msg: string): never {
  revalidatePath("/", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}`);
}

// ---------- stories ----------
export async function setStoryStatus(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id"), to = str(fd, "to"), reason = str(fd, "reason");
  const msg = await attempt(async () => {
    if (!["published", "awaiting_review", "draft", "withdrawn"].includes(to)) throw new Error("Invalid target status");
    if (to === "withdrawn" && reason.length < 10) throw new Error("A withdrawal needs a public reason (10+ characters)");
    await sql.begin(async (tx) => {
      const [s] = await tx`select status from stories where id = ${id} for update`;
      if (to === "published") {
        await tx`update stories set status = 'published', published_at = coalesce(published_at, now()), needs_attention = null where id = ${id}`;
      } else if (to === "withdrawn") {
        await tx`update stories set status = 'withdrawn', withdrawn_reason = ${reason} where id = ${id}`;
      } else {
        await tx`update stories set status = ${to} where id = ${id}`;
      }
      await audit(tx as unknown as DB, admin.email, `story.${to}`, "story", id, { status: s.status }, { status: to }, reason || undefined);
    });
    return `Story is now ${to.replace("_", " ")}.`;
  });
  back(`/admin/stories/${id}`, msg);
}

export async function saveEdit(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id");
  const headline = str(fd, "headline"), card = str(fd, "card_summary");
  const cats = CATEGORIES.map((c) => c.name).filter((n) => fd.getAll("categories").includes(n));
  const region = ["global", "africa", "ghana"].includes(str(fd, "region")) ? str(fd, "region") : "global";
  const note = str(fd, "correction_note"), material = fd.get("material") === "on";

  const mediaUrl = str(fd, "media_url") || null;
  const rawMediaType = str(fd, "media_type");
  const mediaType = ["image", "video"].includes(rawMediaType) ? rawMediaType : null;
  const mediaSourceName = str(fd, "media_source_name") || null;
  const mediaSourceUrl = str(fd, "media_source_url") || null;
  const mediaAltText = str(fd, "media_alt_text") || null;
  const mediaLicense = str(fd, "media_license") || null;

  const msg = await attempt(async () => {
    if (headline.length < 10 || headline.length > 140) throw new Error("Headline must be 10-140 characters");
    if (card.length < 40 || card.length > 450) throw new Error("Card summary must be 40-450 characters");
    if (material && note.length < 10) throw new Error("A material change needs a public correction note");
    await sql.begin(async (tx) => {
      const [s] = await tx`select headline, card_summary, body, categories, region, status, media_url from stories where id = ${id} for update`;
      const [prev] = await tx`select claims from story_versions where story_id = ${id} and status = 'current'`;
      const body = { ...(s.body ?? {}), what_happened: str(fd, "what_happened"), why_it_matters: str(fd, "why_it_matters"), uncertain: str(fd, "uncertain") };
      await tx`update story_versions set status = 'superseded' where story_id = ${id} and status = 'current'`;
      const [{ v }] = await tx`select coalesce(max(version), 0) + 1 as v from story_versions where story_id = ${id}`;
      await tx`insert into story_versions (story_id, version, status, headline, card_summary, body, claims, reason, is_manual, created_by,
                                           media_url, media_type, media_source_name, media_source_url, media_alt_text, media_license)
        values (${id}, ${v}, 'current', ${headline}, ${card}, ${J(body)}, ${J(prev?.claims ?? [])},
                ${note || "manual edit"}, true, ${admin.email},
                ${mediaUrl}, ${mediaType}, ${mediaSourceName}, ${mediaSourceUrl}, ${mediaAltText}, ${mediaLicense})`;
      await tx`update stories set headline = ${headline}, card_summary = ${card}, body = ${J(body)},
        categories = ${tx.array(cats)}, region = ${region},
        media_url = ${mediaUrl}, media_type = ${mediaType}, media_source_name = ${mediaSourceName},
        media_source_url = ${mediaSourceUrl}, media_alt_text = ${mediaAltText}, media_license = ${mediaLicense},
        search_text = ${`${body.what_happened} ${body.why_it_matters}`} || ' ' || array_to_string(entities, ' ')
        where id = ${id}`;
      if (material && ["published", "updated"].includes(s.status)) {
        await tx`update stories set status = 'updated', last_material_update_at = now() where id = ${id}`;
      }
      if (note) await tx`insert into story_corrections (story_id, note, created_by) values (${id}, ${note}, ${admin.email})`;
      await audit(tx as unknown as DB, admin.email, "story.edited", "story", id,
        { headline: s.headline, card_summary: s.card_summary, body: s.body, media_url: s.media_url },
        { headline, card_summary: card, body, media_url: mediaUrl }, note || undefined);
    });
    return "Saved as a new version.";
  });
  back(`/admin/stories/${id}`, msg);
}

export async function applyProposal(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id"), versionId = str(fd, "version_id"), note = str(fd, "correction_note");
  const msg = await attempt(async () => {
    await sql.begin(async (tx) => {
      const [v] = await tx`select * from story_versions where id = ${versionId} and story_id = ${id} and status = 'proposed' for update`;
      if (!v) throw new Error("Proposal not found or already handled");
      const [s] = await tx`select status, headline, card_summary from stories where id = ${id} for update`;
      const live = ["published", "updated"].includes(s.status);
      if (live && note.length < 10) throw new Error("This story is live: add a public update note (10+ characters)");
      await tx`update story_versions set status = 'superseded' where story_id = ${id} and status = 'current'`;
      await tx`update story_versions set status = 'current', created_by = ${admin.email + ' (approved)'} where id = ${versionId}`;
      await tx`update stories set headline = ${v.headline}, card_summary = ${v.card_summary}, body = ${J(v.body)},
        search_text = ${`${v.body.what_happened ?? ""} ${v.body.why_it_matters ?? ""}`} || ' ' || array_to_string(entities, ' '),
        needs_attention = null where id = ${id}`;
      if (live) await tx`update stories set status = 'updated', last_material_update_at = now() where id = ${id}`;
      if (note) await tx`insert into story_corrections (story_id, note, created_by) values (${id}, ${note}, ${admin.email})`;
      await audit(tx as unknown as DB, admin.email, "story.revision_applied", "story", id,
        { headline: s.headline, card_summary: s.card_summary }, { headline: v.headline, card_summary: v.card_summary }, note || undefined);
    });
    return "Proposed revision applied.";
  });
  back(`/admin/stories/${id}`, msg);
}

export async function rejectProposal(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id"), versionId = str(fd, "version_id");
  const msg = await attempt(async () => {
    await sql.begin(async (tx) => {
      await tx`update story_versions set status = 'rejected' where id = ${versionId} and story_id = ${id} and status = 'proposed'`;
      await tx`update stories set needs_attention = null where id = ${id} and needs_attention = 'proposed_revision'
        and not exists (select 1 from story_versions where story_id = ${id} and status = 'proposed')`;
      await audit(tx as unknown as DB, admin.email, "story.revision_rejected", "story", id, undefined, { version_id: versionId });
    });
    return "Proposal rejected.";
  });
  back(`/admin/stories/${id}`, msg);
}

export async function dismissAttention(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id"), reason = str(fd, "reason");
  const msg = await attempt(async () => {
    if (reason.length < 5) throw new Error("Say why this flag can be dismissed");
    await sql.begin(async (tx) => {
      const [s] = await tx`update stories set needs_attention = null where id = ${id} returning id`;
      if (!s) throw new Error("Story not found");
      await audit(tx as unknown as DB, admin.email, "story.attention_dismissed", "story", id, undefined, undefined, reason);
    });
    return "Flag dismissed.";
  });
  back(`/admin/stories/${id}`, msg);
}

export async function requestRegeneration(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id");
  const msg = await attempt(async () => {
    await sql`insert into jobs (job_type, payload, idempotency_key, created_by)
      values ('regenerate_summary', ${J({ story_id: id })}, ${`manual-regen:${id}:${Date.now()}`}, ${admin.email})`;
    await audit(sql, admin.email, "job.queued", "story", id, undefined, { job: "regenerate_summary" });
    return "Queued. The worker picks it up on its next run (within about two hours). The result appears as a proposed revision.";
  });
  back(`/admin/stories/${id}`, msg);
}

export async function mergeStories(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const source = str(fd, "id"), targetRef = str(fd, "target");
  const msg = await attempt(async () => {
    await sql.begin(async (tx) => {
      const [t] = await tx`select id from stories where id::text = ${targetRef} or slug = ${targetRef}`;
      if (!t) throw new Error("Target story not found (use its id or slug)");
      if (t.id === source) throw new Error("Cannot merge a story into itself");
      await tx`update story_articles set story_id = ${t.id},
        role = case when role = 'primary' and exists (select 1 from story_articles x where x.story_id = ${t.id} and x.role = 'primary')
                    then 'independent' else role end
        where story_id = ${source}`;
      await tx`update stories t set first_reported_at = least(t.first_reported_at, s.first_reported_at),
        entity_keys = array(select distinct unnest(t.entity_keys || s.entity_keys)), needs_attention = 'new_info'
        from stories s where t.id = ${t.id} and s.id = ${source}`;
      await tx`update stories set merged_into = ${t.id}, status = 'withdrawn' where id = ${source}`;
      await tx`insert into jobs (job_type, payload, idempotency_key, created_by)
        values ('regenerate_summary', ${J({ story_id: t.id })}, ${`merge:${t.id}:${source}`}, ${admin.email}) on conflict do nothing`;
      await audit(tx as unknown as DB, admin.email, "story.merged", "story", source, undefined, { into: t.id });
    });
    return "Merged. A refreshed summary will be proposed by the worker.";
  });
  back(`/admin/stories/${source}`, msg);
}

export async function splitArticle(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id"), articleId = str(fd, "article_id");
  const msg = await attempt(async () => {
    let newId = "";
    await sql.begin(async (tx) => {
      const [{ n }] = await tx`select count(*)::int as n from story_articles where story_id = ${id}`;
      if (n < 2) throw new Error("A story needs at least one remaining source");
      const [a] = await tx`select a.title, a.excerpt, a.published_at, a.collected_at, s.is_primary
        from source_articles a join sources s on s.id = a.source_id
        join story_articles sa on sa.article_id = a.id where a.id = ${articleId} and sa.story_id = ${id}`;
      if (!a) throw new Error("Article is not part of this story");
      const [old] = await tx`select categories, region, story_type, entities, entity_keys from stories where id = ${id}`;
      const slug = `${a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}-${randomBytes(3).toString("hex")}`;
      const [ns] = await tx`insert into stories (slug, headline, card_summary, body, categories, region, story_type, is_limited,
          risk_flags, review_priority, entities, entity_keys, first_reported_at)
        values (${slug}, ${a.title.slice(0, 140)}, ${(a.excerpt || a.title).slice(0, 450)}, ${J({ limited: true })},
          ${tx.array(old.categories)}, ${old.region}, ${old.story_type}, true, ${tx.array(["split_pending_summary"])}, 10,
          ${tx.array(old.entities)}, ${tx.array(old.entity_keys)}, ${a.published_at ?? a.collected_at}) returning id`;
      newId = ns.id;
      await tx`update story_articles set story_id = ${newId}, role = ${a.is_primary ? "primary" : "independent"} where article_id = ${articleId}`;
      await tx`update stories set status = 'awaiting_review' where id = ${newId}`;
      for (const sid of [id, newId]) {
        await tx`insert into jobs (job_type, payload, idempotency_key, created_by)
          values ('regenerate_summary', ${J({ story_id: sid })}, ${`split:${sid}:${articleId}`}, ${admin.email}) on conflict do nothing`;
      }
      await audit(tx as unknown as DB, admin.email, "story.split", "story", id, undefined, { new_story: newId, article_id: articleId });
    });
    return `Split into a new story (${newId}). Review it before publishing.`;
  });
  back(`/admin/stories/${id}`, msg);
}

// ---------- sources ----------
export async function saveSource(fd: FormData) {
  const admin = await requireAdmin(["sources"]);
  const id = str(fd, "id");
  const msg = await attempt(async () => {
    const feed = new URL(str(fd, "feed_url"));
    if (feed.protocol !== "https:" && feed.protocol !== "http:") throw new Error("Feed URL must be http(s)");
    const v = {
      name: str(fd, "name"), domain: str(fd, "domain").toLowerCase(), source_type: str(fd, "source_type"),
      is_primary: fd.get("is_primary") === "on", region_hint: str(fd, "region_hint"), access_method: str(fd, "access_method"),
      feed_url: feed.toString(), terms_url: str(fd, "terms_url") || null, terms_notes: str(fd, "terms_notes") || null,
      terms_reviewed_at: str(fd, "terms_reviewed_at") || null, allow_fulltext: fd.get("allow_fulltext") === "on",
      poll_interval_minutes: Number(str(fd, "poll_interval_minutes")) || null,
    };
    if (!v.name || !v.domain) throw new Error("Name and domain are required");
    await sql.begin(async (tx) => {
      if (id) {
        await tx`update sources set name = ${v.name}, domain = ${v.domain}, source_type = ${v.source_type}, is_primary = ${v.is_primary},
          region_hint = ${v.region_hint}, access_method = ${v.access_method}, feed_url = ${v.feed_url}, terms_url = ${v.terms_url},
          terms_notes = ${v.terms_notes}, terms_reviewed_at = ${v.terms_reviewed_at}, allow_fulltext = ${v.allow_fulltext},
          poll_interval_minutes = ${v.poll_interval_minutes} where id = ${id}`;
      } else {
        await tx`insert into sources (name, domain, source_type, is_primary, region_hint, access_method, feed_url, terms_url,
          terms_notes, terms_reviewed_at, allow_fulltext, poll_interval_minutes, status)
          values (${v.name}, ${v.domain}, ${v.source_type}, ${v.is_primary}, ${v.region_hint}, ${v.access_method}, ${v.feed_url},
          ${v.terms_url}, ${v.terms_notes}, ${v.terms_reviewed_at}, ${v.allow_fulltext}, ${v.poll_interval_minutes}, 'paused')`;
      }
      await audit(tx as unknown as DB, admin.email, id ? "source.updated" : "source.created", "source", id || v.domain, undefined, v);
    });
    return id ? "Source updated." : "Source added (paused). Enable it after you have recorded the terms review.";
  });
  back("/admin/sources", msg);
}

export async function setSourceStatus(fd: FormData) {
  const admin = await requireAdmin(["sources"]);
  const id = str(fd, "id"), to = str(fd, "to");
  const msg = await attempt(async () => {
    if (!["active", "paused", "disabled"].includes(to)) throw new Error("Invalid status");
    await sql.begin(async (tx) => {
      const [s] = await tx`select status, paused_reason from sources where id = ${id} for update`;
      if (to === "active") await tx`update sources set status = 'active', failure_count = 0, paused_reason = null where id = ${id}`;
      else await tx`update sources set status = ${to} where id = ${id}`;
      await audit(tx as unknown as DB, admin.email, `source.${to}`, "source", id, { status: s.status, reason: s.paused_reason }, { status: to });
    });
    return `Source is now ${to}.`;
  });
  back("/admin/sources", msg);
}

// ---------- settings, jobs, items ----------
const BOOL_KEYS = ["publishing_paused", "collection_paused", "auto_publish_enabled"];
const NUM_LIMITS: Record<string, [number, number]> = {
  max_stories_per_day: [0, 60], llm_daily_call_budget: [0, 2000], freshness_hours: [6, 336],
  source_failure_threshold: [1, 10], review_queue_max: [1, 500], collection_interval_minutes: [30, 1440],
};

export async function updateSetting(fd: FormData) {
  const admin = await requireAdmin([]); // owner only
  const key = str(fd, "key"), raw = str(fd, "value");
  const msg = await attempt(async () => {
    let value: boolean | number;
    if (BOOL_KEYS.includes(key)) value = raw === "true";
    else if (NUM_LIMITS[key]) {
      value = Number(raw);
      const [lo, hi] = NUM_LIMITS[key];
      if (!Number.isInteger(value) || value < lo || value > hi) throw new Error(`${key} must be a whole number from ${lo} to ${hi}`);
    } else throw new Error("Unknown setting");
    await sql.begin(async (tx) => {
      const [b] = await tx`select value from settings where key = ${key}`;
      await tx`update settings set value = ${J(value)}, updated_at = now() where key = ${key}`;
      await audit(tx as unknown as DB, admin.email, "setting.changed", "setting", key, { value: b?.value }, { value });
    });
    return `${key} updated.`;
  });
  back("/admin/settings", msg);
}

export async function retryJob(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id");
  const msg = await attempt(async () => {
    await sql`update jobs set status = 'queued', attempts = 0, available_at = now(), error = null where id = ${id} and status = 'failed'`;
    await audit(sql, admin.email, "job.retried", "job", id);
    return "Job re-queued.";
  });
  back("/admin/jobs", msg);
}

export async function reopenArticle(fd: FormData) {
  const admin = await requireAdmin(["editor"]);
  const id = str(fd, "id"), reason = str(fd, "reason");
  const msg = await attempt(async () => {
    if (reason.length < 5) throw new Error("Give a reason (5+ characters)");
    await sql.begin(async (tx) => {
      const [a] = await tx`select state, reason from source_articles where id = ${id} for update`;
      // The database refuses to reopen security or malformed rejections, and quarantined items.
      await tx`update source_articles set state = 'discovered', reject_kind = null, reason = null, attempts = 0, analysis = null where id = ${id}`;
      await audit(tx as unknown as DB, admin.email, "article.reopened", "source_article", id, { state: a.state, reason: a.reason }, { state: "discovered" }, reason);
    });
    return "Item re-queued for processing at the next run.";
  });
  back("/admin/jobs", msg);
}