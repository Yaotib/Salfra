#!/usr/bin/env bash
# scripts/migrate.sh
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now()); alter table schema_migrations enable row level security;"
for f in db/migrations/*.sql; do
  name=$(basename "$f")
  if [ "$(psql "$DATABASE_URL" -tA -c "select 1 from schema_migrations where name='$name'")" = "1" ]; then continue; fi
  echo "Applying $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$f" -c "insert into schema_migrations (name) values ('$name')"
done
echo "Migrations up to date."