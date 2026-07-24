# Plan D — Orders + Web VI + Hardening (Waves G + H + I)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 1 Sellable Core — orders lifecycle + export, full VI product UI, legal/PDPA/rate-limits/App Review package — ready for controlled pilot (not CPC/E100).

**Architecture:** Orders on Core with stock decrement on `confirmed`; export from api; web polls inbox 3–5s; legal static pages; ops runbooks finished. No carrier API, no payment gateway.

**Tech Stack:** NestJS · Next.js · ExcelJS (or similar) · Vitest · Playwright optional smoke

**Depends on:** Plan C DoD  
**Next:** [Plan E M3](./2026-07-24-plan-e-m3-commercial-ops.md) when customer imminent  
**Pilot exit:** Design §12.1 + §12.2 sign-off

## Global Constraints

- Stock: decrement on **`confirmed`**; restore on cancel before `shipped`
- Payment tags only: `cod` | `bank_transfer` | `other`
- Phone E.164; money BIGINT VND
- Inbox poll 3–5s Phase 1
- No service-role / Meta token / LLM keys in web
- Idempotency-Key on order create
- VI UI only

## Plan D Definition of Done

- [ ] Orders states + confirm/cancel/ship APIs + stock rules tested  
- [ ] Export CSV/Excel (+ PDF optional)  
- [ ] Web: org switcher, inbox+takeover, catalog, orders, dashboard, channels, settings  
- [ ] Terms + Privacy VI published  
- [ ] PDPA export + delete/anonymize path  
- [ ] Rate limits on auth/webhook/tools  
- [ ] Meta App Review checklist doc  
- [ ] Design §12 checklist recorded in `plan-d-dod-evidence.md`  

## Tasks

### Task 1: Migration orders (+ order_items)

- [ ] SQL per structure §8.7; RLS harden  
- [ ] Commit: `feat(db): orders and order items`

### Task 2: Orders service — create draft / confirm / cancel / ship

- [ ] TDD stock race: two confirms cannot oversell without check  
- [ ] `auto_confirm` flag + audit  
- [ ] Idempotency-Key middleware persistence table `idempotency_keys` (org_id, key, response_hash)  
- [ ] Commit: `feat(api): orders lifecycle and stock on confirm`

### Task 3: Export Excel/CSV/PDF

- [ ] `GET /v1/orders/export?format=xlsx|csv|pdf`  
- [ ] Permission `orders.export`  
- [ ] Commit: `feat(api): order export files`

### Task 4: Web — auth shell + org switcher + invites UI

- [ ] Supabase auth pages VI; active org in localStorage; inject `X-Org-Id`  
- [ ] Commit: `feat(web): auth and org switcher`

### Task 5: Web — Inbox poll + takeover

- [ ] Poll 3–5s; message thread; takeover button  
- [ ] Commit: `feat(web): inbox polling and takeover`

### Task 6: Web — Catalog + Orders + Dashboard + Settings

- [ ] CRUD catalog; orders list/confirm/export download; dashboard widgets; AI/auto_confirm settings  
- [ ] Commit: `feat(web): catalog orders dashboard settings`

### Task 7: Legal pages Terms + Privacy (VI)

- [ ] `apps/web/src/app/legal/terms/page.tsx`, `privacy/page.tsx`  
- [ ] Commit: `feat(web): vi terms and privacy`

### Task 8: PDPA export + delete org

- [ ] `POST /v1/orgs/me/export`, `POST /v1/orgs/me/delete-request` + runbook  
- [ ] Commit: `feat(api): pdpa export and delete request`

### Task 9: Rate limits

- [ ] Auth / webhook / internal tools rate limit (in-memory or Upstash later — start memory per instance)  
- [ ] Commit: `feat(api): rate limits on auth webhook tools`

### Task 10: Meta App Review + staging checklist docs

- [ ] `docs/meta-app-review-checklist.md`  
- [ ] Update runbooks  
- [ ] Commit: `docs: meta app review and pilot checklist`

### Task 11: Plan D DoD evidence + §12 sign-off table

- [ ] `docs/superpowers/plans/plan-d-dod-evidence.md`  
- [ ] Commit: `docs: record plan D DoD — phase 1 pilot ready`

## Out of scope

- M3 paid infra (Plan E)  
- GHN/GHTK API (Plan F)  
- Advisor AI (Plan G)  

## Execution handoff

After Plan C → execute Plan D → **Phase 1 pilot**. Then Plan E when onboarding paying customer.
