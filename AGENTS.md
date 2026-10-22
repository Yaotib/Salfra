# AGENTS.md — Agentic Operating Procedures & Repository Guidelines

**Platform:** Salfra AI News Curator  
**Repository Context:** Fork of Upstream  
- **Fork (Current Repo):** `cooking336-1/Salfra` (`origin`) — *Full Admin Permissions*
- **Upstream (Parent Repo):** `Yaotib/Salfra` (`upstream`) — *External Target for Upstream PRs*
- **Target Branch for Upstream PRs:** `Yaotib/Salfra:main`
- **Author Identity:** `@me` (`cooking336-1`)

This document governs the behavior, standards, workflows, and quality requirements for any autonomous AI coding agent working in this codebase.

---

## 1. Prime Directive: Study Documentation Before Any Work

Before writing any code, modifying schemas, or executing refactorings, **you must read the relevant documentation** in [`docs/`](file:///m:/CODES/Extra/Salfra/docs) to internalize the project's architecture, philosophy, and guardrails:

1. **[`docs/Project_brief.md`](file:///m:/CODES/Extra/Salfra/docs/Project_brief.md)**: Product scope, editorial principles, 2-hour collection targets, and non-commercial stance.
2. **[`docs/blueprint.md`](file:///m:/CODES/Extra/Salfra/docs/blueprint.md)**: Foundational architecture decisions, constraints, and data models.
3. **[`docs/high_level_overview.md`](file:///m:/CODES/Extra/Salfra/docs/high_level_overview.md)**: System topology, user personas, and executive architecture.
4. **[`docs/detailed_comprehensive_report.md`](file:///m:/CODES/Extra/Salfra/docs/detailed_comprehensive_report.md)**: Exhaustive component-by-component technical specifications and code paths.
5. **[`docs/system_improvements_and_audit.md`](file:///m:/CODES/Extra/Salfra/docs/system_improvements_and_audit.md)**: Known bug inventory, KISS/YAGNI analysis, and 4-phase prioritized implementation roadmap.
6. **[`docs/sources.md`](file:///m:/CODES/Extra/Salfra/docs/sources.md)**: External publisher terms of use, access policies, and source compliance register.

---

## 2. Forked Repository & Git Workflow

This is a **forked repository**. Agents must strictly adhere to the following branch, commit, and Pull Request (PR) lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GIT WORKFLOW LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Sync from upstream main -> Create dedicated feature branch               │
│ 2. Consult docs/ -> Implement changes conforming to KISS & YAGNI             │
│ 3. Run validation tests (pytest/compile, npm run lint, npm run build)        │
│ 4. Execute Diff Audit (verify no swallowed exceptions or silent errors)      │
│ 5. Commit with Conventional Commits format -> Push to fork (origin)         │
│ 6. Open PR targeting UPSTREAM main (Yaotib/Salfra:main) with detailed body   │
│ 7. Apply upstream-compatible labels & title category tags                   │
│ 8. Merge into fork main (origin/main) to unblock next phase immediately      │
│ 9. Upon upstream merge: Sync upstream main, delete local/remote topic branch │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Branching Strategy (Mandatory Before Implementation)
Never commit directly to `main`. Every unit of work (feature, fix, refactor, or chore) must begin on a clean, descriptive branch:

| Type | Branch Name Pattern | Example |
|---|---|---|
| New Feature | `feat/<short-descriptor>` | `feat/dark-mode-palette` |
| Bug Fix | `fix/<short-descriptor>` | `fix/config-dataclass-attribute` |
| KISS / YAGNI Refactor | `refactor/<short-descriptor>` | `refactor/prune-state-tables` |
| Chore / Maintenance | `chore/<short-descriptor>` | `chore/rename-eval-datasets` |
| Test Coverage | `test/<short-descriptor>` | `test/grounding-rounding-cases` |
| Documentation | `docs/<short-descriptor>` | `docs/update-agent-guidelines` |

#### Upstream Remote Configuration (One-Time Setup)
Verify that the `upstream` remote points to the parent repository:
```bash
git remote add upstream https://github.com/Yaotib/Salfra.git 2>/dev/null || true
git remote -v
```

#### Branch Creation & Sync Command
Always fetch upstream before creating a branch. If local `main` has progressed with previous phases, branch off local `main`; otherwise branch off `upstream/main`:
```bash
# 1. Fetch latest upstream state
git fetch upstream main

# 2. If starting fresh or syncing cleanly:
git checkout main
git pull upstream main --ff-only 2>/dev/null || echo "Local main has fork integration commits"

# 3. Create and switch to the new feature branch
git checkout -b <type>/<short-descriptor>
```

### 2.2 Conventional Commits Format
Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <concise description in present tense>

[optional body explaining motivation and context]

[optional footer(s)]
```
*Examples:*
- `fix(worker): correct dataclass attribute declaration for llm_reasoning_effort`
- `refactor(db): prune redundant story_transitions table in favor of trigger check`
- `feat(web): add dark mode design tokens and high-contrast editorial typography`

---

### 2.3 Upstream Pull Request Creation (Always Target `main`)
When the branch is implemented, tested, and audited:
1. Push the branch to the fork (`origin`):
   ```bash
   git push -u origin <branch-name>
   ```
2. Open the Pull Request targeting the **upstream repository (`Yaotib/Salfra:main`)**:
   - **Base branch**: Must **ALWAYS be `main`** (`--base main`).
   - **Head branch**: Must be `cooking336-1:<branch-name>`.
   - **Assignee rule**: **Do NOT pass `--assignee "@me"` to upstream**. Upstream repository permissions restrict assignees to direct collaborators (`Yaotib`). You are already permanently recorded as the PR `Author`.
   - **PR Body**: Must **ALWAYS contain a comprehensive markdown description** of what was implemented.

#### Mandatory PR Description Template
Every PR body must follow this structure:
```markdown
## Summary
Concise 2-3 sentence overview of what this PR introduces, fixes, or refactors.

## Motivation & Context
Why was this change needed? Which phase or roadmap item from docs/system_improvements_and_audit.md does it fulfill?

## Key Changes
- Bullet point list of specific files, functions, or schemas modified.
- Architectural rationale (explaining adherence to KISS and YAGNI).

## Anti-Silent-Error Audit
- [x] Verified no empty try/except or catch blocks.
- [x] Verified explicit error logging and propagation.
- [x] Verified no swallowed database return values or promises.

## Testing & Verification
- Test commands executed (e.g. python worker checks, npm run lint, npm run build).
- Results and outcomes.
```

#### GitHub CLI Command Example
Write the description to a scratch file, open the PR, and clean up the file immediately:
```bash
# Generate scratch description file
cat << 'EOF' > scratch_pr.md
## Summary
...
EOF

# Create the upstream PR (notice: no --assignee flag for upstream)
gh pr create \
  --repo Yaotib/Salfra \
  --base main \
  --head cooking336-1:<branch-name> \
  --title "<type>(<scope>): <concise summary> [<category-tag>]" \
  --body-file scratch_pr.md

# Clean up scratch description file immediately
rm scratch_pr.md
```

---

### 2.4 Intelligent Labeling & Permission Boundaries

#### ⚠️ Critical Upstream Permission Rule
- **NEVER run `gh label create ... --repo Yaotib/Salfra`**. Non-collaborators do not have permission to create labels on the parent repository (GitHub API returns `HTTP 403 / 404`).
- **Use Only Existing Upstream Labels**:
  - Bug fixes: `--label "bug"`
  - Features & enhancements: `--label "enhancement"`
  - Documentation: `--label "documentation"`
- **Category Tagging via PR Title**:
  For categories not present in upstream's label list (such as `kiss-yagni`, `refactor`, `ui/ux`, `security`, `performance`), append the category tag directly in brackets to the PR title:
  - `refactor(db): prune redundant state tables [kiss-yagni]`
  - `feat(web): introduce accessible dark mode tokens [ui/ux]`
  - `fix(worker): enforce ssrf ip block on redirect hops [security]`

#### Fork PRs (Optional Internal PRs)
When opening internal PRs inside your own fork (`--repo cooking336-1/Salfra`), you have full admin permissions:
- You may assign yourself: `--assignee "@me"`
- You may create any custom label: `gh label create kiss-yagni --repo cooking336-1/Salfra`

---

### 2.5 Multi-Phase Lifecycle & Branch Pruning (No Waiting on Upstream)

Upstream maintainers may take days or weeks to review and merge PRs. To ensure subsequent roadmap phases are never blocked:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTINUOUS MULTI-PHASE DEVELOPMENT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Phase 1 completed -> Push feature branch -> Open PR to Yaotib/Salfra:main│
│ 2. Merge Phase 1 feature branch into your fork's main (origin/main)         │
│ 3. Phase 2 can immediately branch off origin/main with Phase 1 fixes intact │
│ 4. When upstream eventually merges Phase 1:                                 │
│    git fetch upstream main && git branch -D fix/phase-1                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Execution:
1. **Merge completed phase into fork `main`**:
   ```bash
   git checkout main
   git merge <branch-name> --no-ff -m "chore: integrate <branch-name> into fork main"
   git push origin main
   ```
2. **Start next phase**:
   ```bash
   git checkout -b <next-phase-type>/<short-descriptor>
   ```
3. **Post-Upstream-Merge Cleanup**:
   Once upstream has merged the PR (typically via Squash and Merge):
   ```bash
   # Sync fork main with upstream main
   git fetch upstream main
   
   # Delete completed local branch (use -D because squashed commits have new SHAs)
   git branch -D <branch-name>

   # Delete remote feature branch on fork
   git push origin --delete <branch-name> 2>/dev/null || true
   ```

---

## 3. Mandatory Post-Implementation Diff Audit (Anti-Silent-Error Rule)

Before marking any PR or task complete, the agent **must perform a thorough diff review** (`git diff upstream/main...HEAD` or `git diff main...HEAD`) to audit the modified code.

### ⚠️ Strict Prohibition: No Swallowed Exceptions or Silent Failures
Silent errors undermine news curation integrity. Check every line for:

1. **Empty or Sweeping Exception Handlers**:
   - ❌ **Forbidden**:
     ```python
     try:
         do_something()
     except Exception:
         pass  # Swallowing errors silently!
     ```
   - ✅ **Required**:
     ```python
     try:
         do_something()
     except SpecificError as exc:
         logger.warning(f"Operation degraded: {exc}")
         # Or re-raise / record failure state
     ```
2. **Unhandled TypeScript / React Promise Catches**:
   - ❌ **Forbidden**:
     ```typescript
     try {
       await executeAction();
     } catch (e) {
       // empty or silent failure
     }
     ```
   - ✅ **Required**:
     ```typescript
     try {
       await executeAction();
     } catch (e) {
       console.error("Action failed:", e);
       throw new Error(`Failed to execute action: ${(e as Error).message}`);
     }
     ```
3. **Database Constraints & Return Values**:
   - Verify that all PostgreSQL queries checking state transitions properly handle `null` or 0 rows returned instead of failing silently downstream.
4. **Next.js 15 Async Request Objects & Headers**:
   - In Next.js 15, `params`, `searchParams`, `cookies()`, and `headers()` are all asynchronous Promises:
     ```typescript
     const { slug } = await params;
     const search = await searchParams;
     const cookieStore = await cookies();
     ```
   - Never access properties synchronously.

If any silent error or swallowed exception is detected, **fix it immediately in the branch** before declaring the task finished.

---

## 4. Architectural Rules: KISS & YAGNI

Every agent must defend system simplicity and resist accidental complexity:

### 4.1 KISS (Keep It Simple, Stupid)
- **Use PostgreSQL First**: Avoid introducing external infrastructure (e.g. Redis, Celery, Vector DBs, Elasticsearch). Salfra already utilizes PostgreSQL for transactional job queues (`FOR UPDATE SKIP LOCKED`), full-text search (`tsvector`), and trigram similarity (`pg_trgm`).
- **No Complex ORMs**: Python uses raw parameterized `psycopg 3` queries; Next.js uses parameterized `postgres.js` template literals. Keep queries explicit, readable, and typed.
- **Single Source of Truth**: Never duplicate logic across frontend and backend when a single database trigger or constraint can enforce it natively.
- **Incremental Database Migrations**:
  - Never destructively overwrite or edit past migrations (`001_schema.sql`, `002_link_checks.sql`).
  - All schema modifications, additions, or table pruning must be committed as new incremental numbered migrations in [`db/migrations/`](file:///m:/CODES/Extra/Salfra/db/migrations) (e.g., `003_<descriptor>.sql`).

### 4.2 YAGNI (You Aren't Gonna Need It)
- **No Speculative Abstractions**: Do not build configuration toggles or generic plugin architectures for things that are not currently required.
- **Prune Dead Code**: If code, variables, or table columns are unused (e.g. `searchText` in `actions.ts`, `poll_interval_minutes` in `sources`), remove them cleanly.
- **Replace Complex Protocols**: Where an external webhook (e.g. Discord/Slack) accomplishes an alert in 5 lines of code, do not maintain 50 lines of complex TLS SMTP machinery.

---

## 5. Security & Responsible AI Guardrails

1. **Prompt Injection Defense**:
   - All untrusted text from external feeds or extracted web pages must be enclosed inside dynamic boundary tokens.
   - **Always use the built-in helper** [`build_prompt()`](file:///m:/CODES/Extra/Salfra/worker/app/prompts.py#L45-L51) from [`worker/app/prompts.py`](file:///m:/CODES/Extra/Salfra/worker/app/prompts.py):
     ```python
     from app.prompts import build_prompt

     system_prompt, user_content = build_prompt(task=task_description, trusted=trusted_metadata, blocks={"article_1": raw_body})
     ```
   - Never feed raw external text directly into the LLM prompt without this boundary encapsulation.
2. **Network Security & SSRF Protection**:
   - Any external URL fetched by the worker must be resolved and checked against [`assert_public_url()`](file:///m:/CODES/Extra/Salfra/worker/app/urls.py#L39) on every redirect hop.
   - Private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS metadata `169.254.169.254`) must be rejected.
3. **Source Attribution & Grounding**:
   - The database trigger [`enforce_story_rules()`](file:///m:/CODES/Extra/Salfra/db/migrations/001_schema.sql#L234) must never be relaxed. A story cannot be published without at least one working source article link.
   - Summary claims must include verbatim quote snippets (15–240 characters) verified against the source text.
4. **Secret Hygiene**:
   - Never commit `.env`, `.env.local`, API keys, or private passwords. Use platform environment variables.

---

## 6. Pre-Submission Verification Checklist

Before creating a PR or completing a phase, run this verification checklist:

- [ ] **Documentation Reviewed**: Consulted relevant files in `docs/` before implementing.
- [ ] **Branch Created**: Work is on a descriptive branch (`feat/...`, `fix/...`, etc.), not `main`.
- [ ] **Python Worker Tested**:
  - If virtualenv/pytest is active: ran `pytest worker/tests/`.
  - Fallback check: verified module syntax via `python -m py_compile worker/app/*.py`.
- [ ] **Frontend Validated**:
  - Dependencies installed (`npm install` in `web/` if needed).
  - Lint and build pass (`npm run lint` and `npm run build` or `npx tsc --noEmit`).
- [ ] **Anti-Silent-Error Audit**: Verified no swallowed exceptions, empty catch blocks, or suppressed error states.
- [ ] **KISS & YAGNI Respected**: No premature abstractions or unused speculative code introduced; migrations are incremental (`db/migrations/00X_*.sql`).
- [ ] **PR Opened to Upstream**: Targeted `Yaotib/Salfra:main` (`--base main`) from `cooking336-1:<branch>`.
- [ ] **No Permission Conflicts**: Did NOT pass `--assignee` on upstream PR; used upstream labels (`bug`, `enhancement`, `documentation`) + title tags (`[kiss-yagni]`).
- [ ] **Comprehensive PR Body**: Followed the PR template with summary, motivation, changes, audit, and testing details.
- [ ] **Scratch Files Cleaned**: Deleted temporary PR markdown files (`rm scratch_pr.md`).
- [ ] **Fork Integration**: Merged phase into fork `main` (`origin/main`) to unblock subsequent roadmap phases.
