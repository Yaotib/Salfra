-- db/migrations/002_link_checks.sql
alter table source_articles
  add column link_status text check (link_status in ('ok','broken','blocked','error')),
  add column link_checked_at timestamptz;
create index sa_link_idx on source_articles (link_checked_at nulls first);