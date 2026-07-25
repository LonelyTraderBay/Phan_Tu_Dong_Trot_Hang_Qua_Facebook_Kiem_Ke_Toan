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
| 3 | Create products; knowledge updates | Catalog CRUD → wait reindex / check chunks | **PASS (partial)** — `POST /v1/catalog/products` with variant OK; **FAIL** — `knowledge_chunks`=0; reindex/outbox not verified. `2026-07-25` · `sdd-task-1` |
| 4 | Test DM; AI grounded | Send DM with known SKU/price; no invented SKUs | **BLOCKED** — requires Meta Page DM + public webhook; localhost not callable by Meta. `2026-07-25` · `sdd-task-1` |
| 5 | Draft → approve → export | Confirm order; download CSV/XLSX | **FAIL** — draft `POST /v1/orders` OK; `GET /v1/orders/export?format=csv` 200 (285 B); `POST …/confirm` 500 `orders_failed`. `2026-07-25` · `sdd-task-1` |
| 6 | Takeover pause/resume | Inbox → Chiếm quyền; bot_epoch; reply as staff | **PASS (partial)** — `POST /v1/inbox/conversations/:id/takeover` → `botPaused=true`, `botEpoch=1` (pause only); **resume not verified**. `2026-07-25` · `sdd-task-1` |
| 7 | No cross-tenant data | Second org; confirm isolation (also `pnpm test:isolation`) | **PASS** — `pnpm test:isolation` @ `c2cf68e`: 6 passed, 1 skipped (parent worktree; worktree vitest `#module-evaluator` startup error). `2026-07-25` · `sdd-task-1` |

## Sign-off

| Field | Value |
|-------|-------|
| Date | 2026-07-25 |
| Operator | sdd-task-1 |
| Commit SHA | `c2cf68e` (local walkthrough R0.3a) |
| Environment | **Local** stack (`docs/ops/local-host.md`); staging §12.1 repeat pending R0.3b |
| Blockers | Meta OAuth/DM (criteria 2, 4); order confirm 500 (criterion 5); staging always-on + owner `META_*` for full GREEN |

**Overall R0.3:** **AMBER** — local §12.1 partially verified (1 PASS · 3 PASS partial · 1 FAIL · 2 BLOCKED; criterion 3 reindex leg FAIL). Not claiming R0.3 GREEN until staging + Meta owner actions.
