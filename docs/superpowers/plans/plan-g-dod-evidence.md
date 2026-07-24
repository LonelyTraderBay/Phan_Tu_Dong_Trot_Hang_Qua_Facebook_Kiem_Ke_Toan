# Plan G DoD Evidence — Phase 3 Intelligence

**Status:** DONE
**Branch:** `feat/plan-g-phase3`  
**Baseline:** Plan F DONE on `main` @ `674611a`  
**Rule:** No CPC claim in Plan G.

## Wave status

| Wave | Status | Evidence |
|------|--------|----------|
| 3A Ads spend | GREEN | `ad_spend` migration/RLS; API import/list/summary; P&L ad expense line; VI `/ads`; OpenAPI; 143 API tests pass |
| 3B Attribution | GREEN | `orders` attribution columns; draft-order DTO/RPC propagation; `GET /v1/attribution/summary`; VI `/attribution`; OpenAPI; API tests pass |
| 3C Owner Advisor | AMBER | AI `POST /internal/v1/ai/advise` stub; Core `POST /v1/advisor/suggest` proxy + `ai_runs`; VI `/advisor`; advise-only documented; live LLM/RAG not proven |
| 3D Content calendar | GREEN | `content_calendar_items` migration/RLS; CRUD `GET/POST/PATCH/DELETE /v1/content-calendar`; VI `/calendar`; auto-post flag stored only + audit note; API tests pass |
| 3E Public API | AMBER | `api_keys` + `outbound_webhooks` migration/RLS; owner-managed keys/webhooks; scoped `GET /public/v1/orders`; signed webhook test ping; docs; limited surface by design |
| 3F Hardening | GREEN | `docs/runbooks/phase3-intelligence.md`; `docs/public-api.md`; roadmap/path/changelog updated; final API tests pass |

## Verification log

- GREEN 3A: `pnpm --filter api test` — 40 files, 143 tests passed
- GREEN 3A: `pnpm --filter api lint` — passed
- GREEN 3A: `pnpm --filter web lint` — passed
- GREEN 3B/AMBER 3C: `pnpm --filter api test` — 42 files, 147 tests passed
- GREEN 3B/AMBER 3C: `PYTHONPATH=apps/ai pytest apps/ai/tests` — 25 tests passed, 2 warnings
- GREEN 3B/AMBER 3C: `python tests/eval/run_stub.py` — ok: adversarial=10, golden=6
- GREEN 3B/AMBER 3C: `pnpm --filter api lint; pnpm --filter web lint` — passed
- GREEN 3D/AMBER 3E/GREEN 3F: `pnpm --filter api test` — 44 files, 153 tests passed
- GREEN 3D/AMBER 3E/GREEN 3F: `pnpm --filter api lint; pnpm --filter web lint` — passed

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

## 3D endpoints

- `GET /v1/content-calendar?status=` — list org-scoped content calendar items
- `POST /v1/content-calendar` — create item; `autoPostEnabled` defaults false
- `PATCH /v1/content-calendar/:itemId` — update title/body/date/status/channel/flag
- `DELETE /v1/content-calendar/:itemId` — delete org-scoped item
- Web `/calendar` — Vietnamese UI for scheduling, status changes, and manual-post warning

## 3E endpoints

- `POST /v1/public-api/keys` — owner creates one-time `omni_` key; stores hash only
- `GET /v1/public-api/keys` — owner lists key metadata
- `POST /v1/public-api/keys/:keyId/revoke` — owner revokes key
- `GET /public/v1/orders?status=&limit=` — public read-only orders for `orders.read` API keys
- `POST /v1/public-api/webhooks` — owner creates encrypted-secret webhook config
- `GET /v1/public-api/webhooks` — owner lists webhook configs
- `PATCH /v1/public-api/webhooks/:webhookId` — owner updates enabled/events
- `POST /v1/public-api/webhooks/:webhookId/test` — signed HMAC `webhook.test` ping

## Notes

- Meta Ads direct sync remains future-ready; Wave 3A starts with CSV/JSON import and `meta_ads` source support.
- No CPC claim; Plan H remains required for CPC.
- Attribution stores minimal campaign fields on `orders`; no extra PII was added.
- Owner Advisor is advise-only: it never posts to Meta, never buys ads, and never mutates business tables directly. `/advisor` requires a human reviewer before action.
- 3C remains AMBER because the Plan G MVP uses `advisor-stub` aggregates; live LLM/RAG quality is not proven in this wave.
- Content calendar `autoPostEnabled` is a stored planning flag only. Plan G implements no Meta auto-post job/provider send; audit metadata records that limitation when the flag is true.
- Public API is AMBER because only read-only order listing, owner-managed keys, webhook config, and test pings are implemented. Full webhook event delivery and broader public resources remain future work.

## Verdict

Plan G Phase 3 Intelligence is **DONE with AMBER limits**:

- GREEN: ads/P&L import, attribution MVP, content calendar, hardening docs/tests.
- AMBER accepted: advisor quality is stub-based; public API surface is intentionally minimal.
- CPC is **not** claimed. Plan H is NEXT.
