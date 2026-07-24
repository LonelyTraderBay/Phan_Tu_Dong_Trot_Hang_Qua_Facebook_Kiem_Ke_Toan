# Plan G — Phase 3 Intelligence (Waves 3A–3F)

> **For agentic workers:** implement one wave at a time and update `plan-g-dod-evidence.md` with honest GREEN/AMBER/RED status after each wave.

**Goal:** Add intelligence and expansion surfaces after Phase 2 operations: ads spend, attribution, owner advisor, content calendar, public API, and Phase 3 hardening.

**Architecture:** Core Nest owns tenant-scoped business data. Money remains BIGINT VND. AI advisor is advise-only and cannot auto-post, buy ads, or mutate business tables directly. Public API/webhooks must be scoped, signed, and versioned. `X-Org-Id` + RLS remain mandatory.

**Tech Stack:** NestJS · Next.js · Supabase/Postgres · Vitest · OpenAPI

**Depends on:** Plan F DONE (`plan-f-dod-evidence.md`)  
**Next:** Plan H ERP-lite after Plan G DoD  
**Playbook:** [plan-g-priority-execution](./2026-07-24-plan-g-priority-execution.md)

## Global Constraints

- No float for money; all VND amounts are integer strings over the API and BIGINT in Postgres.
- All new tenant tables include `org_id`, RLS, member read policy, and service-role write path.
- No CPC claim during Plan G.
- Owner Advisor and content calendar are human-in-the-loop; auto-post and ad buying are out of scope unless a later wave adds explicit flags, audit, kill-switch, and approvals.
- No extra PII for attribution beyond what the wave explicitly needs.
- Public API keys and webhook secrets must never be exposed in the web bundle.

## Plan G Definition of Done

- [ ] 3A–3F waves complete with tests
- [ ] `plan-g-dod-evidence.md` GREEN/AMBER honest
- [ ] OpenAPI updated for every new endpoint
- [ ] No claim CPC

---

## Wave 3A — Ads spend (G0) — START HERE

### Task G0.1: Migration `ad_spend`

- [x] Table `ad_spend` (`org_id`, `source`, `date`, `campaign_name`, `amount_vnd`, `external_id`, `created_at`)
- [x] `source` check: `meta_ads` | `csv`
- [x] BIGINT VND non-negative check
- [x] RLS: members select; service_role all
- [x] Indexes by `org_id,date` and optional external id

### Task G0.2: Ad spend API

- [x] Nest module `ad-spend`
- [x] `POST /v1/ad-spend/import` accepts pasted CSV (`date,campaign,amount_vnd`) and JSON rows
- [x] `GET /v1/ad-spend` lists rows by date range
- [x] `GET /v1/ad-spend/summary` totals spend by day
- [x] Validation rejects invalid dates, sources, and non-integer/negative money
- [x] Unit tests for CSV import, JSON import/list, and summary

### Task G0.3: P&L expense line

- [x] `GET /v1/pnl/summary` includes `adSpendVnd` and `netProfitVnd`
- [x] Daily P&L includes ad-only days in range
- [x] Unit tests cover ads as expense line

### Task G0.4: Web VI

- [x] `/ads` page with CSV paste/upload
- [x] List imported rows and totals by day
- [x] Nav link to Ads
- [x] Error messages in Vietnamese

### Task G0.5: Contracts and evidence

- [x] OpenAPI documents new endpoints and extended P&L fields
- [x] `plan-g-dod-evidence.md` marks 3A GREEN/AMBER honestly
- [x] `pnpm --filter api test` passes

**DoD 3A:** Ads cost is imported/listed per org and appears as a P&L expense line. No CPC claim.

---

## Wave 3B — Attribution (G1)

- [x] Store UTM/click ids on contact/order where available
- [x] First-touch and last-touch MVP model
- [x] Source-of-order report
- [x] Privacy review: no unnecessary PII
- [x] Tests and OpenAPI updates

**DoD 3B:** Owner can see MVP source attribution for orders.

---

## Wave 3C — Owner Advisor (G2)

- [x] Advisor skill/service in `apps/ai` or existing AI boundary
- [x] RAG over catalog and sales aggregates
- [x] Advise-only: no Meta send, no ad buying, no business-table direct mutation from AI
- [x] `ai_runs` logging
- [ ] Advisor eval set beyond stub tests (AMBER: live LLM/RAG not proven)
- [x] Entitlement gate
- [x] VI UI for suggestions and approval notes

**DoD 3C:** Grounded advice for what/when to sell; human remains approver.

---

## Wave 3D — Content calendar (G3)

- [ ] Content calendar table/API/UI
- [ ] Optional advisor-generated ideas
- [ ] Auto-post disabled by default
- [ ] If a later flag enables posting: audit, kill-switch, and explicit approval are required
- [ ] Tests and OpenAPI updates

**DoD 3D:** Calendar is usable; auto-post remains off by default.

---

## Wave 3E — Public API and customer webhooks (G4)

- [ ] API keys per org with scopes
- [ ] Stable `/v1` versioning policy
- [ ] Outbound webhooks for `orders.*` and `messages.*`
- [ ] Signature, retry, and failure handling
- [ ] Minimal VI/EN docs
- [ ] Tests for auth, scopes, signature, retry, and tenant isolation

**DoD 3E:** Enterprise customers can pull orders via API and receive signed webhooks.

---

## Wave 3F — Phase 3 hardening (G5)

- [ ] Optional marketplace connector #2 only if ICP requires it
- [ ] Queue lag / AI replica SLO notes
- [ ] Eval regression and load notes
- [ ] Runbooks and CHANGELOG
- [ ] Close `plan-g-dod-evidence.md`

**DoD 3F:** Phase 3 checklist is green or AMBER with owner-owned external blockers.

## Out of scope

- CPC claim (Plan H)
- Multi-warehouse, PO, e-invoice, staff mobile (Plan H)
- Enterprise procurement E100 (Plan I)
