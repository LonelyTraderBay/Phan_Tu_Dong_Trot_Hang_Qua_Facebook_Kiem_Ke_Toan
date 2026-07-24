# Plan B DoD evidence

Date: 2026-07-24  
Worktree: `feat/plan-b-meta-channels`  
Status: **DONE** — automated gates green; Live Meta E2E (Page DM) not run (amber-acceptable).

## Environment note

- Local command shell reported Node `v24.5.0`; repo target is Node 20 (`.nvmrc`).
- No Meta App credentials or public tunnel available in this gate environment; Live Meta E2E deferred per Plan B DoD policy.

## Automated gate results

### `pnpm --filter @omni/api test`

Result: **PASS**

```text
Test Files  19 passed (19)
     Tests  58 passed (58)
Duration  864ms
```

Key Plan B specs: `token-crypto.spec.ts` (2), `signature.spec.ts` (6), `meta-webhook.service.spec.ts` (8), `meta-persist-inbound.spec.ts` (2), `channels.service.spec.ts` (4), `inbox.service.spec.ts` (2), guard specs for webhook skip paths.

### `pnpm --filter @omni/web test`

Result: **PASS**

```text
Test Files  1 passed (1)
     Tests  1 passed (1)
Duration  300ms
```

### `pnpm --filter @omni/web typecheck`

Result: **PASS** (`tsc --noEmit` — no errors).

### `pnpm test:isolation`

Result: **PASS**

```text
✓ cross-tenant.org.spec.ts (4 tests | 1 skipped) 177ms
✓ cross-tenant.channels.spec.ts (3 tests) 158ms
Test Files  2 passed (2)
     Tests  6 passed | 1 skipped (7)
Duration  973ms
```

## DoD summary

| Mục | Status | Evidence |
| --- | --- | --- |
| Migration + RLS | **GREEN** | `supabase/migrations/20260725090000_meta_inbox.sql`, `20260725093000_meta_webhook_atomic_enqueue.sql` — inbox schema + RLS SELECT-only for authenticated |
| Crypto tests | **GREEN** | `apps/api/src/common/crypto/token-crypto.spec.ts` — 2/2 pass in gate |
| OAuth encrypted | **GREEN** | `access_token_enc` column; `channels.service.spec.ts` — list API does not expose plaintext token |
| Webhook 200 + dedupe | **GREEN** | `meta-webhook.service.spec.ts` — 8/8 pass (signature, receipt dedupe, 200, no double-outbox) |
| Persist job | **GREEN** | `meta-persist-inbound.spec.ts` + `meta-persist-inbound.ts` — contacts/conversations/messages + `bot_epoch++` on takeover |
| Isolation | **GREEN** | `tests/isolation/cross-tenant.channels.spec.ts` — 3/3 pass |
| Web VI | **GREEN** | `apps/web/src/app/(app)/settings/channels/page.tsx` — Vietnamese connect UI; typecheck pass |
| Runbook + tunnel docs | **GREEN** | `docs/runbooks/meta-down.md`; `README.md` Meta webhook tunnel section |
| Live Meta E2E (Page DM) | **AMBER — NOT RUN** | No Meta App + tunnel in gate env; runbook documents manual steps |

## Wave D task coverage (author checklist)

| Wave D | Task | Status |
| --- | --- | --- |
| D1 OAuth | 4 | GREEN |
| D2 AES-GCM | 2 | GREEN |
| D3 Webhook | 5 | GREEN |
| D4 Persist | 6 | GREEN |
| D5 Idempotent | 5–6 | GREEN |
| D6 Runbook | 9 | GREEN |
| D7 Tunnel docs | 9 | GREEN |
| Isolation | 7 | GREEN |
| VI connect | 8 | GREEN |

## Out of scope (confirmed not in Plan B)

LLM/RAG, `ai_runs`, orders/export, full inbox poll UI, App Review package, carrier API — deferred to Plans C/D.
