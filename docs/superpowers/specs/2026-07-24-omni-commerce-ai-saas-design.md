# Design: Omni-Commerce AI SaaS (Phase 1)

**Date:** 2026-07-24  
**Status:** Decisions locked — **awaiting final user OK** before implementation plan  
**Product working name:** Omni-Commerce + AI Admin (SaaS)  
**Build posture:** Foundations-first / additive only — no throwaway demo (see §2.2)  
**Related docs:** [**CANONICAL**](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [specs README](./README.md) · [charter](./2026-07-24-enterprise-engineering-foundation-charter.md) · [**structure & data architecture**](./2026-07-24-enterprise-structure-and-data-architecture.md) · [maturity → 100](./2026-07-24-enterprise-maturity-scorecard-to-100.md) · [external services / Free-first](./2026-07-24-external-services-catalog.md) · [commercialization](./2026-07-24-enterprise-grade-commercialization-analysis.md) · [stack ADR](./2026-07-24-backend-python-vs-typescript-analysis.md) · [coding gaps CLOSED](./2026-07-24-coding-gaps-pre-implementation.md) · [pre-plan audit FIXED](./2026-07-24-spec-audit-pre-plan.md)

## 1. Goal

Build a multi-tenant SaaS so each shop owner can:

1. Connect their own **Facebook Page + Instagram**
2. Let an **AI admin** answer customers from shop knowledge (RAG, no inventing)
3. Collect order info into **draft orders** (optional auto-confirm per shop)
4. **Export** confirmed orders (Excel/CSV/PDF) for staff to ship manually via GHN/GHTK
5. Manage catalog, inbox takeover, and a basic owner dashboard

**Long-term posture:** Every line of code from day one targets **Enterprise-Grade** production standards. Later phases **add** shipping, payments, more channels, ERP-lite, advisor AI via extension points — without rewriting the core platform. Phase 1 **feature** scope stays narrow; foundation + contracts ship complete.

## 2. Decisions locked

| Topic | Decision |
|-------|----------|
| Channels (MVP) | Facebook Page + Instagram only |
| Business model | SaaS — many shops; each connects their own Page/IG |
| Vertical | General — shops sell anything; flexible catalog |
| Order confirm | Default **draft**; shop may enable **auto-confirm** |
| Fulfillment | Export Excel/CSV/PDF only — no carrier API |
| Payment | Record method only (COD / bank transfer / other) — no payment gateway |
| Build approach | **A — Custom full** → runtime shape **C (polyglot)** |
| Platform | **Supabase required** (Auth, Postgres + pgvector, Storage) |
| App framework | **FE:** Next.js · **Core API:** TypeScript (NestJS) · **AI:** Python (FastAPI) |
| Language (product) | **Tiếng Việt (VI)** — UI, AI chat, thông báo, export |
| Language (code) | **TS (FE+Core)** + **Python (AI service)**; identifiers/API/DB **English** |
| Build posture | **Enterprise foundations from commit #1** — additive growth only |
| Runtime topology | **C — FE + Core API + AI Service** (locked 2026-07-24) |
| Cost policy | **Free-first** until customers; then paid upgrades ([catalog §0](./2026-07-24-external-services-catalog.md)) |
| Jobs | **Inngest** (Free → paid) |
| LLM default (pre-customer) | **Google Gemini** via AI Studio free tier (`LlmProvider` interface) |
| Web host (pre-customer) | **Render Free (Node Next.js)** — CF Pages deferred (see §15 B1) |
| API + AI host (pre-customer) | **Render Free** or **Fly.io** free (one vendor for web+api+ai) → always-on when customers |

### 2.1 Language policy (locked)

#### A) Ngôn ngữ sản phẩm (người dùng thấy)

| Surface | Language |
|---------|----------|
| UI dashboard (chủ shop / CSKH / kho) | **Tiếng Việt** |
| AI trả lời khách (Messenger / Instagram) | **Tiếng Việt** (mặc định) |
| Email / thông báo hệ thống (Phase 1) | **Tiếng Việt** |
| Export Excel/CSV/PDF (header cột) | **Tiếng Việt** |

**Phase 1 không làm i18n** (không multi-language UI, không locale switcher).  
Nếu sau này cần thêm ngôn ngữ (EN…), đó là phase riêng — `organizations.locale` mặc định `"vi"` (cột riêng; không nhét locale vào `settings_json`).

#### B) Ngôn ngữ code / kỹ thuật (locked)

| Mục | Quyết định |
|-----|------------|
| Frontend | **TypeScript** — Next.js App Router |
| Core API | **TypeScript** — NestJS (modular), OpenAPI for FE/AI contracts |
| AI Service | **Python 3.12+** — FastAPI (RAG, LLM orchestrator, embed, eval) |
| SQL / migrations | SQL trên **Supabase Postgres** |
| Tên file, biến, hàm, type, API route, cột DB | **English** |
| Comment trong code | **English** (ngắn, chỉ khi cần) |
| Commit message / PR | English ưu tiên; Vietnamese OK |
| Spec / docs | Song ngữ OK |

**Không** gộp logic AI/LLM orchestrator vào Next.js hay NestJS như đích cuối — AI chạy trong **AI Service Python** từ đầu (có thể mỏng, nhưng process/deploy riêng).  
**Không** dùng Python cho Core OMS/Meta/orders (trừ khi sau này có quyết định migrate có chủ đích).

### 2.2 Enterprise build posture (locked 2026-07-24)

**User mandate:** Build a solid foundation from day one so later work is mostly **additive**, not rewrite. All work follows **Enterprise-Grade** standards from the first line of code — this is **not** a demo/prototype track.

| Rule | Meaning |
|------|---------|
| No throwaway path | Do not ship “temporary” auth, tenancy, webhooks, or AI without RLS/audit/jobs |
| Additive modules | New channels/payments/ERP plug in via interfaces; do not fork core |
| Platform before features | WS1 Platform (isolation, jobs, staging, flags, ops) lands before/in parallel with revenue UI — never bypassed |
| Production DoD | A feature is not done until tests, audit, tenant safety, and observability are done |
| Extension points early | `plan`/`entitlements`, channel provider interface, LLM provider interface, job queue — exist even if unused |

**Forbidden:**

- Skipping RLS “for speed”
- Storing Meta tokens in plaintext or client-accessible storage
- Handling Meta webhooks only inside a synchronous HTTP handler without idempotency
- Hardcoding a single LLM vendor with no provider abstraction
- Single environment used as both staging and production
- Feature work that cannot state which module boundary it belongs to

Full engineering norms: [2026-07-24-enterprise-engineering-foundation-charter.md](./2026-07-24-enterprise-engineering-foundation-charter.md).

### Explicitly out of Phase 1

- Facebook personal profile automation
- Zalo, Shopee, TikTok Shop, Lazada
- GHN/GHTK/Viettel API, label printing
- Online payment / VietQR gateway
- Full ERP, HR, payroll, e-invoices
- Auto-publish posts; ads ROAS deep sync
- Owner “advisor AI” (Phase 3)
- Deep per-customer age inference without consent
- Multi-language / i18n UI (EN hoặc ngôn ngữ khác)

## 3. Architecture

**Style:** Polyglot services (Option **C**) — ba deployable từ đầu, **một** Supabase data platform. Không modular-monolith all-in-one làm đích.

```
[Next.js Web — apps/web]
        │  Supabase Auth (JWT) + HTTPS
        ▼
[Core API — apps/api — NestJS / TypeScript]
        │  verify JWT / membership / entitlements
        │  Meta OAuth + webhook verify → enqueue
        │  Catalog, Inbox CRUD, Orders, Export, Admin-ops
        │
        ├──► [Supabase Postgres + RLS + pgvector + Storage]
        │
        └──► enqueue job: ai.process_inbound_message
                    │
                    ▼
         [AI Service — apps/ai — FastAPI / Python]
                    │  RAG retrieve (org_id) + LLM + tools
                    │  tools call Core API (service auth) for
                    │  price/stock/createDraftOrder — không ghi DB tay vượt biên
                    ▼
         Core API sends reply via Meta (or enqueue send job)
```

### Service responsibilities

| Deployable | Stack | Owns | Must not own |
|------------|-------|------|--------------|
| **web** | Next.js + TS | VI UI, session, BFF-light chỉ khi cần | Business writes, Meta tokens, LLM keys |
| **api** (Core) | NestJS + TS | Tenant, RBAC, channels/Meta, catalog, inbox persistence, orders, export, billing flags, audit write, job orchestration | Prompt/RAG/LLM orchestration |
| **ai** | FastAPI + Python | Retrieve, prompt versions, LLM calls, tool-planning, eval harness, embeddings pipeline | Direct Meta send as source of truth; bypass Core for orders |
| **Supabase** | Postgres/Auth/Storage | Source of truth data, RLS, files | Application workflow code |

### Inter-service rules

1. FE → Core API only (not AI Service publicly; not service-role Supabase from browser).  
2. Meta webhook → Core API (verify + idempotent enqueue) → AI Service.  
3. AI Service mutates commerce state **only** via Core API tool endpoints (m2m auth).  
4. Shared OpenAPI / contract package generated for FE and AI clients.  
5. Jobs durable (retry/DLQ) for `meta.webhook`, `ai.process`, `meta.send`, `knowledge.reindex`.

See stack rationale: [backend Python vs TS analysis](./2026-07-24-backend-python-vs-typescript-analysis.md).

### Layers (logical)

| Layer | Responsibility |
|-------|----------------|
| Client | Shop dashboard VI |
| Core API | Tenant authz, CRUD, webhook ingress, orders, enqueue |
| AI Service | Intent + RAG + tools + guardrails + eval |
| Data | Supabase Postgres (tenant-scoped), Storage, audit |
| Integrations | Meta Graph/Webhooks (from Core); LLM providers (from AI) |

## 4. Multi-tenancy & security

- Every business row has `org_id` (shop).
- **Supabase RLS** enforces `org_id` membership on all tenant tables.
- Meta page tokens stored encrypted at rest with **AES-256-GCM** (`TOKEN_ENCRYPTION_KEY` on Core only); never exposed to client. (Supabase Vault optional later — not Phase 1 path.)
- RAG queries **must** filter by `org_id`; automated isolation tests required.
- Roles: `owner`, `cskh` (support), `kho` (warehouse).
- CSKH may approve orders only if shop setting allows.

## 5. Modules (Phase 1)

| Module | Deployable | Phase 1 behavior |
|--------|------------|------------------|
| Tenant & Auth | api + web | Register shop, invite members, roles via Supabase Auth + `memberships` |
| Channels | api | OAuth connect Page + IG, token status, reconnect, webhook verify/enqueue |
| Catalog | api (+ web UI) | CRUD products/variants, price, simple stock, rich content |
| Knowledge index | api triggers → **ai** | On product change enqueue `knowledge.reindex`; **ai** chunks + embeds |
| Knowledge retrieve | **ai** (reads via rule §8.1) | Retrieve + citation for grounded answers |
| Inbox | api (+ web UI) | Unified Page/IG threads; bot on/off; human takeover; escalation |
| AI Admin orchestrator | **ai** | Intent, prompts, LLM, tools planning |
| Orders | api (+ web UI) | Draft/confirm/export; payment_method tag; status flow |
| Dashboard | web → api | New orders, rough revenue, needs-attention, low stock |
| Settings AI | api (+ web UI) | Persona, hours, required fields, auto-confirm; locale `vi` |
| Billing flags | api | `plan` + entitlements + usage meters (no payment gateway) |
| Feature flags | api | e.g. `auto_confirm` |
| Audit | api only (`ai_runs` + `audit_logs` written by **Core**) | Security/money events; AI returns run payload → Core persists |
| Admin-ops | api (+ web operator UI) | List/suspend orgs, channel health |

## 6. Order lifecycle

1. Customer messages Page/IG → Meta webhook → conversation under `org_id`
2. AI replies using RAG + live price/stock tools (if bot ON)
3. AI collects slots: product, qty, name, phone, address, payment method
4. System creates **draft** when required fields (per shop settings) are complete
5. **Default:** owner/CSKH confirms → `confirmed`  
   **Optional:** `auto_confirm=ON` → `confirmed` + audit
6. Staff exports Excel/CSV/PDF and ships manually
7. Staff updates status: `shipped` / `done` / `cancelled` / `returned`
8. AI may answer order-status questions from DB tools (not invented)

### Status enum

`draft` → `confirmed` → `shipped` → `done`  
Also: `cancelled`, `returned`

## 7. Data model (core)

**Canonical schema (columns, keys, RLS):** [enterprise-structure-and-data-architecture.md §7–9](./2026-07-24-enterprise-structure-and-data-architecture.md) — **LOCKED**. Do not invent alternate table/column names in code.

| Entity | Purpose |
|--------|---------|
| `organizations`, `memberships`, `membership_invites`, `platform_admins` | Tenant + RBAC + SaaS ops |
| `entitlements`, `feature_flags`, `usage_events` | Plans / flags / meters |
| `channel_connections` | Meta Page/IG tokens (encrypted) |
| `products`, `product_variants` | Catalog (VND int, stock) |
| `knowledge_chunks` | RAG embeddings (pgvector) |
| `contacts`, `conversations`, `messages` | CRM + inbox (`bot_epoch`) |
| `orders`, `order_items` | Commerce + idempotency |
| `webhook_receipts`, `job_dead_letters` | Reliability |
| `ai_runs`, `audit_logs` | AI + security trail (**Core** writes) |

Money = **BIGINT VND**; phones = **E.164**; TZ default `Asia/Ho_Chi_Minh`.

## 8. AI / RAG guardrails

1. **Grounding:** Answer only from org knowledge + realtime tools for that org.
2. **No invent:** If missing → say unsure, ask clarifying question, or escalate.
3. **Order slots:** Never create order without required fields.
4. **Takeover:** Staff open → pause bot until staff re-enables.
5. **PII:** Minimize logging of phone/address in analytics exports.
6. **Tenant wall:** All retrieves filtered by `org_id`.
7. **Cost cap:** Monthly token quota per plan; warn near limit.
8. **Citations:** Prefer returning source product/doc ids used in the answer.

### 8.1 RAG read / write boundary (locked)

- **Write/index:** Core detects catalog change → enqueue `knowledge.reindex` → **AI Service** embeds into `knowledge_chunks`.  
- **Read/retrieve:** AI Service retrieves **only** with `org_id` from the trusted job payload, via either (a) Core retrieval API, or (b) DB role/RPC that **forces** `org_id` predicate — never a broad service-role SELECT without org filter.  
- **Mutations (orders, stock adjust):** AI → Core tool HTTP only.

Advisor AI for “what to sell / when to post” is **not** Phase 1.

### 8.2 Abuse & rate limits (Phase 1 minimum)

- Public auth endpoints: rate limit (IP + email).  
- Meta webhook: verify signature; reject duplicates via `webhook_receipts`.  
- Core tool APIs (m2m): service auth + per-`org_id` rate limit.  
- AI: enforce entitlements quota before LLM call.

## 9. Tech stack (locked) — Option C + Free-first

| Piece | Choice |
|-------|--------|
| Frontend | Next.js App Router + TypeScript (VI UI) |
| Web host (pre-customer) | **Render Free (Node)** — CF Pages deferred (§15 B1) |
| Core API | NestJS + TypeScript + OpenAPI |
| AI Service | FastAPI + Python 3.12+ |
| API/AI host (pre-customer) | **Render Free** or **Fly.io** free → paid always-on when customers |
| DB | Supabase Postgres + pgvector + RLS (Free ×2 → Pro prod when customers) |
| Auth | Supabase Auth (JWT by Core; m2m for AI); business APIs require **`X-Org-Id`** |
| Files | Supabase Storage |
| Inbox refresh | Polling 3–5s Phase 1 |
| Jobs | **Inngest** in **`apps/api` only**; AI via HTTP m2m |
| LLM | **Gemini** default; `LlmProvider`; keys only on AI |
| Email | **Resend** Free |
| Errors | **Sentry** Free |
| Meta | Graph API + Webhooks — **Core API** |
| Tooling | pnpm + Turborepo; uv; Node 20; Python 3.12 |

## 10. Meta integration notes

- Use official Page + Instagram Messaging APIs only.
- One Meta App; each shop completes OAuth and grants pages they own.
- Webhook verifies signature; idempotent message handling.
- Plan for **Meta App Review** before public SaaS onboarding.
- Do not scrape or automate personal Facebook profiles.

## 11. Phased roadmap (post–Phase 1)

| Phase | Focus |
|-------|--------|
| 2 | Inventory depth, carrier APIs, COD reconciliation, returns, simple P&L |
| 3 | Ads spend sync, attribution, owner advisor RAG, content calendar (no auto-post default) |
| 4 | ERP-lite: supplier PO, branches, e-invoice hooks, staff mobile |

## 12. Success criteria (Phase 1)

### 12.1 Product (shop can…)

1. Sign up and invite one CSKH + one kho user  
2. Connect Page + IG  
3. Create products; knowledge updates for RAG  
4. Receive a test DM; AI answers from catalog without inventing SKUs/prices  
5. Produce a draft order; approve; export CSV/Excel/PDF  
6. Pause bot via takeover and resume  
7. Not see another tenant’s data (RLS/isolation verified)

### 12.2 Enterprise foundation (platform must…)

1. Automated **cross-tenant isolation tests** pass in CI  
2. **Staging ≠ production** Supabase projects; migrations apply via pipeline  
3. Meta webhooks are **idempotent**; failures go to **retry/DLQ** with a runbook  
4. Meta tokens encrypted at rest; never exposed to the browser  
5. **Audit log** covers AI runs, order approve/cancel, channel connect, settings changes  
6. **`organizations.plan` + entitlements** exist (billing gateway may be manual)  
7. **Operator admin** can list orgs, suspend org, view channel health  
8. **Feature flags** gate risky capabilities (e.g. auto-confirm)  
9. **AI golden eval set (VI)** runnable (CI or scheduled); provider behind an interface  
10. Error tracking + structured logs with `request_id` / `org_id`  
11. Backup policy documented; at least one restore drill planned (upgrade Supabase Pro before relying on prod customers)  
12. Terms of Service + Privacy Policy published (VI)  
13. **PDPA minimum:** owner can **export** org data and request **delete/anonymize** org (runbook + API or admin action)  
14. Rate limits on auth, webhooks, and AI tool calls (§8.2)

## 13. Open items (non-blocking for implementation plan)

- SaaS billing provider (Stripe / PayOS) — when collecting subscription fees  
- LLM production secondary vendor — when leaving free tier  
- Exact Gemini model IDs (chat vs embed) + vector dimensions — first AI plan task  
- Render vs Fly as **single** free host for web+api+ai — first platform plan task  
- OpenAPI generation details (Nest Swagger → contracts)  
- Formal Vietnamese product brand name (marketing)  
- Cloudflare Pages migration — only after optional OpenNext spike (not Phase 1 critical path)

**Đã chốt Free-first + vendors:** see §2 decisions table and [external-services-catalog §0](./2026-07-24-external-services-catalog.md).

## 14. Approval

User approved design sections:

1. Architecture — OK  
2. Modules + order flow — OK  
3. Data + AI guardrails + stack — OK (Supabase mandatory)  
4. Language — VI product + TS/Python code locked  
5. Build posture — Enterprise foundations / additive only locked  
6. Runtime topology — **C** locked  
7. External cost policy — **Free-first** locked  
8. Spec audit fixes — applied 2026-07-24  
9. **Enterprise structure & data architecture** — locked 2026-07-24 ([structure doc](./2026-07-24-enterprise-structure-and-data-architecture.md))  
10. Pre-code defaults §15 — locked  
11. **Enterprise maturity path M0→M4 (100/100 = M4 only)** — locked ([scorecard](./2026-07-24-enterprise-maturity-scorecard-to-100.md))

**Next step after user OK:** write implementation plan under `docs/superpowers/plans/`. Plan A Platform **must** include maturity **M2** DoD. Do not claim 100/100 until M4.

## 15. Pre-code defaults (đóng lỗ hổng khi bắt tay code)

**Source:** [coding-gaps analysis](./2026-07-24-coding-gaps-pre-implementation.md).  
Các mặc định dưới đây **có hiệu lực cho Phase 1** trừ khi user đổi trước khi scaffold.

| ID | Topic | Default locked for Phase 1 |
|----|--------|----------------------------|
| B1 | Web host (Free-first) | **`apps/web` on Render Free (Node Next.js)** — same family as api/ai. Cloudflare Pages deferred until OpenNext spike passes. Cloudflare vẫn dùng cho DNS/CDN. |
| B2 | Inngest × Python | **All Inngest functions live in `apps/api` (TS).** Steps call `apps/ai` via m2m HTTP. Python does **not** register Inngest handlers in Phase 1. |
| B3 | AI persistence | **`ai_runs` written by Core** (AI returns run payload to Core / internal ingest). **`knowledge_chunks`**: AI may write only via **org-forced RPC** (or Core ingest API). No broad service-role CRUD from AI. |
| B4 | Active org | Required header **`X-Org-Id`** on Core business APIs; Core verifies membership. |
| B5 | SaaS operator | Table **`platform_admins`**; **`/ops/v1/*` only**. Seed via `PLATFORM_ADMIN_EMAILS`. |
| B6 | Webhook path | Verify → `webhook_receipts` → enqueue → **HTTP 200**. Keep-warm cron optional pre-customer; **always-on host before real customers**. Local: Cloudflare Tunnel or ngrok. |
| B7 | Tooling | **pnpm** + **Turborepo**; Python **uv**; Node **20 LTS**; Python **3.12**. |
| B8 | Token crypto | **AES-256-GCM**; env `TOKEN_ENCRYPTION_KEY` (32-byte base64). |
| H1 | Stock | Decrement on **`confirmed`**; restore on `cancelled` if not yet `shipped`. Draft does not decrement. |
| H2 | Takeover vs in-flight AI | `conversations.bot_epoch`; jobs carry epoch; Core drops Meta send on mismatch. |
| H3 | Draft idempotency | Unique on `(org_id, idempotency_key)` for drafts created by AI tools. |
| H4 | Meta 24h window | Check before send; on failure mark outbound + escalate — no infinite retry storm. |
| H5 | Non-text inbound | Persist type/URL; AI replies asking for text (VI). |
| H7 | Money | **VND as integer** (`BIGINT`), no decimals. |
| H8 | Timezone | Default column **`organizations.timezone = Asia/Ho_Chi_Minh`**. |
| H9 | Phone | Store **E.164**. |
| M8 | Inbox live updates | Phase 1: **polling 3–5s** (Realtime optional later). |

### Still chosen in first plan tasks (not product ambiguity)

- Render vs Fly as the single free host vendor for web+api+ai  
- Exact Gemini model IDs (chat + embed) + pgvector dimensions  
- OpenAPI generation pipeline details (Nest Swagger → `packages/contracts`)

### Explicit hosting note (updates §2 / §9)

| Deployable | Pre-customer host (locked default) |
|------------|-----------------------------------|
| `apps/web` | Render Free (Node) |
| `apps/api` | Render Free or Fly free (plan picks one vendor for all three) |
| `apps/ai` | Same vendor as api |
| DNS/CDN | Cloudflare Free |

Cloudflare Pages for Next remains an **optimization later**, not the Phase 1 critical path.

