# SALFRA

**An AI-assisted news digest for global AI and technology, with dedicated coverage of Ghana and Africa.**

SALFRA collects stories from a hand-picked list of sources, groups reports about the same event, drafts short AI summaries, and publishes them only after a human has reviewed them. Every story links back to the original reporting.

[![CI](https://github.com/Yaotib/Salfra/actions/workflows/ci.yml/badge.svg)](https://github.com/Yaotib/Salfra/actions/workflows/ci.yml)

> **Status:** MVP in pilot. Every story is human-reviewed before publication. Auto-publish is built but **off** by default.

---

## Table of contents

- [Why SALFRA](#why-salfra)
- [Features](#features)
- [How it works](#how-it-works)
- [Editorial and safety guarantees](#editorial-and-safety-guarantees)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Command reference](#command-reference)
- [Testing and evaluation](#testing-and-evaluation)
- [Deployment](#deployment)
- [Operations](#operations)
- [Adding a source](#adding-a-source)
- [Free-tier constraints](#free-tier-constraints)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

---

## Why SALFRA

AI and technology news moves quickly, and African tech coverage is easy to miss in global feeds. SALFRA gives readers a fast, scannable digest that treats Ghana and Africa as first-class topics, while staying honest about what it is: an automated curator that points to original reporting, not a replacement for it.

## Features

**For readers**

- Latest stories, category pages (AI News, Global Tech, Product Releases, African Tech) and region pages (Ghana, Africa)
- Full-text search with filters for category, region, publisher and date
- Story pages with a visible AI-summary label, an evidence label, an uncertainty section, a sources list and a public corrections history
- RSS feed, sitemap and accessible, mobile-friendly pages

**For the editor**

- Review queue ordered by attention flags, risk and age
- Side-by-side evidence: linked sources, extracted claims and their supporting quotes
- Versioned edits, proposed AI revisions that never overwrite manual work, merge and split tools
- Source management with a mandatory terms-review record
- Audit log, job and item inspector, and an owner-only settings page with a publishing kill switch

**For operations**

- Scheduled collection, monitoring, retention, link checking and encrypted backups
- Heartbeat monitoring and alert emails
- Daily LLM call budget, provider-outage safety and database size guards

## How it works

```mermaid
flowchart LR
    subgraph Scheduler["GitHub Actions"]
        C[collect every 2h]
        M[monitor every 30m]
        H[maintenance daily]
    end
    subgraph Worker["Python worker"]
        I[Ingest feeds] --> P[Prefilter]
        P --> R[Relevance check]
        R --> G[Group same-event reports]
        G --> S[Summarise and validate]
    end
    C --> Worker
    Worker <--> DB[(Supabase Postgres)]
    M --> DB
    H --> DB
    LLM[Groq LLM API] <--> Worker
    DB <--> Web[Next.js site and admin on Vercel]
    Web --> Reader((Readers))
    Web --> Editor((Editor review))
    C -. heartbeat .-> HC[Healthchecks.io]
    M -. heartbeat .-> HC
```

The worker and the website never talk to each other directly. They share one database, and admin-triggered tasks (such as "regenerate summary") are passed to the worker through a `jobs` table.

**Pipeline per collected item**

1. **Ingest:** fetch each active feed (using ETag and Last-Modified), normalise URLs and skip duplicates.
2. **Freshness and prefilter:** drop stale items and obvious non-news before spending any LLM calls.
3. **Syndication check:** exact-title matches are linked as syndicated copies, not independent confirmation.
4. **Relevance:** the LLM decides whether the item is in scope and assigns categories and entities.
5. **Grouping:** a cheap similarity and entity-overlap shortlist, then a narrow LLM yes/no check per candidate.
6. **Summarise:** the LLM drafts a summary and the claims it rests on, using only retrieved source text.
7. **Validate:** software checks that quotes and numbers appear in the sources. Failures are held, not published.
8. **Review:** the story waits in the queue for a human decision.

## Editorial and safety guarantees

| Guarantee | How it is enforced |
|---|---|
| Nothing publishes without a source link | Database trigger |
| Publishing can be stopped instantly | Kill switch checked by a database trigger, so it holds even if application code is wrong |
| Summaries cannot invent quotes or numbers | Grounding validator rejects any quote not found verbatim in the source, any unsupported number, and any URL |
| Sources are only used with permission | A source cannot be activated without a recorded terms review date |
| Full text is fetched only when allowed | Per-source `allow_fulltext` flag, plus a robots.txt check that fails closed |
| Untrusted content cannot steer the model | Prompts wrap source text in nonce-delimited markers, and injection patterns are flagged for human review |
| Fetching cannot reach internal networks | SSRF guard re-validates every redirect hop |
| An LLM outage creates no half-finished stories | Processing stops, items stay queued, and the next run retries |
| Edits are never lost | Every edit creates a new version, and AI revisions arrive only as proposals |
| Every admin action is traceable | Audit events with before and after values |

AI summaries are marked as such on every page. Evidence labels describe the evidence available (for example, "Single-source report" or "Reports differ"), not an absolute verdict on truth.

## Tech stack

| Layer | Technology |
|---|---|
| Website and admin | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Data access | `postgres` (postgres.js) from server code, no public API layer |
| Database and auth | Supabase (PostgreSQL, Supabase Auth with TOTP MFA) |
| Worker | Python 3.12, `psycopg`, `httpx`, `feedparser`, `pydantic` |
| LLM | Any OpenAI-compatible API (currently Groq, `openai/gpt-oss-120b`) |
| Scheduling and CI | GitHub Actions |
| Hosting | Vercel (website) |
| Monitoring | Healthchecks.io heartbeats, SMTP alert emails |

## Repository structure

```
.
├── .github/workflows/     ci, collect, monitor, maintenance
├── db/migrations/         001_schema.sql, 002_link_checks.sql, ...
├── scripts/migrate.sh     applies and records migrations
├── worker/
│   ├── app/               ingest, prefilter, llm, grounding, grouping,
│   │                      summarize, processing, jobs, publish, pipeline,
│   │                      monitor, retention, linkcheck, main
│   ├── tests/             pytest suite (uses a fake LLM)
│   ├── requirements.txt
│   └── .env.example
├── eval/                  evaluation harness and labelled datasets
└── web/
    └── src/
        ├── app/           public pages, admin panel, feed, sitemap, robots
        ├── components/    StoryCard, Feed
        └── lib/           db, queries, auth, pages (info page content)
```

## Getting started

### Prerequisites

- Node.js 20 or later
- Python 3.12
- Docker (for a local PostgreSQL)
- Git Bash or WSL on Windows (for `scripts/migrate.sh`)

### 1. Clone

```bash
git clone https://github.com/Yaotib/Salfra.git
cd Salfra
```

### 2. Start a local database

Use a local Postgres for development so that you never test against production data.

```bash
docker run -d --name ainews-db -e POSTGRES_PASSWORD=dev -p 5433:5432 postgres:17
export DATABASE_URL=postgresql://postgres:dev@localhost:5433/postgres
bash scripts/migrate.sh
```

### 3. Run the worker

```bash
cd worker
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then fill in the values
set -a; source .env; set +a
python -m app.main collect --force
```

Without `LLM_*` variables the worker still ingests feeds and skips the AI steps.

### 4. Run the website and admin

```bash
cd web
npm ci
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>. The admin panel is at `/admin`.

### 5. Create the first administrator

1. Create a user in your Supabase project (Authentication, then Users). Turn off public sign-ups.
2. Register that user as owner:

```sql
insert into admins (user_id, email, role)
values ('<user uuid>', 'you@example.com', 'owner');
```

3. Sign in at `/admin/login`, then enrol an authenticator app at `/admin/mfa`.

## Configuration

### Worker (GitHub Actions secrets or `worker/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Use the Supabase **session pooler** (port 5432), because the worker holds an advisory lock |
| `USER_AGENT` | Yes | Identifies the bot to publishers. Include your site URL and a contact email |
| `LLM_BASE_URL` | For AI steps | For example `https://api.groq.com/openai/v1` (no trailing path) |
| `LLM_API_KEY` | For AI steps | Provider API key |
| `LLM_MODEL` | For AI steps | For example `openai/gpt-oss-120b` |
| `LLM_JSON_MODE` | No | `1` sends `response_format: json_object`. Set `0` if your provider rejects it |
| `LLM_MIN_INTERVAL_SECONDS` | No | Minimum gap between LLM calls, for rate limits |
| `MAX_ARTICLES_PER_RUN` | No | Cap on items processed per run |
| `HEARTBEAT_URL` / `MONITOR_HEARTBEAT_URL` / `BACKUP_HEARTBEAT_URL` | No | Healthchecks.io ping URLs |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` | No | Alert email delivery |
| `BACKUP_PASSPHRASE` | For backups | Encrypts database dumps. Store it in a password manager, because backups are unreadable without it |
| `ENV` | No | Set to `prod` in production |

### Website (Vercel environment variables or `web/.env.local`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | In production use the Supabase **transaction pooler** (port 6543). Never expose it as a `NEXT_PUBLIC_` variable |
| `DATABASE_SSL` | Set to `disable` for a local database only. Remove it in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for feeds, canonical links and the sitemap |
| `NEXT_PUBLIC_SITE_NAME` | Site name |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on the Contact, Corrections, Privacy and Terms pages |
| `REQUIRE_MFA` | Set to `1` to require TOTP for administrators |
| `ALLOW_INDEXING` | Set to `true` at launch. While unset, robots.txt blocks all crawlers and pages send noindex |

Never commit secrets. Add them in GitHub (Settings, Secrets and variables, Actions) and in your host's environment settings.

## Command reference

Run from the `worker` directory:

| Command | Purpose |
|---|---|
| `python -m app.main collect` | Ingest feeds, process pending items, run queued jobs |
| `python -m app.main collect --force` | Same, bypassing the interval guard |
| `python -m app.main monitor` | Health checks and alerts |
| `python -m app.main retention` | Delete expired data |
| `python -m app.main linkcheck` | Check source links on live stories |
| `python -m app.main usage` | Token usage per collected item and per story |

Database migrations, from the repository root: `bash scripts/migrate.sh`.

## Testing and evaluation

```bash
# worker tests (need a Postgres reachable through TEST_DATABASE_URL)
cd worker && python -m pytest -q

# website type check, lint and build
cd web && npx tsc --noEmit && npm run lint && npm run build

# model evaluation against labelled data
python eval/run_eval.py relevance --limit 100
python eval/run_eval.py grouping --limit 100
```

The test suite uses a fake LLM, so it is free and deterministic. It covers grouping, non-grouping, syndication, prompt-injection flagging, provider-outage safety, and rejection of ungrounded summaries. CI runs the worker tests and the website build on every push.

Auto-publish stays off until an evaluation set of at least 100 labelled items passes agreed thresholds and a pilot period completes without a fabricated claim.

## Deployment

**Database:** create a Supabase project and apply every file in `db/migrations/` in order. Migrations are **not** applied automatically in production, so apply each new migration by hand (or through `scripts/migrate.sh`) before the next scheduled worker run.

**Website:** import the repository into Vercel with the **root directory set to `web`**. Add the website environment variables above. The `worker` folder is not deployed to Vercel.

**Worker:** it runs on GitHub Actions. Add the worker secrets to the repository. The workflows are:

| Workflow | Schedule | Purpose |
|---|---|---|
| `ci` | On push and pull request | Worker tests and website build |
| `collect` | Every 2 hours | Ingest, process, run jobs |
| `monitor` | Every 30 minutes | Detect stuck runs, backlog, budget and size problems |
| `maintenance` | Daily at 03:30 UTC | Retention, link check, encrypted `pg_dump` backup |

GitHub scheduled runs are best-effort and can start late. That is why external heartbeats exist.

## Operations

- **Kill switch:** Admin, Settings, "pause ALL publishing". Enforced in the database.
- **Pause collection:** Admin, Settings.
- **Source failures:** three consecutive failures pause a source automatically. An access denial (HTTP 401 or 403) pauses it immediately. Resuming is a human decision.
- **Retention:** rejected, failed and held items are deleted after 45 days, quarantined items after 90, run records and succeeded jobs after 30, LLM usage after 60. Stories, versions and the audit log are kept.
- **Backups:** nightly, encrypted with GPG and kept as a 14-day workflow artifact. Test a restore before launch, and note that auth users are not included, so recreate the admin user and its `admins` row after a restore.
- **Database size:** the worker warns at 70 percent and pauses ingestion at 85 percent. At the Supabase free-tier limit the project becomes read-only, which would also block admin actions.

## Adding a source

1. Find the feed URL and open it in a browser to confirm it returns valid RSS or Atom.
2. Read the publisher's terms. Record the terms URL, the review date and notes on what is permitted.
3. In **Admin, Sources**, add the source. It starts **paused**.
4. Leave **Full-page fetching permitted** off unless the terms clearly allow it. Without it the source runs in limited-entry mode (headline, short excerpt and link).
5. Enable the source, run `collect` manually, and check the first results.

Prefer permission from small publishers: email them before enabling a source whose terms are silent on reuse.

## Free-tier constraints

The project is designed to run at zero cost, which shapes several defaults:

- **Supabase free tier:** 500 MB database, no backups, pauses after a period of inactivity, read-only at the limit.
- **LLM free tier:** limited requests and tokens per minute and per day, shared across the organisation. Pacing, a daily call budget and a per-run item cap keep usage inside the limits. Check your provider's console for current numbers.
- **GitHub Actions:** unlimited minutes on public repositories. A private repository has a monthly allowance that the schedules above may exceed.
- **Launch cap:** 15 published stories per day.

## Security

- Admin access is limited to users listed in the `admins` table, with roles (`owner`, `editor`, `sources`), TOTP MFA, and an authorisation check on every page and server action.
- Row Level Security is enabled on all tables with no public policies, so the Supabase REST API cannot read them.
- All external content is treated as untrusted: prompt-injection defences, SSRF protection and output validation apply throughout.
- Security headers are set in `next.config.ts`. Rate limiting in middleware is best-effort, so also configure limits at your host.

To report a vulnerability, email the contact address below instead of opening a public issue.

## Roadmap

- Source images with per-source permission, credit and human approval
- Evaluation set of 100+ labelled items, then a decision on auto-publish
- Dark mode
- Playwright end-to-end tests for the review loop
- Automatic migrations on deploy
- More Ghana and Africa sources

## Contributing

This is a portfolio project, but suggestions and bug reports are welcome.

1. Open an issue describing the problem or idea.
2. For code changes, branch from `main` and keep each pull request focused.
3. Run the worker tests and the website type check, lint and build before opening the PR.
4. Add a migration file for any schema change and mention it in the PR so it can be applied to production.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author. Add a `LICENSE` file (for example MIT or Apache-2.0) before inviting reuse.

## Disclaimer

SALFRA summaries are AI-generated and may contain errors. Always read the linked original sources. Articles, names and trademarks belong to their respective publishers, and inclusion of a source does not imply endorsement by it.

**Contact:** add your contact email here.