# P0.1 — Staging walkthrough Design §12.1

**Purpose:** Manual product checklist before paid M3 / Meta submit.  
**Status template:** mark each row `PASS` / `FAIL` / `BLOCKED` with date + operator.

## Preflight

- [ ] Staging Supabase project ≠ production  
- [ ] Migrations applied (see [p0-staging-migrate.md](./p0-staging-migrate.md))  
- [ ] Staging URLs: web `________________` · api `________________` · ai `________________`  
- [ ] Test Meta App (dev) + Page + IG test account ready  

## §12.1 Product (shop can…)

| # | Criterion | How to verify | Result |
|---|-----------|---------------|--------|
| 1 | Sign up + invite CSKH + kho | Signup → invite 2 roles → accept | |
| 2 | Connect Page + IG | Settings → Kết nối kênh → OAuth complete | |
| 3 | Create products; knowledge updates | Catalog CRUD → wait reindex / check chunks | |
| 4 | Test DM; AI grounded | Send DM with known SKU/price; no invented SKUs | |
| 5 | Draft → approve → export | Confirm order; download CSV/XLSX | |
| 6 | Takeover pause/resume | Inbox → Chiếm quyền; bot_epoch; reply as staff | |
| 7 | No cross-tenant data | Second org; confirm isolation (also `pnpm test:isolation`) | |

## Sign-off

| Field | Value |
|-------|-------|
| Date | 2026-07-25 |
| Operator | agent (blocked) |
| Staging commit SHA | `main` tip — live walkthrough not executed |
| Blockers | No staging URLs / Meta test credentials / always-on hosts in agent env |

**Code readiness (repo):** Surfaces for 1–7 exist through Plans D–H. Live §12.1 remains **AMBER** until owner runs checklist on staging.
