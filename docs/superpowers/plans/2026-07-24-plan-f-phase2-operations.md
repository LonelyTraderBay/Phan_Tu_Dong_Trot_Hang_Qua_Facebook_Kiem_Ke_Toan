# Plan F — Phase 2 Operations (Waves 2A–2H)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen operations after Pilot Phase 1 — inventory ledger, carrier, COD, returns, simple P&L, second channel, billing packaging, hardening.

**Architecture:** Core Nest owns stock/orders/shipping money paths; AI never mutates stock directly; all stock changes via RPC/service that writes `stock_movements`; money BIGINT VND; secrets AES-256-GCM; `X-Org-Id` + RLS.

**Tech Stack:** NestJS · Next.js · Supabase/Postgres · Vitest · Inngest (api)

**Depends on:** Plan E code/docs DoD (`plan-e-dod-evidence.md`)  
**Next:** Plan G Phase 3 after `plan-f-dod-evidence.md`  
**Playbook:** [plan-f-priority-execution](./2026-07-24-plan-f-priority-execution.md)

## Global Constraints

- Stock mutations only through ledger-aware paths (confirm/cancel/adjust/return)
- Direct `PATCH` `stockQty` must either call adjust RPC or be rejected
- No float for money; carrier fees BIGINT
- Export Excel remains fallback if carrier down
- VI UI for new surfaces
- One wave critical path at a time inside F

## Plan F Definition of Done

- [x] 2A–2H waves complete with tests
- [x] `plan-f-dod-evidence.md` GREEN/AMBER honest
- [x] No claim CPC

---

## Wave 2A — Inventory depth (F0) — START HERE

### Task F0.1: Migration `stock_movements` + adjust RPC

- [x] Table `stock_movements` (`org_id`, `variant_id`, `movement_type`, `qty_delta`, `stock_after`, `order_id` nullable, `reason`, `actor_user_id`, `created_at`)
- [x] Types: `confirm` | `cancel_restore` | `adjust` | `inbound` | `outbound` (inbound/outbound alias adjust sign)
- [x] RLS: members select; service_role all
- [x] `adjust_variant_stock(org, variant, qty_delta, reason, actor, type)` atomic update + ledger
- [x] Optional org setting `low_stock_threshold` default 5 on `organizations` or query param
- [x] Commit: `feat(db): stock movements ledger and adjust rpc`

### Task F0.2: Wire confirm/cancel RPCs to ledger

- [x] `confirm_order` / `create_and_confirm_order`: after stock decrement insert `confirm` rows (`qty_delta` negative)
- [x] `cancel_order`: on restore insert `cancel_restore` rows (positive)
- [x] Keep existing race / insufficient_stock behavior
- [x] Commit: `feat(db): order stock changes write ledger`

### Task F0.3: Inventory API module

- [x] `GET /v1/inventory/movements?variantId=&limit=`
- [x] `POST /v1/inventory/adjust` `{ variantId, qtyDelta, reason, movementType? }`
- [x] `GET /v1/inventory/low-stock?threshold=`
- [x] Permissions: read=`catalog.read`, write=`catalog.write`
- [x] Route catalog `stockQty` patch through adjust RPC (delta = target − current)
- [x] Unit tests: adjust + list + low-stock + reject negative resulting stock
- [x] Commit: `feat(api): inventory adjust movements low-stock`

### Task F0.4: Web VI — low stock + adjust

- [x] Catalog/variant UI: adjust stock with reason; show recent movements
- [x] Dashboard widget or inventory page: low-stock list
- [x] Commit: `feat(web): inventory adjust and low stock`

### Task F0.5: Wave 2A evidence note

- [x] Update working notes / partial DoD section for 2A in `plan-f-dod-evidence.md` (create stub)
- [x] Commit: `docs: plan F wave 2A evidence stub`

**DoD 2A:** Mọi đổi kho truy vết; race confirm vẫn đúng; UI adjust + low-stock.

---

## Wave 2B — Carrier API (F1)

### Task F1.1–F1.5

- [x] `ShippingProvider` interface + manual provider + GHN sandbox/mock provider
- [x] Encrypted carrier secrets per org via `TOKEN_ENCRYPTION_KEY`
- [x] Create shipment from confirmed order; store tracking
- [x] Fee BIGINT on shipment and `orders.shipping_fee_vnd`
- [x] VI order action `Tạo vận đơn`
- [x] Export fallback runbook when carrier fails
- [x] Commit(s): `feat: plan F wave 2B shipping provider and shipments`

**DoD 2B:** 1 carrier E2E staging; export vẫn dùng được.

---

## Wave 2C — COD reconciliation (F2)

- [x] Expected COD vs collected events; discrepancy queue
- [x] Report API + VI list
- [x] No float
- [x] Commit: `feat: plan F wave 2C COD reconciliation`

**DoD 2C:** Báo cáo đối soát dùng được.

---

## Wave 2D — Returns (F3)

- [x] Order status / return flow; restock via ledger (`return_restock`)
- [x] COD impact rules
- [x] UI return 1 đơn
- [x] Commit: `feat: plan F wave 2D returns restock`

**DoD 2D:** Hoàn 1 đơn → stock/COD đúng.

---

## Wave 2E — Simple P&L (F4)

- [x] COGS inputs; revenue - cost; day/SKU dashboard; export
- [x] Commit: `feat: plan F wave 2E simple pnl`

**DoD 2E:** Lãi gộp ngày/SKU.

---

## Wave 2F — Channel #2 (F5)

- [x] Zalo OA connector skeleton (pattern like Meta): encrypted token connect + webhook receipt/outbox stub
- [x] Inbox multi-channel labels include Zalo
- [x] Commit: `feat: plan F wave 2F zalo oa channel`

**DoD 2F:** Inbox đa kênh.

---

## Wave 2G — Billing packaging (F6)

- [x] Build on ADR 0004 invoice+flags: plans UI, meters, portal, dunning stubs
- [x] Commit: `feat: billing packaging`

**DoD 2G:** Subscription/invoice path chặt hơn E4.

---

## Wave 2H — Hardening (F7)

- [x] Load test notes; runbooks; eval; CHANGELOG
- [x] `plan-f-dod-evidence.md` complete
- [x] Commit: `docs: plan F wave 2H hardening and DoD close`

**DoD Plan F:** Evidence file + all waves.

## Out of scope

- Multi-warehouse (Plan H)  
- Ads/attribution (Plan G)  
- Claiming CPC/E100  
