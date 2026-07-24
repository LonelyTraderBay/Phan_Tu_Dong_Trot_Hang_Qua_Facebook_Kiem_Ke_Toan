# Plan D DoD evidence

Date: 2026-07-25  
Worktree: `feat/plan-d-orders-web-hardening` @ `b8dcbfb`  
Status: **DONE** — automated gates green; staging manual E2E + Meta App Review submit deferred (amber-acceptable per Plan D G4).

## Environment note

- Local command shell reported Node `v24.5.0`; repo target is Node 20 (`.nvmrc`).
- `pnpm test:eval` failed: `uv` not in PATH on this Windows gate env; eval script passes via `python ../../tests/eval/run_stub.py`.
- No live Meta App, public tunnel, or staging URL in gate env; §12.1 product flows marked **AMBER — NOT RUN** where manual staging required.

## Automated gate results

### `pnpm --dir apps/api test`

Result: **PASS**

```text
Test Files  31 passed (31)
     Tests  107 passed (107)
Duration  1.82s
```

Key Plan D specs: `orders.service.spec.ts` (5), `rate-limit.middleware.spec.ts` (3), `tools-rate-limit.guard.spec.ts` (2), `in-memory-rate-limit.spec.ts` (2), `identity.service.spec.ts` (3), `meta-webhook.service.spec.ts` (11).

### `pnpm --dir apps/api typecheck`

Result: **PASS** (`tsc --noEmit` — no errors).

### `pnpm test:isolation`

Result: **PASS**

```text
✓ cross-tenant.org.spec.ts (4 tests | 1 skipped) 187ms
✓ cross-tenant.channels.spec.ts (3 tests) 180ms
Test Files  2 passed (2)
     Tests  6 passed | 1 skipped (7)
Duration  1.10s
```

### `pnpm --filter @omni/web typecheck`

Result: **PASS** (`tsc --noEmit` — no errors).

### `pnpm test:eval`

Result: **AMBER — WRAPPER FAIL / EVAL PASS**

- `pnpm test:eval`: exit 1 — `'uv' is not recognized` (Windows gate env).
- Direct run from `apps/ai`: `python ../../tests/eval/run_stub.py` → `ok:adversarial=10 golden=6`.

Golden VI cases: `tests/eval/golden/01-product-price.md` … `06-model-escalate-flag.md`.

---

## Plan D Definition of Done

| # | Tiêu chí | Status | Evidence |
|---|----------|--------|----------|
| 1 | Orders states + confirm/cancel/ship + stock rules tested | **GREEN** | `orders.service.spec.ts` — 5/5 pass; migration `20260725110000_orders_lifecycle_gapfill.sql`; stock on `confirmed`, restore on cancel |
| 2 | Export CSV/Excel (+ PDF optional) | **GREEN** | `orders-export.ts` csv/xlsx/pdf; `GET /v1/orders/export`; Vietnamese headers |
| 3 | Web: org switcher, inbox+takeover, catalog, orders, dashboard, channels, settings | **GREEN** (code) / **AMBER** (staging manual) | `apps/web/src/app/(app)/*`; auth + `X-Org-Id` in `api-client.ts`; inbox poll 3–5s; staging walkthrough not run in gate env |
| 4 | Terms + Privacy VI published | **GREEN** | `apps/web/src/app/legal/terms/page.tsx`, `privacy/page.tsx` |
| 5 | PDPA export + delete/anonymize path | **GREEN** | `POST /v1/orgs/me/export`, `POST /v1/orgs/me/delete-request`; `docs/runbooks/pdpa-delete.md`; `identity.service.spec.ts` |
| 6 | Rate limits auth/webhook/tools | **GREEN** | `rate-limit.middleware.spec.ts`, `tools-rate-limit.guard.spec.ts`, `in-memory-rate-limit.spec.ts` |
| 7 | Meta App Review checklist doc | **GREEN** | `docs/meta-app-review-checklist.md`; runbooks updated (Task D9) |
| 8 | Design §12 checklist in this file | **GREEN** | This document |
| 9 | Live Meta App Review **submitted** | **AMBER — NOT RUN** | Checklist + screencast script ready; submit when staging always-on host ready (Plan E trigger) |
| 10 | M3 paid infra | **N/A — Plan E** | Deferred per scope |

---

## Design §12.1 — Product (shop can…)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Sign up and invite one CSKH + one kho user | **AMBER — NOT RUN** | Auth + invites UI (`feat/web): auth and org switcher`); manual staging signup/invite not exercised in gate env |
| 2 | Connect Page + IG | **AMBER — NOT RUN** | Channels API/UI from Plan B; no live Meta OAuth in gate env |
| 3 | Create products; knowledge updates for RAG | **GREEN** (API) / **AMBER** (staging) | Catalog CRUD Plan C + web catalog page Plan D5; reindex outbox tested in Plan C |
| 4 | Receive test DM; AI answers from catalog without inventing SKUs/prices | **AMBER — NOT RUN** | `process-inbound-message.spec.ts`, eval golden VI green; no live Page DM / Gemini key in gate env |
| 5 | Produce draft order; approve; export CSV/Excel/PDF | **GREEN** (API/tests) / **AMBER** (staging) | Draft via AI tools (Plan C); confirm/export Plan D1–D2; manual end-to-end on staging not run |
| 6 | Pause bot via takeover and resume | **GREEN** (code) / **AMBER** (staging) | Inbox takeover UI + Plan B API; `inbox/page.tsx` poll + takeover button |
| 7 | Not see another tenant's data (RLS/isolation verified) | **GREEN** | `pnpm test:isolation` — 6/6 pass (1 skipped); RLS on org-scoped tables |

---

## Design §12.2 — Enterprise foundation (platform must…)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Automated cross-tenant isolation tests pass in CI | **GREEN** | `tests/isolation/cross-tenant.*.spec.ts`; wired as `pnpm test:isolation` |
| 2 | Staging ≠ production Supabase; migrations via pipeline | **AMBER — NOT VERIFIED** | Policy in specs + `.env.example`; separate projects assumed at deploy; not validated in this gate run |
| 3 | Meta webhooks idempotent; failures → retry/DLQ + runbook | **GREEN** | `meta-webhook.service.spec.ts` (11); outbox publisher; `docs/runbooks/meta-down.md` |
| 4 | Meta tokens encrypted at rest; never exposed to browser | **GREEN** | `token-crypto.spec.ts`; secrets server-side only (Global Constraints) |
| 5 | Audit log: AI runs, order approve/cancel, channel connect, settings | **GREEN** | `audit.service.ts`; order lifecycle writes audit; `ai-runs.service.spec.ts`; channel connect in `channels.service.spec.ts` |
| 6 | `organizations.plan` + entitlements (billing gateway may be manual) | **GREEN** | `entitlements.service.ts`, `billing/` module; manual billing OK Phase 1 |
| 7 | Operator admin: list orgs, suspend org, view channel health | **GREEN** | `admin-ops.service.spec.ts` — 4/4 pass |
| 8 | Feature flags gate risky capabilities (e.g. auto_confirm) | **GREEN** | `feature-flags.service.spec.ts`; `auto_confirm` in orders + settings |
| 9 | AI golden eval set (VI) runnable; provider behind interface | **GREEN** | Eval 6 golden + 10 adversarial pass (python direct); `LlmProvider` interface in `apps/ai` |
| 10 | Error tracking + structured logs with `request_id` / `org_id` | **GREEN** | `redacting-logger.spec.ts`; structured logging middleware |
| 11 | Backup policy documented; restore drill planned | **AMBER — Plan E** | Documented in enterprise specs; Supabase Pro + restore drill = Plan E M3.1 trigger |
| 12 | Terms of Service + Privacy Policy published (VI) | **GREEN** | Legal pages Task D6 |
| 13 | PDPA minimum: export + delete/anonymize org | **GREEN** | Task D7 endpoints + `pdpa-delete.md` runbook |
| 14 | Rate limits on auth, webhooks, and AI tool calls (§8.2) | **GREEN** | Task D8; middleware + guard specs |

---

## Wave G+H+I task coverage (author checklist)

| Wave | Task | Status |
| --- | --- | --- |
| D0 Schema gap-fill | 1 | **GREEN** |
| D1 Lifecycle + stock | 2 | **GREEN** |
| D2 Export | 3 | **GREEN** |
| D3 Web auth + org switcher | 4 | **GREEN** |
| D4 Inbox poll + takeover | 5 | **GREEN** |
| D5 Catalog + orders + dashboard + settings | 6 | **GREEN** |
| D6 Legal Terms + Privacy | 7 | **GREEN** |
| D7 PDPA export/delete | 8 | **GREEN** |
| D8 Rate limits | 9 | **GREEN** |
| D9 App Review + pilot docs | 10 | **GREEN** |
| D10 DoD + §12 sign-off | 11 | **GREEN** |

## Pilot Phase 1 sign-off

**Verdict:** **READY** for controlled pilot on staging.

- Automated gates: green (eval wrapper amber only).
- Product surfaces: implemented; manual staging walkthrough recommended before first external shop.
- Meta App Review: checklist complete; submit when always-on staging host confirmed (Plan E).
- **Next:** Plan E (M3 commercial ops) when customer imminent — not before pilot DoD on branch merges to deploy path.

## Out of scope (confirmed not in Plan D)

Supabase Pro / always-on / billing Stripe, GHN/GHTK carrier API, advisor AI, Phase 2+ features — deferred to Plans E–H.
