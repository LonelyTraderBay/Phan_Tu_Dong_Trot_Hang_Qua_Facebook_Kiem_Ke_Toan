# Plan G DoD Evidence — Phase 3 Intelligence

**Status:** IN PROGRESS  
**Branch:** `feat/plan-g-phase3`  
**Baseline:** Plan F DONE on `main` @ `674611a`  
**Rule:** No CPC claim in Plan G.

## Wave status

| Wave | Status | Evidence |
|------|--------|----------|
| 3A Ads spend | GREEN | `ad_spend` migration/RLS; API import/list/summary; P&L ad expense line; VI `/ads`; OpenAPI; 143 API tests pass |
| 3B Attribution | PENDING | Not started |
| 3C Owner Advisor | PENDING | Not started |
| 3D Content calendar | PENDING | Not started |
| 3E Public API | PENDING | Not started |
| 3F Hardening | PENDING | Not started |

## Verification log

- GREEN 3A: `pnpm --filter api test` — 40 files, 143 tests passed
- GREEN 3A: `pnpm --filter api lint` — passed
- GREEN 3A: `pnpm --filter web lint` — passed

## 3A endpoints

- `POST /v1/ad-spend/import` — import CSV text or JSON rows
- `GET /v1/ad-spend` — list ad spend rows by date range
- `GET /v1/ad-spend/summary` — daily totals
- `GET /v1/pnl/summary` — now includes `adSpendVnd` and `netProfitVnd`

## Notes

- Meta Ads direct sync remains future-ready; Wave 3A starts with CSV/JSON import and `meta_ads` source support.
- No CPC claim; Plan H remains required for CPC.
