# P0.1 — Staging walkthrough Design §12.1

**Purpose:** Manual product checklist before paid M3 / Meta submit.
**Status template:** mark each row `PASS` / `FAIL` / `BLOCKED` with date + operator.
**SDD plan:** Wave R0 execution steps live in [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md).

## Preflight

- [x] **Local** Supabase project ≠ production — local `omni-commerce` @ `http://127.0.0.1:54321`; staging `tjsmpcgkeoglemptuymu` ≠ prod (no prod project). `2026-07-26` · `L1-task-2` (reconfirm)
- [x] Migrations applied — local `omni-commerce` (`supabase_migrations.schema_migrations`). See [p0-staging-migrate.md](./p0-staging-migrate.md). Prior: `2026-07-25` · `sdd-task-1`
- [x] **Local** URLs: web `http://127.0.0.1:3000` · api `http://127.0.0.1:3001` · ai `http://127.0.0.1:8000` · Supabase API `http://127.0.0.1:54321` (auth `/auth/v1/health` 200). Env `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` → `127.0.0.1:54321`. `2026-07-26` · `L1-task-2`
- [ ] Test Meta App (dev) + Page + IG test account ready — **BLOCKED** (`META_*` placeholders; no test Page; localhost cannot receive Meta webhooks). `2026-07-26` · `L1-task-2`

**Stack health (local):** api `/health` 200 `{"status":"ok"}` · ai `/health` 200 `{"status":"ok"}` · web `/` 200 (`Omni Commerce`) · Supabase Kong `:54321` up (auth health 200). Docker Supabase containers healthy (vector restarting only — non-blocking). `2026-07-26` · `L1-task-2`

## §12.1 Product (shop can…)

| # | Criterion | How to verify | Result |
|---|-----------|---------------|--------|
| 1 | Sign up + invite CSKH + kho | Signup → invite 2 roles → accept | **PASS (partial)** — Prior: Supabase signup + `POST /v1/orgs` + invites `cskh`/`kho` via API; invite **accept not verified**. `2026-07-25` · `sdd-task-1`. **L1-task-2:** stack health reconfirm only (no re-run). `2026-07-26` |
| 2 | Connect Page + IG | Settings → Kết nối kênh → OAuth complete | **BLOCKED** — `META_*` placeholders; no test Page/IG; OAuth requires Meta dev app; localhost cannot receive Meta webhooks. `2026-07-26` · `L1-task-2` |
| 3 | Create products; knowledge updates | Catalog CRUD → wait reindex / check chunks | **PASS (partial)** — Prior: `POST /v1/catalog/products` OK; outbox `knowledge.reindex` published with Inngest; **`knowledge_chunks`=0** until GEMINI or L1 stub embeddings (Task 3). `2026-07-25` · `sdd-task-2`. **L1-task-2:** health reconfirm; chunks leg still open. `2026-07-26` |
| 4 | Test DM; AI grounded | Send DM with known SKU/price; no invented SKUs | **BLOCKED** — requires Meta Page DM + public webhook; localhost not callable by Meta. `2026-07-26` · `L1-task-2` |
| 5 | Draft → approve → export | Confirm order; download CSV/XLSX | **PASS** — Prior: org auto `MAIN` warehouse; draft + confirm → `confirmed`; export CSV 200. `2026-07-25` · `sdd-task-3`. **L1-task-2:** stack health reconfirm only. `2026-07-26` |
| 6 | Takeover pause/resume | Inbox → Chiếm quyền; bot_epoch; reply as staff | **PASS** — Prior: takeover/resume API + E1 unit tests. `2026-07-25` · `sdd-task-e1`. **L1-task-2:** stack health reconfirm only. `2026-07-26` |
| 7 | No cross-tenant data | Second org; confirm isolation (also `pnpm test:isolation`) | **PASS** — Prior: `pnpm test:isolation` 6 passed, 1 skipped. `2026-07-25` · `sdd-task-1`. **L1-task-2:** stack health reconfirm only. `2026-07-26` |

## Sign-off

| Field | Value |
|-------|-------|
| Date | 2026-07-26 |
| Operator | L1-task-2 (local stack verify + non-Meta refresh) |
| Commit SHA | `0044785` on `cursor/l1-local-first` (L1 Task 2 verify) |
| Environment | **Local** stack (`docs/ops/local-host.md`); Docker Supabase + api/web/ai on `127.0.0.1`; staging §12.1 repeat deferred until CPC claim / R0.3b |
| Blockers | Meta OAuth/DM (criteria 2, 4) — **BLOCKED OK** locally; `knowledge_chunks` until L1 Task 3 / GEMINI; staging always-on + owner `META_*` for full GREEN (CPC claim only) |

**Overall R0.3:** **AMBER** — local §12.1 stack health **PASS** (L1 Task 2); non-Meta product rows carry prior PASS/partial; Meta **BLOCKED** (no public webhook). Not claiming R0.3 GREEN / CPC.
