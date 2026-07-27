# Changelog

## 2026-07-28 — Wave P0.5b money-correctness fixes

Three defects found by the 2026-07-27 code↔docs audit, all of which reported
success while producing wrong money. **Breaking for P&L consumers.**

- **P&L net profit now subtracts shipping.** `netProfitVnd` was `grossProfit − adSpend`,
  omitting shipping entirely and overstating profit; it also disagreed with the
  accounting export, which does read shipping. `PnlProfitAggregate` gains a required
  `shippingVnd`, and `netProfitVnd` is now `gross − shipping − ads`. `/pnl` shows a
  "Phí vận chuyển" column and the card is relabelled "Lãi ròng" (was "Lãi sau ads").
- **P&L and accounting export no longer truncate silently.** Both fetched
  `.limit(10_000)` with **no date predicate** and filtered in Node, so any org past
  10k sold orders received a partial — not empty — financial report. Added the
  generated column `orders.sold_at` (`coalesce(done_at, shipped_at, created_at)`)
  plus `orders_org_status_sold_at_idx`; the range is now a SQL predicate and results
  are paged to exhaustion.
- **GHN provider fails closed.** Without `config.sandboxUrl` it fabricated
  `GHN-MOCK-*` with `feeVnd: 0`, wrote that zero onto `orders.shipping_fee_vnd`,
  advanced the order to `shipped`, and opened a COD expectation — for a parcel that
  never existed. It now throws `carrier_not_configured` unless the org explicitly
  sets `config.allowMock: true`, and a mock result is flagged `isMock` so
  `ShippingService` records the shipment for traceability but touches neither the
  shipping fee, nor order status, nor COD (`shipment.created_mock` audit action).

Verified: API 191 tests · isolation 8/8 against live local Supabase · `supabase db reset`
replays all 30 migrations · `sold_at` recompute proven on real Postgres.

## 2026-07-25 — Plan H Phase 4 ERP-lite

- Completed Plan H engineering path for multi-warehouse stock, supplier/PO receiving, stub e-invoice jobs, staff mobile PWA surface, and accounting CSV export.
- Added `receive_po` inbound stock RPC, `/suppliers`, `/purchase-orders`, `/einvoice`, `/m`, and `/v1/accounting/export`.
- CPC engineering path is READY with honest AMBERs for Plan E paid ops, live carrier, Zalo worker/OAuth, real e-invoice provider, and owner-run Meta/staging tasks.
- E100 is not claimed; Plan I remains next.

## 2026-07-25 — Plan G Phase 3 Intelligence

- Completed Plan G engineering path for ads spend/P&L, attribution, owner advisor, content calendar, public API keys, signed webhook test pings, and hardening docs.
- Added `/calendar` Vietnamese UI and `/v1/content-calendar` CRUD; auto-post remains a stored flag only and does not send to Meta.
- Added minimal Public API docs and endpoints for owner-managed `omni_` keys, read-only public orders, and webhook test pings.
- CPC is not claimed; Plan H remains next.

## 2026-07-25 — Plan F Phase 2 Operations

- Completed Plan F engineering path for inventory ledger, carrier shipment creation, COD reconciliation, returns, simple P&L, Zalo OA skeleton, billing packaging, and hardening docs.
- Added Phase 2 operations checklist and lightweight load-test notes.
- CPC is not claimed; Plan G, Plan H, and Plan E paid/live AMBER items remain required.
