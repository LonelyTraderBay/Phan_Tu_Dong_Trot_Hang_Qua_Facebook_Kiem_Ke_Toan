# Plan F (Phase 2) — Definition of Done Evidence

**Date:** 2026-07-25  
**Branch:** `feat/plan-f-phase2`  
**Scope:** `docs/superpowers/plans/2026-07-24-plan-f-phase2-operations.md`

| Wave | Status | Notes |
|------|--------|-------|
| **2A Inventory depth** | **GREEN (code)** | `stock_movements` + adjust RPC; confirm/cancel write ledger; API `/v1/inventory/*`; Web `/inventory`; catalog `stockQty` via ledger |
| **2B Carrier** | **GREEN (code)** | Shipping provider interface; encrypted per-org connections; manual + GHN sandbox/mock providers; shipment API + VI order action; export fallback runbook |
| 2C COD | Pending | |
| 2D Returns | Pending | |
| 2E P&L | Pending | |
| 2F Channel #2 | Pending | |
| 2G Billing packaging | Pending | |
| 2H Hardening | Pending | |

## 2A evidence

| Item | Status | Evidence |
|------|--------|----------|
| `stock_movements` table + RLS | GREEN | `supabase/migrations/20260727090000_stock_movements_ledger.sql` |
| `adjust_variant_stock` RPC | GREEN | Same migration |
| Confirm/cancel ledger rows | GREEN | `private.apply_order_stock_change` |
| Inventory API | GREEN | `apps/api/src/modules/inventory/*` |
| Catalog stock via adjust | GREEN | `CatalogService.updateVariant` |
| Web VI | GREEN | `apps/web/src/app/(app)/inventory/page.tsx` + nav |
| API unit tests | GREEN | 118 passing (incl. inventory 5) |

## 2B evidence

| Item | Status | Evidence |
|------|--------|----------|
| Carrier schema + RLS | GREEN | `supabase/migrations/20260727100000_shipping_carrier.sql` |
| Encrypted carrier credentials | GREEN | `ShippingService.upsertConnection` uses `encryptToken`; DTO maps only `hasCredentials` |
| Manual provider | GREEN | `ManualShippingProvider` creates `MANUAL-{order}` tracking |
| GHN sandbox/mock provider | GREEN | `GhnShippingProvider` requires token, supports `config.sandboxUrl`, otherwise records deterministic mock request |
| Create shipment API | GREEN | `POST /v1/shipping/shipments` inserts shipment, updates `orders.shipping_fee_vnd`, calls `ship_order` for confirmed orders |
| Web VI | GREEN | Orders page action `Tạo vận đơn` for confirmed orders |
| Export fallback | GREEN | Existing export code untouched; runbook `docs/runbooks/shipping-carrier-fallback.md` |
| API unit tests | GREEN | Shipping provider/service specs included in `pnpm --filter api test` |

**Next:** Wave 2C COD.
