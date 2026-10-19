-- db/migrations/001_schema.sql
create extension if not exists pg_trgm with schema public;

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('publishing_paused', 'false'), ('collection_paused', 'false'), ('auto_publish_enabled', 'false'),
  ('max_stories_per_day', '15'), ('collection_interval_minutes', '120'), ('freshness_hours', '72'),
  ('source_failure_threshold', '3'), ('llm_daily_call_budget', '150'), ('review_queue_max', '40'),
  ('db_limit_mb', '500');

create table admins (
  user_id uuid primary key,
  email text not null,
  role text not null default 'editor' check (role in ('owner','editor','sources')),
  created_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  source_type text not null check (source_type in ('lab_blog','company_blog','publisher','research','government','github','other')),
  is_primary boolean not null default false,
  region_hint text not null default 'global' check (region_hint in ('global','africa','ghana')),
  access_method text not null check (access_method in ('rss','atom','api')),
  feed_url text not null,
  terms_url text,
  terms_notes text,
  terms_reviewed_at date,
  allow_fulltext boolean not null default false,
  status text not null default 'paused' check (status in ('active','paused','disabled')),
  paused_reason text,
  failure_count int not null default 0,
  poll_interval_minutes int,
  last_polled_at timestamptz,
  last_success_at timestamptz,
  etag text,
  last_modified text,
  created_at timestamptz not null default now(),
  -- an unchecked terms record is not permission
  check (status <> 'active' or terms_reviewed_at is not null)
);

create table runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'schedule',
  status text not null default 'running' check (status in ('running','succeeded','partial','failed','skipped')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}'::jsonb,
  error text
);
create index runs_started_idx on runs (started_at desc);

create table source_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  run_id uuid references runs(id),
  canonical_url text not null unique,
  title text not null,
  title_norm text not null,
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  excerpt text,
  content_hash text not null,
  state text not null default 'discovered'
    check (state in ('discovered','rejected','held','quarantined','grouped','failed')),
  reject_kind text check (reject_kind in ('editorial','security','malformed','stale')),
  reason text,
  attempts int not null default 0,
  analysis jsonb,
  source_changed_at timestamptz
);
create index sa_state_idx on source_articles (state, published_at desc);
create index sa_hash_idx on source_articles (content_hash);
create index sa_source_idx on source_articles (source_id, collected_at desc);

create table stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  headline text not null,
  card_summary text not null default '',
  body jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  categories text[] not null default '{}',
  region text not null default 'global' check (region in ('global','africa','ghana')),
  story_type text not null default 'other',
  status text not null default 'draft'
    check (status in ('draft','awaiting_review','approved','published','updated','withdrawn')),
  is_limited boolean not null default false,
  evidence_label text not null default 'verification_incomplete'
    check (evidence_label in ('primary_source_available','multiple_publishers','independently_corroborated',
                              'single_source','reports_differ','verification_incomplete')),
  risk_flags text[] not null default '{}',
  review_priority int not null default 0,
  entities text[] not null default '{}',
  entity_keys text[] not null default '{}',
  featured boolean not null default false,
  first_reported_at timestamptz not null default now(),
  published_at timestamptz,
  last_material_update_at timestamptz,
  needs_attention text check (needs_attention in ('source_changed','correction_keyword','new_info','proposed_revision')),
  merged_into uuid references stories(id),
  withdrawn_reason text,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(headline, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(card_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(search_text, '')), 'C')
  ) stored
);
create index stories_feed_idx on stories (first_reported_at desc) where status in ('published','updated');
create index stories_queue_idx on stories (status, review_priority desc, created_at);
create index stories_search_gin on stories using gin (search);
create index stories_cat_gin on stories using gin (categories);
create index stories_entity_gin on stories using gin (entity_keys);
create index stories_headline_trgm on stories using gin (headline gin_trgm_ops);

create table story_articles (
  story_id uuid not null references stories(id) on delete cascade,
  article_id uuid not null unique references source_articles(id),
  role text not null check (role in ('primary','independent','additional')),
  is_syndicated boolean not null default false,
  added_at timestamptz not null default now(),
  primary key (story_id, article_id)
);
create index sta_story_idx on story_articles (story_id);

create table story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  version int not null,
  status text not null check (status in ('current','proposed','superseded','rejected')),
  headline text not null,
  card_summary text not null,
  body jsonb not null,
  claims jsonb not null default '[]'::jsonb,
  reason text not null,
  is_manual boolean not null default false,
  created_by text not null,
  model text,
  created_at timestamptz not null default now(),
  unique (story_id, version)
);
create unique index one_current_version on story_versions (story_id) where status = 'current';

create table story_corrections (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  note text not null,
  is_public boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table story_links (
  from_story uuid not null references stories(id) on delete cascade,
  to_story uuid not null references stories(id) on delete cascade,
  link_type text not null default 'follow_up',
  primary key (from_story, to_story, link_type),
  check (from_story <> to_story)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('regenerate_summary')),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  error text,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index jobs_queue_idx on jobs (status, available_at);

create table audit_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target_type text not null,
  target_id text,
  before jsonb,
  after jsonb,
  note text
);
create index audit_at_idx on audit_events (at desc);

create table llm_usage (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  task text not null,
  model text,
  prompt_tokens int,
  completion_tokens int,
  ok boolean not null default true
);
create index llm_usage_at_idx on llm_usage (at);

create table alert_log (
  key text primary key,
  last_sent_at timestamptz not null,
  suppressed int not null default 0
);

-- ---------- state machines, enforced by the database ----------
create table story_transitions (from_status text, to_status text, primary key (from_status, to_status));
insert into story_transitions values
  ('draft','awaiting_review'), ('draft','withdrawn'),
  ('awaiting_review','approved'), ('awaiting_review','published'), ('awaiting_review','draft'), ('awaiting_review','withdrawn'),
  ('approved','published'), ('approved','awaiting_review'), ('approved','withdrawn'),
  ('published','updated'), ('published','awaiting_review'), ('published','withdrawn'),
  ('updated','awaiting_review'), ('updated','withdrawn'),
  ('withdrawn','awaiting_review');

create table article_transitions (from_state text, to_state text, primary key (from_state, to_state));
insert into article_transitions values
  ('discovered','rejected'), ('discovered','held'), ('discovered','quarantined'),
  ('discovered','grouped'), ('discovered','failed'),
  ('failed','discovered'), ('failed','rejected'),
  ('held','discovered'), ('held','rejected'),
  ('rejected','discovered');

create or replace function enforce_story_rules() returns trigger language plpgsql as $$
declare paused boolean;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not exists (select 1 from story_transitions where from_status = old.status and to_status = new.status) then
      raise exception 'Illegal story transition % -> %', old.status, new.status;
    end if;
  end if;
  if new.status in ('published','updated') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    select coalesce((value #>> '{}')::boolean, false) into paused from settings where key = 'publishing_paused';
    if coalesce(paused, false) then
      raise exception 'Publishing is paused (kill switch is on)';
    end if;
    if not exists (select 1 from story_articles where story_id = new.id) then
      raise exception 'Cannot publish a story without a source link';
    end if;
    if coalesce(new.headline, '') = '' or coalesce(new.card_summary, '') = '' then
      raise exception 'Cannot publish a story without a headline and summary';
    end if;
  end if;
  new.modified_at := now();
  return new;
end $$;
create trigger story_rules before insert or update on stories
  for each row execute function enforce_story_rules();

create or replace function enforce_article_rules() returns trigger language plpgsql as $$
begin
  if new.state is distinct from old.state then
    if not exists (select 1 from article_transitions where from_state = old.state and to_state = new.state) then
      raise exception 'Illegal article transition % -> %', old.state, new.state;
    end if;
    if old.state = 'rejected' and coalesce(old.reject_kind, '') <> 'editorial' then
      raise exception 'Only editorial rejections can be reopened';
    end if;
  end if;
  return new;
end $$;
create trigger article_rules before update on source_articles
  for each row execute function enforce_article_rules();

-- ---------- no public access through Supabase's auto-generated API ----------
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;