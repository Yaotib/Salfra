-- db/migrations/003_featured_media.sql
-- Adds support for optional featured images and playable videos with source attribution

alter table source_articles
  add column media_url text,
  add column media_type text check (media_type in ('image', 'video')),
  add column media_source_name text,
  add column media_source_url text,
  add column media_alt_text text,
  add column media_license text;

alter table stories
  add column media_url text,
  add column media_type text check (media_type in ('image', 'video')),
  add column media_source_name text,
  add column media_source_url text,
  add column media_alt_text text,
  add column media_license text;

alter table story_versions
  add column media_url text,
  add column media_type text check (media_type in ('image', 'video')),
  add column media_source_name text,
  add column media_source_url text,
  add column media_alt_text text,
  add column media_license text;
