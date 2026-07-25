# P0.1 — Staging walkthrough Design §12.1

**Purpose:** Manual product checklist before paid M3 / Meta submit.
**Status template:** mark each row `PASS` / `FAIL` / `BLOCKED` with date + operator.
**SDD plan:** Wave R0 execution steps live in [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md).

## Preflight

- [x] **Local** Supabase project ≠ production — local `omni-commerce` @ `http://127.0.0.1:54321`; staging `tjsmpcgkeoglemptuymu` ≠ prod (no prod project). `2026-07-25` · `sdd-task-1`
- [x] Migrations applied — 26 migrations on local `omni-commerce` (`supabase_migrations.schema_migrations`). See [p0-staging-migrate.md](./p0-staging-migrate.md). `2026-07-25` · `sdd-task-1`
- [x] **Local** URLs: web `http://127.0.0.1:3000` · api `http://127.0.0.1:3001` · ai `http://127.0.0.1:8000` (staging URLs unchanged — not exercised this run). `2026-07-25` · `sdd-task-1`
- [ ] Test Meta App (dev) + Page + IG test account ready — **BLOCKED** (`META_*` placeholders; no test Page). `2026-07-25` · `sdd-task-1`

**Stack health (local):** api `/health` 200 · ai `/health` 200 · web `/` 200 (`Omni Commerce`). `2026-07-25` · `sdd-task-1`

## §12.1 Product (shop can…)

| # | Criterion | How to verify | Result |
|---|-----------|---------------|--------|
| 1 | Sign up + invite CSKH + kho | Signup → invite 2 roles → accept | **PASS (partial)** — Supabase signup + `POST /v1/orgs` + invites `cskh`/`kho` created via API; invite **accept not verified**. `2026-07-25` · `sdd-task-1` |
| 2 | Connect Page + IG | Settings → Kết nối kênh → OAuth complete | **BLOCKED** — `META_*` placeholders; no test Page/IG; OAuth requires Meta dev app. `2026-07-25` · `sdd-task-1` |
| 3 | Create products; knowledge updates | Catalog CRUD → wait reindex / check chunks | **PASS (partial)** — `POST /v1/catalog/products` OK; outbox `knowledge.reindex` **published** with Inngest dev (`:8288`); **`knowledge_chunks`=0 BLOCKED** — AI `502 GEMINI_API_KEY is required for embeddings`. `2026-07-25` · `sdd-task-2` |
| 4 | Test DM; AI grounded | Send DM with known SKU/price; no invented SKUs | **BLOCKED** — requires Meta Page DM + public webhook; localhost not callable by Meta. `2026-07-25` · `sdd-task-1` |
| 5 | Draft → approve → export | Confirm order; download CSV/XLSX | **PASS** — org auto `MAIN` warehouse; draft + `POST …/confirm` 200 → `confirmed`; `variant_stocks` 5→4; `GET /v1/orders/export?format=csv` 200 (335 B). `2026-07-25` · `sdd-task-3` |
| 6 | Takeover pause/resume | Inbox → Chiếm quyền; bot_epoch; reply as staff | **PASS** — `POST /v1/inbox/conversations/:id/takeover` → `botPaused=true`, `botEpoch`++; `POST …/resume` → `botPaused=false`, `botEpoch`++ (E1 unit-tested; staff reply not manually verified). `2026-07-25` · `sdd-task-e1` |
| 7 | No cross-tenant data | Second org; confirm isolation (also `pnpm test:isolation`) | **PASS** — `pnpm test:isolation` @ `c2cf68e`: 6 passed, 1 skipped (parent worktree; worktree vitest `#module-evaluator` startup error). `2026-07-25` · `sdd-task-1` |

## Sign-off

| Field | Value |
|-------|-------|
| Date | 2026-07-25 |
| Operator | sdd-task-3 (criterion 5 re-verify) |
| Commit SHA | post-E0.3 docs commit on `feat/sdd-e0-r0-completion` |
| Environment | **Local** stack (`docs/ops/local-host.md`); staging §12.1 repeat pending R0.3b |
| Blockers | Meta OAuth/DM (criteria 2, 4); staging always-on + owner `META_*` for full GREEN |

**Overall R0.3:** **AMBER** — local §12.1 partially verified (3 PASS · 2 PASS partial · 2 BLOCKED; criterion 3 chunks leg BLOCKED on `GEMINI_API_KEY`). Not claiming R0.3 GREEN until staging + Meta owner actions.
