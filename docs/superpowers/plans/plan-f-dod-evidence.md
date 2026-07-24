# Plan F (Phase 2) — Definition of Done Evidence

**Date:** 2026-07-25  
**Branch:** `feat/plan-f-phase2`  
**Scope:** `docs/superpowers/plans/2026-07-24-plan-f-phase2-operations.md`

| Wave | Status | Notes |
|------|--------|-------|
| **2A Inventory depth** | **GREEN (code)** | `stock_movements` + adjust RPC; confirm/cancel write ledger; API `/v1/inventory/*`; Web `/inventory`; catalog `stockQty` via ledger |
| **2B Carrier** | **GREEN (code)** | Shipping provider interface; encrypted per-org connections; manual + GHN sandbox/mock providers; shipment API + VI order action; export fallback runbook |
| **2C COD** | **GREEN (code)** | COD expectations/collections/discrepancies; report + reconcile APIs; VI `/cod`; bigint-string VND only |
| **2D Returns** | **GREEN (code)** | `return_order` RPC; `order_returns`; `return_restock` ledger movement; COD open write-off/discrepancy note; API + VI order action |
| **2E P&L** | **GREEN (code)** | Variant `cogs_vnd`; order item `cogs_unit_vnd` snapshot; API `/v1/pnl/summary` + `/v1/pnl/by-sku`; VI `/pnl`; CSV download |
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

## 2C evidence

| Item | Status | Evidence |
|------|--------|----------|
| COD schema + RLS | GREEN | `supabase/migrations/20260727110000_cod_reconciliation.sql` |
| Expected COD on ship | GREEN | `OrdersService.shipOrder` and `ShippingService.createShipment` call `CodService.ensureExpectationForOrder` for shipped COD orders |
| Expected amount choice | GREEN | Uses `orders.total_vnd` consistently; shipping fee remains tracked separately as `shipping_fee_vnd`/shipment fee |
| Collections + reconcile | GREEN | `POST /v1/cod/collections`, `POST /v1/cod/reconcile`, `POST /v1/cod/reconcile/batch` |
| Report API + VI | GREEN | `GET /v1/cod/report`; `apps/web/src/app/(app)/cod/page.tsx`; nav link `COD` |
| No float money | GREEN | DB `bigint`; API accepts/returns VND strings matching `^[0-9]+$` or signed delta strings |
| Audit money events | GREEN | COD expectation upsert, collection record, and reconcile write audit logs |
| API unit tests | GREEN | `apps/api/src/modules/cod/cod.service.spec.ts` plus shipping expectation hook spec |

## 2D evidence

| Item | Status | Evidence |
|------|--------|----------|
| Returns schema + RLS | GREEN | `supabase/migrations/20260727120000_order_returns.sql` |
| Returned status RPC | GREEN | `return_order` allows `shipped`/`done`, records one return per order, and is idempotent once status is `returned` |
| Return restock ledger | GREEN | `private.apply_order_stock_change(..., 'return_restock', ...)` restores item qty and writes `stock_movements` |
| COD returned handling | GREEN | RPC writes off `open` COD expectations; leaves `matched`; leaves `discrepancy` open with a return note; API calls `CodService.handleReturnedOrder` |
| API endpoint | GREEN | `POST /v1/orders/:orderId/return` (`orders.write`) with `{ reason?, restock?: true }`; OpenAPI updated |
| Web VI | GREEN | Orders page shows `Hoàn hàng` for `shipped`/`done` orders |
| API unit tests | GREEN | `OrdersService` return/restock RPC mock test included in `pnpm --filter api test` |

## 2E evidence

| Item | Status | Evidence |
|------|--------|----------|
| COGS schema | GREEN | `supabase/migrations/20260727130000_simple_pnl.sql` adds `product_variants.cogs_vnd` and `order_items.cogs_unit_vnd` as non-negative BIGINT VND |
| COGS snapshot | GREEN | Order RPC payloads and `OrdersService.resolveOrderItems` copy current variant `cogs_vnd` into `order_items.cogs_unit_vnd` |
| Catalog COGS input | GREEN | `UpdateVariantBodySchema.cogsVnd`; `CatalogService.updateVariant`; web catalog SKU form/table |
| P&L API | GREEN | `GET /v1/pnl/summary?from=&to=` and `GET /v1/pnl/by-sku?from=&to=` protected by `orders.read` |
| Gross profit math | GREEN | Revenue/COGS/gross profit computed with `bigint`, returned as VND strings; sold statuses limited to `shipped`/`done` |
| Web VI + export | GREEN | `/pnl` date filters, day/SKU tables, client-side CSV download; nav `Lãi gộp` |
| OpenAPI | GREEN | `packages/contracts/openapi.yaml` includes P&L paths and COGS fields |
| API unit tests | GREEN | `pnpm --filter api test` — 128 passing; `apps/api/src/modules/pnl/pnl.service.spec.ts` covers summary and SKU aggregate math |

**Next:** Wave 2F Channel #2.
