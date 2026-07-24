# CANONICAL LOCKED DECISIONS — nguồn chống xung đột khi code

**Date:** 2026-07-24 (sync pass)  
**Status:** **SOURCE OF TRUTH for conflicts**  
**Rule:** Nếu bất kỳ file spec nào mâu thuẫn với bảng dưới → **bảng này thắng** (trừ khi user đổi có chủ đích + ADR mới).

## 1. Product & topology

| Key | Locked value |
|-----|----------------|
| Channels Phase 1 | Facebook Page + Instagram only |
| Model | SaaS multi-tenant |
| Vertical | General catalog |
| Orders | Default draft; optional auto-confirm |
| Fulfillment | Export Excel/CSV/PDF only |
| Payment on order | Tag COD / bank_transfer / other only |
| Topology | **C:** `apps/web` + `apps/api` + `apps/ai` + Supabase |
| FE | Next.js App Router + TypeScript · UI **Tiếng Việt** |
| Core API | NestJS + TypeScript · OpenAPI |
| AI | FastAPI + Python 3.12 · no Meta send as SoT |
| Code identifiers | English |
| Build | Enterprise from commit #1 · additive only · no demo track |

## 2. Hosting & vendors (Free-first)

| Key | Locked value |
|-----|----------------|
| Cost policy | Free-first until real customers → paid upgrade |
| `apps/web` | **Render Free (Node Next.js)** — NOT Cloudflare Pages in Phase 1 |
| `apps/api` + `apps/ai` | **Render Free** or **Fly.io** free — prefer **one vendor for all three** |
| DNS/CDN | Cloudflare Free |
| Domain | Buy when branding/Meta Review; else `*.onrender.com` temporary OK |
| DB | Supabase Free × **staging + production** → Pro prod when customers |
| Jobs | **Inngest** Free; **all functions in `apps/api` (TS)**; AI via HTTP m2m |
| LLM | **Gemini** AI Studio Free default; `LlmProvider` + allowlist |
| Email | Resend Free |
| Errors | Sentry Free |
| Uptime | UptimeRobot Free |

## 3. Security & tenancy

| Key | Locked value |
|-----|----------------|
| Tenant key | `org_id` + RLS on all tenant tables |
| Active org | Header **`X-Org-Id`** required on shop APIs |
| Roles | `owner` \| `cskh` \| `kho` + permission matrix (maturity §6) |
| Platform ops | `platform_admins` → `/ops/v1/*` only |
| Meta tokens | AES-256-GCM · `TOKEN_ENCRYPTION_KEY` · Core only |
| AI mutations | Core tools only; **`ai_runs` written by Core** |
| Knowledge write | Org-forced RPC or Core ingest — no broad service-role from AI |
| Kill switches | `kill_ai_outbound`, `kill_ai_all`, `kill_auto_confirm` |

## 4. Reliability & data

| Key | Locked value |
|-----|----------------|
| Webhook | verify → `webhook_receipts` → enqueue/outbox → **200** |
| Side effects | Prefer **`outbox_events` same TX**; else enqueue after commit + DLQ |
| Stock | Decrement on **`confirmed`**; restore on cancel before shipped |
| Money | **BIGINT VND** |
| Phone | **E.164** |
| Timezone | Default column **`organizations.timezone = Asia/Ho_Chi_Minh`** |
| Inbox UI refresh | Poll 3–5s Phase 1 |
| Takeover vs AI | `conversations.bot_epoch` |
| JSON API | **camelCase** |
| Routes | `/v1` shop · `/internal/v1` m2m · `/ops/v1` platform |

## 5. Tooling

| Key | Locked value |
|-----|----------------|
| JS monorepo | **pnpm** + **Turborepo** |
| Python | **uv** · 3.12 |
| Node | **20 LTS** |
| Structure | [enterprise-structure-and-data-architecture.md](./2026-07-24-enterprise-structure-and-data-architecture.md) |
| Scaffold DoD | Structure §11 + maturity M2 hooks |

## 6. Maturity → 100/100

| Gate | Meaning |
|------|---------|
| M0 | Foundation docs (done) |
| M1 | Tier A docs (done — scorecard) |
| M2 | Tier B in Plan A DoD (mandatory when coding) |
| M3 | Paid critical path when first customer |
| **M4** | **Only official 100/100** (SSO/SOC2-or-evidence/pen-test/DPA/SLA) |

**Never market 100/100 before M4.**

## 7. Doc index (read in order when conflicting)

1. **This file** (canonical)  
2. [design](./2026-07-24-omni-commerce-ai-saas-design.md) §§2, 9, 15  
3. [structure & data](./2026-07-24-enterprise-structure-and-data-architecture.md)  
4. [maturity scorecard](./2026-07-24-enterprise-maturity-scorecard-to-100.md)  
5. [charter](./2026-07-24-enterprise-engineering-foundation-charter.md)  
6. [external-services §0](./2026-07-24-external-services-catalog.md)  
7. ADR/analysis files = historical context only if conflict  

## 8. Still open (OK — resolve in first plan tasks, not product debate)

- Render vs Fly as the single free host  
- Exact Gemini chat + embed model IDs + `vector(N)`  
- Nest Swagger → OpenAPI codegen details  
- ICP shop lẻ vs agency (GTM)  
- Formal VI brand name  

## 9. Sync stamp

Last full sync: **2026-07-24 (re-audit + fix pass)** — all specs listed in [README](./README.md) aligned to this file. Hard drifts fixed: `/ops/v1/*`, AES-GCM tokens, timezone column, outbox preferred, Inngest-in-api charter wording.
