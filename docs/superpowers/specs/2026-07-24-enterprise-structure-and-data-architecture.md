# Enterprise Project Structure & Data Architecture

**Date:** 2026-07-24  
**Status:** **LOCKED** — apply from repository commit #1; additive changes only  
**Authority:** Overrides ad-hoc scaffold choices. If conflict: **[CANONICAL](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) > this file + charter > habit**.  
**Related:** [CANONICAL](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [design](./2026-07-24-omni-commerce-ai-saas-design.md) · [charter](./2026-07-24-enterprise-engineering-foundation-charter.md) · [coding gaps CLOSED](./2026-07-24-coding-gaps-pre-implementation.md) · [**maturity → 100**](./2026-07-24-enterprise-maturity-scorecard-to-100.md)

## 0. Mandate

From the **first line of code**, the repo must already look and behave like a long-lived Enterprise SaaS:

- Folders/modules map 1:1 to deployables and domains  
- Data model is multi-tenant, indexed, RLS-ready, migration-owned  
- Code layers (API / domain / infra) are separated  
- Later features **add** tables/modules — they do **not** reshape the skeleton  
- Maturity path **M0→M4** follows [enterprise-maturity-scorecard-to-100.md](./2026-07-24-enterprise-maturity-scorecard-to-100.md); **do not claim 100/100 before M4**

**Do not** start with a flat `src/utils` dumping ground and “clean up later”.

---

## 0b. Enterprise v1.1 additions (M1 — locked with maturity scorecard)

Implement in schema/scaffold (additive to §8):

| Addition | Purpose |
|----------|---------|
| `outbox_events` | Same-TX side effects → Inngest (preferred) |
| Permission checks via matrix | See scorecard §6 — not role string compares alone |
| Global flags `kill_ai_outbound`, `kill_ai_all`, `kill_auto_confirm` | Incident kill-switch |
| `prompt_version` + model allowlist on every AI run | AI governance |
| Data retention defaults in settings | Compliance |
| Log PII redaction | Security |
| `traceparent` propagation | Observability |
| `docs/adr/`, `CODEOWNERS`, `docs/runbooks/` | SDLC |

Full rules: [maturity scorecard](./2026-07-24-enterprise-maturity-scorecard-to-100.md) §§6–11.

---

## 1. Monorepo layout (locked)

```text
/
├── apps/
│   ├── web/                         # Next.js 15 App Router — VI UI only
│   ├── api/                         # NestJS — Core API + Inngest functions
│   └── ai/                          # FastAPI — RAG/LLM/embed only
├── packages/
│   ├── db/                          # Shared Zod schemas + generated DB types (TS)
│   ├── authz-types/                 # Roles, permissions enums (TS)
│   ├── contracts/                   # openapi.yaml, asyncapi/job JSON schemas
│   └── api-client/                  # Generated TS client for web (from OpenAPI)
├── supabase/
│   ├── config.toml
│   ├── migrations/                  # ONLY schema source of truth
│   ├── seed/                        # Dev seed (never production secrets)
│   └── functions/                   # Empty Phase 1 (prefer Core API over Edge)
├── tests/
│   ├── isolation/                   # Cross-tenant (HTTP against api)
│   ├── integration/                 # webhook → job → ai → draft
│   └── eval/                        # VI golden set for AI
├── docs/
│   └── superpowers/
│       ├── specs/                   # This design corpus
│       └── plans/                   # Implementation plans
├── .github/workflows/
│   ├── ci-web.yml
│   ├── ci-api.yml
│   ├── ci-ai.yml
│   ├── ci-isolation.yml
│   └── migrate-check.yml
├── .env.example                     # Documented keys only; no secrets
├── package.json                     # pnpm workspaces root
├── pnpm-workspace.yaml
├── turbo.json
├── .eslintrc.cjs / eslint.config.js
├── .prettierrc
├── .nvmrc                           # 20
└── README.md                        # VI onboarding for engineers
```

**Forbidden at root:** `helpers/`, `misc/`, `tmp/`, unchecked `scripts/` without README.

---

## 2. Inside `apps/api` (NestJS) — locked module map

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── config/                     # env validation (zod)
├── common/
│   ├── filters/                # ProblemDetails / AppError filter
│   ├── middleware/             # request_id
│   ├── guards/                 # JwtAuthGuard, OrgGuard, RolesGuard, PlatformAdminGuard
│   ├── decorators/             # @OrgId(), @CurrentUser(), @Roles()
│   ├── interceptors/           # logging
│   └── crypto/                 # token encrypt/decrypt AES-GCM
├── modules/
│   ├── identity/               # orgs, memberships, invites
│   ├── authz/                  # permission checks
│   ├── billing/                # plans, entitlements, usage
│   ├── feature-flags/
│   ├── audit/
│   ├── channels/               # Meta OAuth, connections, webhook verify
│   ├── catalog/                # products, variants, stock
│   ├── inbox/                  # conversations, messages, takeover
│   ├── orders/                 # orders, items, export
│   ├── knowledge/              # enqueue reindex only (no LLM)
│   ├── admin-ops/              # platform_admins routes /ops/v1/*
│   ├── internal/               # m2m routes for AI (/internal/v1/*)
│   └── health/
├── jobs/                       # Inngest client + functions (TS only)
│   ├── inngest.client.ts
│   ├── functions/
│   │   ├── process-inbound-message.ts   # calls AI HTTP
│   │   ├── knowledge-reindex.ts
│   │   ├── meta-send.ts
│   │   └── dlq-handler.ts
│   └── index.ts
└── integrations/
    └── meta/                   # Graph client, signature verify
```

**Rules:**

- Domain logic in `modules/*/application` or `*.service.ts` — **not** in controllers.  
- Controllers: HTTP mapping + DTO validation only.  
- No `forwardRef` cycles between `orders` ↔ `channels`; use events/jobs if needed.  
- Route prefixes: `/v1/...` public/shop; `/internal/v1/...` m2m; `/ops/v1/...` platform.

---

## 3. Inside `apps/ai` (FastAPI) — locked layout

```text
apps/ai/
├── pyproject.toml                 # uv managed
├── app/
│   ├── main.py
│   ├── config.py                  # pydantic-settings
│   ├── api/
│   │   ├── health.py
│   │   └── v1/
│   │       ├── process_message.py
│   │       ├── reindex.py
│   │       └── retrieve.py        # if Core delegates retrieve
│   ├── domain/
│   │   ├── orchestrator.py
│   │   ├── prompts/               # versioned prompt files
│   │   ├── tools/                 # HTTP clients to Core tools
│   │   └── guardrails.py
│   ├── infra/
│   │   ├── llm/                   # LlmProvider + Gemini
│   │   ├── embeddings/
│   │   ├── vector/                # org-scoped retrieve RPC
│   │   └── http_core.py           # m2m Core client
│   └── observability/
│       ├── logging.py
│       └── tracing.py
└── tests/
```

**Rules:** No Meta SDK here. No order SQL writes except via Core. Prompts are files with semver in filename or manifest.

---

## 4. Inside `apps/web` (Next.js) — locked layout

```text
apps/web/src/
├── app/                           # App Router
│   ├── (auth)/
│   ├── (app)/                     # authenticated shop UI
│   │   ├── layout.tsx             # requires session + org switcher
│   │   ├── inbox/
│   │   ├── catalog/
│   │   ├── orders/
│   │   ├── settings/
│   │   └── dashboard/
│   ├── (ops)/                     # platform admin UI (platform_admins only)
│   ├── legal/                     # terms, privacy (VI)
│   └── api/                       # ONLY BFF if unavoidable — prefer Core
├── components/                    # VI UI primitives
├── features/                      # feature folders (inbox/, orders/) — no god store
├── lib/
│   ├── api-client.ts              # from packages/api-client
│   ├── auth.ts                    # Supabase browser/server clients
│   └── org-context.ts             # X-Org-Id header injection
└── messages/vi.json               # optional copy table; strings VI
```

**Rules:** No service-role key. No LLM keys. No direct business writes to Supabase except Auth session + optional Storage upload via signed URL from Core.

---

## 5. Naming conventions (locked)

| Kind | Rule | Example |
|------|------|---------|
| DB tables | `snake_case` plural | `order_items` |
| DB columns | `snake_case` | `org_id`, `created_at` |
| PK | `id uuid` | default `gen_random_uuid()` |
| FK | `<table_singular>_id` | `organization` → still `org_id` (exception locked) |
| TS files | `kebab-case.ts` or Nest style `orders.service.ts` | `create-draft-order.ts` |
| TS types | `PascalCase` | `CreateOrderDto` |
| TS/Python vars | `camelCase` / `snake_case` respectively | — |
| HTTP JSON | `camelCase` in public API **or** `snake_case` — **pick one** | **Locked: `camelCase` JSON** for `/v1` and `/internal/v1` |
| Events/jobs | `domain.action` | `ai.process_inbound_message` |
| Migrations | `YYYYMMDDHHMMSS_description.sql` | `20260724120000_init_identity.sql` |
| Env vars | `SCREAMING_SNAKE` | `TOKEN_ENCRYPTION_KEY` |

---

## 6. API & error contract (locked)

### 6.1 Success

JSON body; lists are `{ "items": [...], "nextCursor": "..." }` for pagination (cursor-based preferred).

### 6.2 Errors — Problem Details lite

```json
{
  "error": {
    "code": "ORG_FORBIDDEN",
    "message": "Bạn không thuộc tổ chức này.",
    "requestId": "uuid",
    "details": {}
  }
}
```

- `message` for UI may be VI; `code` always English SCREAMING_SNAKE.  
- Same shape from Nest and FastAPI.

### 6.3 Required headers

| Header | When |
|--------|------|
| `Authorization: Bearer <jwt>` | Shop user → Core |
| `X-Org-Id: <uuid>` | All shop business routes |
| `X-Request-Id: <uuid>` | Optional client; Core always sets/echoes |
| `X-Service-Key` or m2m JWT | AI → Core `/internal/*` |

---

## 7. Data architecture principles (locked)

1. **Single Postgres** (Supabase) = system of record.  
2. Every tenant business table: `id`, `org_id`, `created_at`, `updated_at`.  
3. **RLS on** for all tenant tables; policies via `auth.uid()` ↔ `memberships`.  
4. Soft delete only where product needs (`deleted_at`); orders prefer status, not delete.  
5. Money: **BIGINT VND**; never float.  
6. Timestamps: `timestamptz` UTC storage; display TZ `Asia/Ho_Chi_Minh`.  
7. PII columns documented; audit does not store raw secrets.  
8. **No** cross-org unique constraints without `org_id` (SKU unique **per org**).  
9. Extensions: `pgcrypto`, `vector` (pgvector).  
10. New domains = new tables in new migration — do not overload `settings_json` for core commerce fields.

---

## 8. Canonical schema (Phase 1) — columns locked at entity level

> Exact SQL lands in migrations; **names and keys below must not be renamed** without a versioned migration + contract bump.

### 8.1 Identity & platform

**`organizations`**  
`id`, `name`, `slug` (unique), `plan` (text), `settings_json` (jsonb), `timezone` default `Asia/Ho_Chi_Minh`, `locale` default `vi`, `suspended_at`, `created_at`, `updated_at`

**`memberships`**  
`id`, `org_id`, `user_id` (auth.users), `role` (`owner`|`cskh`|`kho`), `created_at`, `updated_at`  
UNIQUE(`org_id`,`user_id`)

**`membership_invites`**  
`id`, `org_id`, `email`, `role`, `token_hash`, `expires_at`, `accepted_at`, `created_at`

**`platform_admins`**  
`user_id` PK, `created_at`

### 8.2 Billing / flags / usage

**`entitlements`**  
`org_id` PK, `max_pages` int, `ai_monthly_token_limit` bigint, `auto_confirm_allowed` bool, `updated_at`

**`feature_flags`**  
`id`, `key`, `org_id` nullable (null = global), `enabled` bool, `payload_json`, UNIQUE(`key`,`org_id`)

**`usage_events`**  
`id`, `org_id`, `kind` (`ai_tokens`|`message_in`|…), `quantity` bigint, `ref_type`, `ref_id`, `created_at`  
INDEX(`org_id`,`created_at`)

### 8.3 Channels

**`channel_connections`**  
`id`, `org_id`, `provider` (`meta_page`|`meta_ig`), `external_page_id`, `external_ig_id` nullable, `access_token_enc`, `refresh_token_enc` nullable, `token_expires_at`, `status` (`active`|`needs_reauth`|`revoked`), `metadata_json`, `created_at`, `updated_at`  
UNIQUE(`org_id`,`provider`,`external_page_id`)

### 8.4 Catalog

**`products`**  
`id`, `org_id`, `title`, `description`, `status` (`active`|`archived`), `attrs_json`, `created_at`, `updated_at`, `deleted_at`

**`product_variants`**  
`id`, `org_id`, `product_id`, `sku`, `title`, `price_vnd` bigint, `stock_qty` int, `attrs_json`, `created_at`, `updated_at`  
UNIQUE(`org_id`,`sku`)

### 8.5 Knowledge

**`knowledge_chunks`**  
`id`, `org_id`, `source_type` (`product`|`faq`|`policy`), `source_id`, `chunk_index` int, `content`, `embedding vector(N)`, `content_hash`, `created_at`, `updated_at`  
INDEX ivfflat/hnsw on embedding (per Supabase guidance); INDEX(`org_id`,`source_type`,`source_id`)

`N` = dimension of locked Gemini embed model (set in first AI migration; **do not change without reembed**).

### 8.6 CRM / Inbox

**`contacts`**  
`id`, `org_id`, `display_name`, `phone_e164`, `page_scoped_id`, `ig_scoped_id`, `tags_json`, `created_at`, `updated_at`  
UNIQUE null-safe per external ids per org

**`conversations`**  
`id`, `org_id`, `channel` (`messenger`|`instagram`), `channel_connection_id`, `contact_id`, `status`, `bot_paused` bool, `bot_epoch` int default 0, `assignee_user_id`, `last_message_at`, `created_at`, `updated_at`

**`messages`**  
`id`, `org_id`, `conversation_id`, `direction` (`inbound`|`outbound`), `sender_type` (`customer`|`ai`|`staff`|`system`), `raw_type` (`text`|`image`|…), `body_text`, `payload_json`, `provider_message_id`, `created_at`  
UNIQUE(`org_id`,`provider_message_id`) where provider_message_id not null

### 8.7 Orders

**`orders`**  
`id`, `org_id`, `conversation_id` nullable, `contact_id` nullable, `status` (`draft`|`confirmed`|`shipped`|`done`|`cancelled`|`returned`), `payment_method` (`cod`|`bank_transfer`|`other`), `customer_name`, `phone_e164`, `address_text`, `address_json`, `currency` default `VND`, `subtotal_vnd`, `total_vnd`, `idempotency_key`, `confirmed_at`, `shipped_at`, `created_at`, `updated_at`  
UNIQUE(`org_id`,`idempotency_key`) where idempotency_key not null

**`order_items`**  
`id`, `org_id`, `order_id`, `product_id`, `variant_id`, `title_snapshot`, `sku_snapshot`, `qty`, `unit_price_vnd`, `line_total_vnd`

### 8.8 Reliability / AI / audit

**`webhook_receipts`**  
`id`, `provider`, `receipt_key` (e.g. Meta message mid), `org_id` nullable, `payload_hash`, `received_at`  
UNIQUE(`provider`,`receipt_key`)

**`job_dead_letters`**  
`id`, `job_name`, `payload_json`, `error_text`, `attempts`, `created_at`, `resolved_at`

**`outbox_events`** (M1 preferred reliability)  
`id`, `org_id`, `event_name`, `payload_json`, `created_at`, `published_at`, `attempts`  
INDEX(`published_at`) WHERE `published_at` IS NULL

**`ai_runs`**  
`id`, `org_id`, `conversation_id`, `message_id` nullable, `prompt_version`, `model`, `input_tokens`, `output_tokens`, `tools_json`, `citations_json`, `status`, `created_at`  
Written by **Core** from AI response payload (§15 B3)

**`audit_logs`**  
`id`, `org_id` nullable, `actor_user_id` nullable, `actor_type` (`user`|`system`|`ai`|`platform`), `action`, `entity_type`, `entity_id`, `meta_json`, `created_at`  
INDEX(`org_id`,`created_at`)  
**Append-only** (no UPDATE/DELETE from app roles)

---

## 9. RLS policy pattern (locked)

For each tenant table `T`:

```sql
-- Pseudocode pattern (exact SQL in migrations)
ALTER TABLE T ENABLE ROW LEVEL SECURITY;

CREATE POLICY T_select ON T FOR SELECT
  USING (org_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

-- INSERT/UPDATE/DELETE similarly; tighten by role in Core, not only RLS
```

- Service role used only in Core server after `org_id` resolved from verified Meta/m2m.  
- `platform_admins` bypass via Core service role checks — **not** via disabling RLS globally.  
- Isolation tests must fail CI if shop A JWT reads shop B rows.

---

## 10. Code quality gates (from commit #1 CI)

| Gate | Tool |
|------|------|
| TS format | Prettier |
| TS lint | ESLint (typescript-eslint) |
| TS typecheck | `tsc -b` / turbo |
| Python format | Ruff format |
| Python lint | Ruff |
| Python types | Pyright or mypy (strict-ish) |
| Unit | Vitest (api/web) + pytest (ai) |
| Isolation | tests/isolation in CI |
| Secrets | gitleaks or trufflehog on PR |

**Merge to `main` blocked** if any gate red.

---

## 11. Scaffold Definition of Done (first PR)

The first implementation PR is **not** “hello world UI”. It is Done only when:

1. Monorepo tree matches §1–4 (empty modules OK, folders exist)  
2. Supabase migration creates identity tables + RLS + `platform_admins` + `outbox_events`  
3. Nest boots `/health`, validates env with zod  
4. FastAPI boots `/health`  
5. Web boots and can show VI placeholder authenticated shell  
6. CI workflows run on PR  
7. `.env.example` complete for web/api/ai/supabase  
8. README explains how to run all three + supabase locally  
9. Maturity **M2 hooks** present: outbox (or TX enqueue rule), kill-switch flags seeded, redacting logger, trace middleware stubs — [scorecard](./2026-07-24-enterprise-maturity-scorecard-to-100.md)  
10. `CODEOWNERS`, `docs/adr/`, `docs/runbooks/` stubs exist  
11. No full business feature required yet — **structure + identity + M2 hooks required**

## 12. Additive evolution (how we avoid re-checking)

| Future need | How to add | Forbidden |
|-------------|------------|-----------|
| New channel | `channels` provider + tables nullable cols / new connection row | New inbox DB parallel |
| Shipping | `shipping_*` tables + ShippingProvider | Rewrite `orders` PK |
| New AI skill | prompt version + tool in `apps/ai` | Copy orchestrator into Nest |
| New plan limit | entitlements column or json entitlements map versioned | Hardcode ifs in UI only |
| Second region | read replica / new project | Split brain without contract |

---

## 13. Approval

Locked for Enterprise-Grade from first commit per product owner mandate (2026-07-24).  
Implementation plans and scaffold **must** cite this document.
