# P0.1 — Staging walkthrough Design §12.1

**Purpose:** Manual product checklist before paid M3 / Meta submit.
**Status template:** mark each row `PASS` / `FAIL` / `BLOCKED` with date + operator.
**SDD plan:** Wave R0 execution steps live in [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md).

## Preflight

- [x] **Local** Supabase project ≠ production — local `omni-commerce` @ `http://127.0.0.1:54321`; staging `tjsmpcgkeoglemptuymu` ≠ prod (no prod project). `2026-07-26` · `L3-task-2` (reconfirm)
- [x] Migrations applied — local `omni-commerce` (`supabase_migrations.schema_migrations`). See [p0-staging-migrate.md](./p0-staging-migrate.md). Prior: `2026-07-25` · `sdd-task-1`
- [x] **Local** URLs: web `http://127.0.0.1:3000` · api `http://127.0.0.1:3001` · ai `http://127.0.0.1:8000` · Inngest `http://127.0.0.1:8288` · Supabase API `http://127.0.0.1:54321` (auth `/auth/v1/health` 200). Env `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` → `127.0.0.1:54321`. `2026-07-26` · `L3-task-2`
- [ ] Test Meta App (dev) + Page + IG test account ready — **BLOCKED** (`META_*` placeholders; no test Page; localhost cannot receive Meta webhooks). `2026-07-26` · `L3-task-2`

**Stack health (local):** api `/health` 200 `{"status":"ok"}` · ai `/health` 200 `{"status":"ok"}` · web `/` 200 · Inngest Dev UI `:8288` 200 · Supabase Kong `:54321` up (auth health 200). Docker Supabase containers healthy (vector restarting only — non-blocking). `2026-07-26` · `L3-task-2`

## §12.1 Product (shop can…)

| # | Criterion | How to verify | Result |
|---|-----------|---------------|--------|
| 1 | Sign up + invite CSKH + kho | Signup → invite 2 roles → accept | **PASS** — `2026-07-26` · `L3-task-2`: Supabase signup owner+cskh+kho → `POST /v1/orgs` → create invites (raw `token` once) → list pending → `POST /v1/invites/accept` → memberships `cskh`,`kho`. |
| 2 | Connect Page + IG | Settings → Kết nối kênh → OAuth complete | **BLOCKED** — `META_*` placeholders; no test Page/IG; OAuth requires Meta dev app; localhost cannot receive Meta webhooks. `2026-07-26` · `L3-task-2` |
| 3 | Create products; knowledge updates | Catalog CRUD → wait reindex / check chunks | **PASS (eng stub)** — `2026-07-26` · `L3-task-2`: `POST /v1/catalog/products` → outbox `knowledge.reindex` published → Inngest → AI stub embed → org `knowledge_chunks` **> 0** (total local chunks ≥ 3). **Not** Gemini quality. If AI returns `502 GEMINI_API_KEY is required`, kill orphan uvicorn/spawn on `:8000` and restart AI with `APP_ENV=local` + `EMBEDDINGS_ALLOW_STUB=1` — see [local-host](./local-host.md). |
| 4 | Test DM; AI grounded | Send DM with known SKU/price; no invented SKUs | **BLOCKED** — requires Meta Page DM + public webhook; localhost not callable by Meta. `2026-07-26` · `L3-task-2` |
| 5 | Draft → approve → export | Confirm order; download CSV/XLSX | **PASS** — `2026-07-26` · `L3-task-2`: stock adjust → draft order → confirm → `status=confirmed`; `GET /v1/orders/export?format=csv` HTTP 200. |
| 6 | Takeover pause/resume | Inbox → Chiếm quyền; bot_epoch; reply as staff | **PASS (prior)** — API + E1 unit tests (`2026-07-25` · `sdd-task-e1`). `L3-task-2`: live inbox SKIP (no conversations in new smoke org); not re-blocked. |
| 7 | No cross-tenant data | Second org; confirm isolation (also `pnpm test:isolation`) | **PASS (prior)** — `pnpm test:isolation` 6 passed, 1 skipped (`2026-07-25`). `L3-task-2`: stack health reconfirm only (A4 may tighten skips later). |

## Sign-off

| Field | Value |
|-------|-------|
| Date | 2026-07-26 |
| Operator | L3-task-2 (A1 local walkthrough smoke post-L2) |
| Commit SHA | _(this commit on `cursor/l3-gate-a`)_ |
| Environment | **Local** stack (`docs/ops/local-host.md`); Docker Supabase + api/web/ai + Inngest on `127.0.0.1`; staging §12.1 repeat deferred until CPC claim / R0.3b |
| Blockers | Meta OAuth/DM (criteria 2, 4) — **BLOCKED OK** locally; staging always-on + owner `META_*` for full GREEN (CPC claim only). Chunks = eng stub (not Gemini quality) |

**Overall R0.3:** **AMBER** — local §12.1 non-Meta product path **PASS** (L3 Task 2); Meta **BLOCKED** (no public webhook). Not claiming R0.3 GREEN / CPC.
