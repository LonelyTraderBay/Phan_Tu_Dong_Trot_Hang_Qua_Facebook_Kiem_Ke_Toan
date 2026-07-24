# Plan C DoD evidence

Date: 2026-07-24  
Worktree: `feat/plan-c-catalog-ai` @ `7ee2c54`  
Status: **DONE** — automated gates green; Live Gemini/Page DM E2E not run (amber-acceptable).

## Environment note

- Local command shell reported Node `v24.5.0`; repo target is Node 20 (`.nvmrc`).
- No `GEMINI_API_KEY`, Meta App credentials, or public tunnel in gate env; Live Gemini E2E + Page DM deferred per Plan C DoD policy.

## Automated gate results

### `pnpm --dir apps/api test`

Result: **PASS**

```text
Test Files  27 passed (27)
     Tests  92 passed (92)
Duration  1.33s
```

Key Plan C specs: `catalog.service.spec.ts` (2), `knowledge-reindex.spec.ts` (2), `knowledge-ingest.service.spec.ts` (7), `ai-runs.service.spec.ts` (2), `ai-tools.service.spec.ts` (1), `ai-proxy.service.spec.ts` (1), `process-inbound-message.spec.ts` (3), `meta-send.spec.ts` (5), `ai-token-usage.service.spec.ts` (3).

### `pnpm --dir apps/api typecheck`

Result: **PASS** (`tsc --noEmit` — no errors).

### `pnpm test:isolation`

Result: **PASS**

```text
✓ cross-tenant.org.spec.ts (4 tests | 1 skipped) 178ms
✓ cross-tenant.channels.spec.ts (3 tests) 158ms
Test Files  2 passed (2)
     Tests  6 passed | 1 skipped (7)
Duration  964ms
```

### `pnpm test:eval`

Result: **PASS**

```text
ok:adversarial=10 golden=6
```

Golden VI cases: `tests/eval/golden/01-product-price.md` … `06-model-escalate-flag.md`.

### `apps/ai` pytest

Result: **PASS**

```text
18 passed, 2 warnings in 0.23s
```

Key specs: `test_llm.py` (allowlist), `test_process_message.py` (grounded/escalate/quota), `test_reindex.py`.

## DoD summary

| Mục | Status | Evidence |
| --- | --- | --- |
| Migration catalog/knowledge/ai_runs + RLS | **GREEN** | `supabase/migrations/20260725100000_catalog_knowledge_ai.sql`; ADR `docs/adr/0003-embedding-dims.md` (768-dim) |
| Catalog CRUD + reindex outbox | **GREEN** | `apps/api/src/modules/catalog/*`; `catalog.service.spec.ts` — 2/2 pass; outbox `knowledge.reindex` on write |
| Reindex job → AI embed → Core ingest | **GREEN** | `knowledge-reindex.spec.ts` (2/2); `apps/ai/app/api/v1/reindex.py`; `knowledge-ingest.service.spec.ts` (7/7) |
| LlmProvider Gemini + allowlist | **GREEN** | `apps/ai/app/infra/llm/*`; `test_llm.py` — reject model outside allowlist |
| Orchestrator process-message grounded/escalate | **GREEN** | `apps/ai/app/domain/orchestrator.py`; `test_process_message.py` — empty/low-relevance → escalate |
| Core tools getProduct + createDraftOrder | **GREEN** | `apps/api/src/modules/internal/ai-tools.service.ts`; `ai-tools.service.spec.ts` — 1/1 pass |
| Core writes `ai_runs` (prompt_version, model) | **GREEN** | `apps/api/src/modules/audit/ai-runs.service.ts`; `ai-runs.service.spec.ts` — 2/2 pass |
| `ai.process_inbound` + meta.send gate | **GREEN** | `process-inbound-message.spec.ts` — kill/epoch/quota paths; `meta-send.spec.ts` — 5/5 pass |
| Quota check before LLM | **GREEN** | `ai-token-usage.service.spec.ts` (3/3); `test_process_message.py` quota exceed → escalate |
| Eval golden VI + adversarial | **GREEN** | 6 golden + 10 adversarial via `pnpm test:eval` |
| Isolation: org-scoped chunk retrieve | **GREEN** | RLS on `knowledge_chunks`; RPC `retrieve_knowledge_chunks(p_org_id)`; ingest spec verifies org filter |
| Live Gemini E2E + Page DM | **AMBER — NOT RUN** | No API key/tunnel in gate env; manual E2E deferred to Plan D staging |

## Wave E+F task coverage (author checklist)

| Wave | Task | Status |
| --- | --- | --- |
| C0 Migration | 1 | GREEN |
| C1 Catalog CRUD | 2 | GREEN |
| C2 Reindex pipeline | 3 | GREEN |
| C3 LlmProvider | 4 | GREEN |
| C4 Orchestrator | 5 | GREEN |
| C5 Tools + ai_runs | 6 | GREEN |
| C6 process_inbound + send gate | 7 | GREEN |
| C7 Quota | 8 | GREEN |
| C8 Eval golden VI | 9 | GREEN |
| C9 DoD evidence | 10 | GREEN |

## Out of scope (confirmed not in Plan C)

Full Web inbox/catalog UI polish, orders confirm/export, Meta App Review package, carrier API — deferred to Plan D.
