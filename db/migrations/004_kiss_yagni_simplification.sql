-- db/migrations/004_kiss_yagni_simplification.sql
-- Phase 2: KISS & YAGNI Simplifications
-- 1. Replace story_links join table with follow_up_to foreign key on stories
-- 2. Prune unused poll_interval_minutes column from sources
-- 3. Replace state transition lookup tables (story_transitions, article_transitions) with direct PL/pgSQL trigger checks

-- 1. Stories follow-up foreign key
alter table stories
  add column if not exists follow_up_to uuid references stories(id) on delete set null;

create index if not exists idx_stories_follow_up_to on stories(follow_up_to) where follow_up_to is not null;

-- Migrate existing follow-up links if any exist in story_links
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'story_links') then
    update stories s
    set follow_up_to = sl.to_story
    from story_links sl
    where sl.from_story = s.id and sl.link_type = 'follow_up';
  end if;
end $$;

drop table if exists story_links;

-- 2. Prune poll_interval_minutes from sources
alter table sources
  drop column if exists poll_interval_minutes;

-- 3. Inline state transition checks in trigger functions and drop lookup tables
create or replace function enforce_story_rules() returns trigger language plpgsql as $$
declare paused boolean;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('awaiting_review', 'withdrawn')) or
      (old.status = 'awaiting_review' and new.status in ('approved', 'published', 'draft', 'withdrawn')) or
      (old.status = 'approved' and new.status in ('published', 'awaiting_review', 'withdrawn')) or
      (old.status = 'published' and new.status in ('updated', 'awaiting_review', 'withdrawn')) or
      (old.status = 'updated' and new.status in ('awaiting_review', 'withdrawn')) or
      (old.status = 'withdrawn' and new.status in ('awaiting_review'))
    ) then
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

create or replace function enforce_article_rules() returns trigger language plpgsql as $$
begin
  if new.state is distinct from old.state then
    if not (
      (old.state = 'discovered' and new.state in ('rejected', 'held', 'quarantined', 'grouped', 'failed')) or
      (old.state = 'failed' and new.state in ('discovered', 'rejected')) or
      (old.state = 'held' and new.state in ('discovered', 'rejected')) or
      (old.state = 'rejected' and new.state = 'discovered')
    ) then
      raise exception 'Illegal article transition % -> %', old.state, new.state;
    end if;
    if old.state = 'rejected' and coalesce(old.reject_kind, '') <> 'editorial' then
      raise exception 'Only editorial rejections can be reopened';
    end if;
  end if;
  return new;
end $$;

drop table if exists story_transitions;
drop table if exists article_transitions;
