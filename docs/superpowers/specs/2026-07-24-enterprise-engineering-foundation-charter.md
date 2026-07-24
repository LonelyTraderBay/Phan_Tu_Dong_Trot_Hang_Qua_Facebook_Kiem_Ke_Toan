# Enterprise Engineering Foundation Charter

**Date:** 2026-07-24  
**Status:** Locked with product design  
**Applies to:** Every commit from repository initialization onward  
**Runtime topology:** **C — FE + Core API + AI Service**  
**Related:** [**CANONICAL**](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [specs README](./README.md) · [Phase 1 design](./2026-07-24-omni-commerce-ai-saas-design.md) · [**Structure & data architecture (LOCKED)**](./2026-07-24-enterprise-structure-and-data-architecture.md) · [maturity → 100](./2026-07-24-enterprise-maturity-scorecard-to-100.md) · [External services / Free-first](./2026-07-24-external-services-catalog.md) · [Commercialization](./2026-07-24-enterprise-grade-commercialization-analysis.md) · [Stack ADR](./2026-07-24-backend-python-vs-typescript-analysis.md)

## 1. Purpose

This charter turns the mandate *“nền móng vững chắc từ đầu — sau này chỉ xây thêm, chuẩn Enterprise-Grade từ dòng code đầu”* into enforceable engineering rules.

**Goal:** Change later work from *rewrite* to *add modules/services*.  
**Topology locked:** Next.js FE · NestJS Core API (TypeScript) · FastAPI AI Service (Python) · Supabase data platform.

**Structure & schema:** From commit #1, folder layout, module map, naming, API errors, and canonical tables **must** follow [enterprise-structure-and-data-architecture.md](./2026-07-24-enterprise-structure-and-data-architecture.md).

**Maturity to 100/100:** Follow [enterprise-maturity-scorecard-to-100.md](./2026-07-24-enterprise-maturity-scorecard-to-100.md). **M1** (Tier A) locked in docs; **M2** mandatory in Platform plan DoD; **M4 = only official 100/100**. Never market “100 Enterprise” before M4.

**Cost / deploy (locked with Free-first):**

- Pre-customer hosts: **Render Free** (web Node + api + ai; hoặc Fly), Supabase Free ×2, Inngest Free (functions in **api only**), Gemini Free, Resend Free, Sentry Free  
- Details: [external-services-catalog §0](./2026-07-24-external-services-catalog.md) · coding defaults: design §15

## 2. Non-negotiables (from commit #1)

1. **Three deployables** — `apps/web`, `apps/api`, `apps/ai` exist from scaffold; AI is not embedded in Next/Nest as the end state.
2. **Enterprise folder/module map** — matches structure doc §1–4 on day one (empty modules allowed; missing domains forbidden).
3. **Multi-tenant by default** — every business table has `org_id`; Supabase RLS enabled; no service-role from the browser.
4. **Server secrets stay on server** — Meta tokens in Core only; LLM keys in AI only; never `NEXT_PUBLIC_*` secrets.
5. **Async boundaries** — Meta webhooks and AI/LLM work use durable jobs with idempotency, retry, DLQ.
6. **FE → Core only** — browser never calls AI Service or Supabase service role.
7. **AI → Core for mutations** — orders/stock via Core m2m; `ai_runs` persisted by **Core**; knowledge via org-forced RPC or Core ingest.
8. **Contracts first** — OpenAPI (Core) + shared error model; FE and AI generate/consume clients.
9. **Provider interfaces** — `ChannelProvider` (Core), `LlmProvider` (AI), stubs for Shipping/Payment.
10. **Observability** — `request_id`, `org_id`, `actor_user_id` / `job_id` across services (propagate trace headers).
11. **Audit** — Core writes `audit_logs` + `ai_runs`; append-only audit.
12. **Tests gate merge** — CI: web typecheck, api typecheck/tests, ai pytest, isolation tests.
13. **Migrations only** — Supabase migrations; canonical table/column names per structure doc §8.
14. **VI product / EN code** — UI Vietnamese; code identifiers English (TS + Python).
15. **Required headers** — `X-Org-Id` on shop business APIs; platform routes under `/ops/v1` for `platform_admins` only.

## 3. Target repository shape (Option C)

**Canonical detail:** [enterprise-structure-and-data-architecture.md](./2026-07-24-enterprise-structure-and-data-architecture.md) §§1–4.

Summary:

```text
apps/web | apps/api | apps/ai
packages/db | authz-types | contracts | api-client
supabase/migrations | seed
tests/isolation | integration | eval
```

**Rule:** Feature PRs name the deployable (`web` | `api` | `ai`) and module. Do not put order writes in `web` or LLM calls in `api`. Scaffold DoD = structure doc §11.

## 4. Trust & auth between services

| From → To | Mechanism |
|-----------|-----------|
| Browser → Core | Supabase JWT; Core validates + loads memberships |
| Browser → Supabase | Anon key + RLS only for approved realtime/storage reads if any; prefer Core |
| Core → AI | Enqueue job with signed payload (`org_id`, `conversation_id`, `message_id`) or m2m HTTP with service JWT |
| AI → Core tools | m2m service credential; Core re-checks `org_id` on every tool |
| Core → Meta | Encrypted page tokens |
| AI → LLM vendor | AI env secrets only |

## 5. Data & security baseline

### 5.1 Every tenant table

- `id` (uuid), `org_id`, `created_at`, `updated_at`
- Soft delete only when product needs (`deleted_at`)

### 5.2 RLS

- User JWT: rows only for memberships.
- Core server uses user-scoped client when acting for a user; service role only in verified webhook/job paths after `org_id` resolution.
- AI uses Core tools for writes; retrieve uses Core retrieval API **or** org-forced RPC (never unscoped service-role SELECT). See design §8.1.

### 5.3 Audit minimum

`org.created` · `member.invited` · `channel.connected` · `settings.ai.updated` · `order.created` · `order.confirmed` · `order.cancelled` · `ai.run.completed` · `org.suspended`

## 6. Extension points

| Extension | Owner | Phase 1 | Later |
|-----------|-------|---------|-------|
| `ChannelProvider` | Core | Meta Page+IG | Zalo, Shopee… |
| `LlmProvider` | AI | **Gemini** default (Free-first) | Failover / tier by plan |
| `entitlements` | Core | plan flags + quotas | Enterprise SKUs |
| `ShippingProvider` | Core stub | Manual export | GHN/GHTK |
| `PaymentProvider` | Core stub | payment_method enum | Gateways |
| New vertical packs | Catalog attrs + AI prompts | Templates | Pack modules |

## 7. Definition of Done (every feature PR)

- [ ] Correct deployable (`web` / `api` / `ai`)  
- [ ] Contract updated if HTTP/job shape changed  
- [ ] Tenant/`org_id` impact reviewed  
- [ ] Audit / `ai_runs` if applicable  
- [ ] Job/idempotency if Meta or LLM  
- [ ] Tests in the matching suite  
- [ ] VI strings for user-visible UI  
- [ ] No secret in client bundle  
- [ ] Migration if schema changed  
- [ ] Entitlement/flag if plan-gated  

## 8. Environments

| Env | web | api | ai | Supabase |
|-----|-----|-----|-----|----------|
| local | yes | yes | yes | local or dev project |
| staging | yes | yes | yes | staging project |
| production | yes | yes | yes | production project |

Separate staging/production projects mandatory.

## 9. AI standards (apps/ai)

- Prompt versions stored with `ai_runs`
- Tools are the only path to price/stock/create draft order (via Core)
- Refuse/escalate when retrieval empty for factual claims
- Golden set VI in `tests/eval`
- Cost + token usage logged; Core enforces plan quota (AI reports usage)

## 10. First implementation sequence (blocking order)

1. Monorepo scaffold: `web` + `api` + `ai` + CI matrices + OpenAPI skeleton  
2. Supabase migrations: orgs, memberships, RLS + isolation tests via API  
3. Core authz + entitlements + feature flags + audit  
4. Job infrastructure (**Inngest in `apps/api` only**; HTTP stubs to call `apps/ai`)  
5. Admin-ops (suspend org, health)  
6. Channels Meta on **api** (OAuth, webhook verify, idempotent enqueue)  
7. Catalog on **api** + knowledge index jobs → **ai** embed  
8. Inbox persistence **api** + `ai.process_inbound_message` on **ai**  
9. Orders + export on **api**; AI tools call Core  
10. Web VI dashboards  
11. Legal pages + runbooks (Meta down, AI down, DLQ)

Steps 1–5 block customer Meta traffic.

## 11. Approval

- Enterprise from first commit — locked  
- Topology **C** (FE + Core API TS + AI Python) — locked 2026-07-24  
- Core API language default **NestJS/TypeScript** (not Go) unless later explicit change  
- **Free-first** vendors — locked 2026-07-24  
- Jobs **Inngest**; LLM default **Gemini** (pre-customer) — locked  
- **Structure & data architecture** — locked ([structure doc](./2026-07-24-enterprise-structure-and-data-architecture.md))
