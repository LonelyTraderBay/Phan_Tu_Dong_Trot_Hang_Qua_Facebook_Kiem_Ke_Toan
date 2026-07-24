# Plan F (Phase 2) — Definition of Done Evidence

**Date:** 2026-07-25  
**Branch:** `feat/plan-f-phase2`  
**Scope:** `docs/superpowers/plans/2026-07-24-plan-f-phase2-operations.md`

| Wave | Status | Notes |
|------|--------|-------|
| **2A Inventory depth** | **GREEN (code)** | `stock_movements` + adjust RPC; confirm/cancel write ledger; API `/v1/inventory/*`; Web `/inventory`; catalog `stockQty` via ledger |
| 2B Carrier | Pending | |
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

**Next:** Wave 2B Carrier API.
