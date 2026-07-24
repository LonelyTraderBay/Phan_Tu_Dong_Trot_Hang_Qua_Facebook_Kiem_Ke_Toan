# Plan G DoD Evidence — Phase 3 Intelligence

**Status:** IN PROGRESS  
**Branch:** `feat/plan-g-phase3`  
**Baseline:** Plan F DONE on `main` @ `674611a`  
**Rule:** No CPC claim in Plan G.

## Wave status

| Wave | Status | Evidence |
|------|--------|----------|
| 3A Ads spend | GREEN | `ad_spend` migration/RLS; API import/list/summary; P&L ad expense line; VI `/ads`; OpenAPI; 143 API tests pass |
| 3B Attribution | GREEN | `orders` attribution columns; draft-order DTO/RPC propagation; `GET /v1/attribution/summary`; VI `/attribution`; OpenAPI; API tests pass |
| 3C Owner Advisor | AMBER | AI `POST /internal/v1/ai/advise` stub; Core `POST /v1/advisor/suggest` proxy + `ai_runs`; VI `/advisor`; advise-only documented; live LLM/RAG not proven |
| 3D Content calendar | PENDING | Not started |
| 3E Public API | PENDING | Not started |
| 3F Hardening | PENDING | Not started |

## Verification log

- GREEN 3A: `pnpm --filter api test` — 40 files, 143 tests passed
- GREEN 3A: `pnpm --filter api lint` — passed
- GREEN 3A: `pnpm --filter web lint` — passed
- GREEN 3B/AMBER 3C: `pnpm --filter api test` — 42 files, 147 tests passed
- GREEN 3B/AMBER 3C: `PYTHONPATH=apps/ai pytest apps/ai/tests` — 25 tests passed, 2 warnings
- GREEN 3B/AMBER 3C: `python tests/eval/run_stub.py` — ok: adversarial=10, golden=6
- GREEN 3B/AMBER 3C: `pnpm --filter api lint; pnpm --filter web lint` — passed

## 3A endpoints

- `POST /v1/ad-spend/import` — import CSV text or JSON rows
- `GET /v1/ad-spend` — list ad spend rows by date range
- `GET /v1/ad-spend/summary` — daily totals
- `GET /v1/pnl/summary` — now includes `adSpendVnd` and `netProfitVnd`

## 3B endpoints

- `GET /v1/attribution/summary?from=&to=` — counts and order-value revenue by `utm_source`
- `POST /v1/orders` — accepts optional `utmSource`, `utmMedium`, `utmCampaign`, `clickId`
- `POST /internal/v1/tools/create-draft-order` — accepts optional attribution fields for Core-owned AI draft creation

## 3C endpoints

- `POST /internal/v1/ai/advise` — AI service internal stub, service-key protected
- `POST /v1/advisor/suggest` — Core auth/org proxy, checks `kill_ai_all`, writes `ai_runs`, returns suggestions only

## Notes

- Meta Ads direct sync remains future-ready; Wave 3A starts with CSV/JSON import and `meta_ads` source support.
- No CPC claim; Plan H remains required for CPC.
- Attribution stores minimal campaign fields on `orders`; no extra PII was added.
- Owner Advisor is advise-only: it never posts to Meta, never buys ads, and never mutates business tables directly. `/advisor` requires a human reviewer before action.
- 3C remains AMBER because the Plan G MVP uses `advisor-stub` aggregates; live LLM/RAG quality is not proven in this wave.
