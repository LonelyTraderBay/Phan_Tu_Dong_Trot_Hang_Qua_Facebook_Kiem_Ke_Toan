# Plan C — Catalog + AI Loop (Waves E + F) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shop manages catalog; knowledge chunks reindex via jobs; inbound messages run AI RAG loop that answers grounded in catalog or escalates; draft orders only via Core tools; Core persists `ai_runs`.

**Architecture:** Catalog CRUD on Core → outbox `knowledge.reindex` → Inngest → HTTP `apps/ai` embed (org-forced). Inbound (from Plan B outbox/job) continues to `ai.process_inbound` Inngest step → AI orchestrator → Core tools → Core may enqueue `meta.send` (still Core). Kill switches + entitlements + `bot_epoch` enforced.

**Tech Stack:** NestJS · FastAPI · Gemini (`LlmProvider`) · pgvector · Inngest · Vitest · pytest

**Depends on:** Plan B DoD  
**Next:** [Plan D](./2026-07-24-plan-d-orders-web-hardening.md)

## Global Constraints

- AI mutations / Meta send: **Core only**; **`ai_runs` written by Core**
- Knowledge write: org-forced RPC or Core ingest — no broad service-role from AI
- Inngest only in `apps/api`; AI via HTTP m2m + `X-Service-Key`
- Money BIGINT VND; `AI_MODEL_ALLOWLIST`; `prompt_version` required on runs
- Kill switches: `kill_ai_outbound`, `kill_ai_all`
- Default AI draft max: `DEFAULT_AI_DRAFT_MAX_AMOUNT_VND` / `settings_json.aiDraftMaxAmountVnd`
- UI VI; JSON camelCase; `X-Org-Id`

## Plan C Definition of Done

- [ ] products/variants CRUD + RLS  
- [ ] reindex job updates `knowledge_chunks` org-scoped  
- [ ] `POST /internal/v1/ai/process-message` (m2m) returns grounded reply or escalate  
- [ ] Core writes `ai_runs` with prompt_version + model  
- [ ] Tools: getProduct, createDraftOrder (draft only) via Core  
- [ ] bot_epoch mismatch drops outbound  
- [ ] Eval golden VI runnable + adversarial ≥10 still green  
- [ ] Quota check before LLM  
- [ ] Isolation: no cross-org chunk retrieval  

## Tasks (execute in order)

### Task 1: Migration catalog + knowledge + ai_runs

**Files:** `supabase/migrations/20260725100000_catalog_knowledge_ai.sql`

- [ ] Tables `products`, `product_variants`, `knowledge_chunks` (vector dim: lock **768** unless Gemini embed docs say otherwise — record in ADR `0003-embedding-dims.md`), `ai_runs`
- [ ] Enable `vector` extension; RLS pattern Plan A harden
- [ ] Commit: `feat(db): catalog knowledge chunks and ai_runs`

### Task 2: Catalog module CRUD

**Files:** `apps/api/src/modules/catalog/*`

- [ ] TDD create product+variant with `price_vnd` bigint
- [ ] Routes `/v1/catalog/products` CRUD; permissions `catalog.read`/`catalog.write`
- [ ] On write → `enqueueOutbox({ eventName: 'knowledge.reindex', payload: { orgId, sourceType: 'product', sourceId } })`
- [ ] Commit: `feat(api): catalog crud with reindex outbox`

### Task 3: Knowledge reindex job → AI embed

**Files:** `apps/api/src/jobs/functions/knowledge-reindex.ts`, `apps/ai/app/api/v1/reindex.py`, `apps/ai/app/infra/embeddings/*`

- [ ] Inngest function calls AI `POST /internal/v1/reindex` (or `/v1/reindex` m2m)
- [ ] AI embeds and writes via Core ingest endpoint **or** org-forced RPC
- [ ] Prefer Core ingest: `POST /internal/v1/knowledge/chunks` (service key) for Plan C simplicity
- [ ] Commit: `feat: knowledge reindex pipeline api to ai`

### Task 4: LlmProvider + Gemini + allowlist

**Files:** `apps/ai/app/infra/llm/*`, env `GEMINI_API_KEY`

- [ ] Interface `LlmProvider.complete(...)`; Gemini impl
- [ ] Reject model not in allowlist
- [ ] Commit: `feat(ai): gemini llm provider with allowlist`

### Task 5: Orchestrator process-message

**Files:** `apps/ai/app/domain/orchestrator.py`, `apps/ai/app/api/v1/process_message.py`, prompts under `apps/ai/app/domain/prompts/v1_*.md`

- [ ] Retrieve top-k chunks by org; if empty factual → escalate
- [ ] Return structured payload: `{ replyText, citations, toolsUsed, promptVersion, model, tokens, escalate }`
- [ ] pytest with mocked LLM + retrieve
- [ ] Commit: `feat(ai): grounded process-message orchestrator`

### Task 6: Core tools for AI + ai_runs writer

**Files:** `apps/api/src/modules/internal/ai-tools.controller.ts`, `apps/api/src/modules/audit`/`ai_runs` service

- [ ] `POST /internal/v1/tools/get-product`, `create-draft-order`
- [ ] After AI response, Core `POST /internal/v1/ai/runs` or write inside process job
- [ ] Enforce draft max amount
- [ ] Commit: `feat(api): ai tools and ai_runs persistence`

### Task 7: Inngest ai.process_inbound + meta.send gate

**Files:** `apps/api/src/jobs/functions/process-inbound-message.ts`, `meta-send.ts`

- [ ] Chain: persist (Plan B) → process AI → if !kill && !bot_paused && epoch match → enqueue send
- [ ] Unit tests for kill switch and epoch mismatch drop
- [ ] Commit: `feat(api): ai inbound job with bot_epoch and kill switches`

### Task 8: Entitlement quota before LLM

- [ ] Core or AI checks monthly token usage vs entitlements; 429/escalate
- [ ] Commit: `feat: enforce ai token entitlements`

### Task 9: Eval golden VI + CI hook

**Files:** `tests/eval/golden/*.md`, wire `tests/eval/run_stub.py` or real runner with mocks

- [ ] ≥5 golden grounded cases + keep ≥10 adversarial
- [ ] Commit: `test(eval): golden vi set for ai grounding`

### Task 10: Plan C DoD evidence

- [ ] `docs/superpowers/plans/plan-c-dod-evidence.md`
- [ ] Commit: `docs: record plan C DoD evidence`

## Out of scope

- Full Web inbox UI polish (Plan D)  
- Export Excel (Plan D)  
- Meta App Review package (Plan D)  

## Execution handoff

After Plan B DoD → execute Plan C with Subagent-Driven. Then Plan D.
