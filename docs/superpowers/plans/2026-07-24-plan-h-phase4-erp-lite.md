# Plan H — Phase 4 ERP-lite (Waves 4A–4F)

> Implement one wave at a time and update `plan-h-dod-evidence.md` after each wave with honest GREEN/AMBER/RED status.

**Status:** DONE — CPC engineering path READY with live-ops AMBERs
**Depends on:** Plan G DONE (`plan-g-dod-evidence.md`)  
**Next:** Plan I M4 only after Plan H DoD  
**Playbook:** [plan-h-priority-execution](./2026-07-24-plan-h-priority-execution.md)

## Plan H Definition of Done

- [x] 4A–4F waves complete with tests/evidence.
- [x] OpenAPI reflects every new public Core endpoint.
- [x] Tenant isolation/RLS preserved for all new tables and functions.
- [x] CPC checklist updated; no E100 claim.

## 4A — Multi-warehouse

- [x] Create `warehouses` with `org_id`, unique `(org_id, code)`, and one default MAIN warehouse per org.
- [x] Create `variant_stocks` with unique `(warehouse_id, variant_id)` and backfill from `product_variants.stock_qty`.
- [x] Add nullable `warehouse_id` to `stock_movements`; extend movement types with `transfer_out` and `transfer_in`.
- [x] Implement atomic `transfer_stock` RPC that writes two ledger rows and syncs `product_variants.stock_qty` to the sum of `variant_stocks`.
- [x] Add Nest `warehouses` module:
  - `GET /v1/warehouses`
  - `POST /v1/warehouses`
  - `GET /v1/warehouses/:id/stock`
  - `POST /v1/warehouses/transfer`
- [x] Enforce `catalog.read` for reads and `catalog.write` for creates/transfers.
- [x] Add web `/warehouses` VI list + transfer form and nav link.
- [x] Add tests and update OpenAPI/evidence.

## 4B — Supplier & PO

- [x] Suppliers table + CRUD.
- [x] Purchase order draft/submit/receive flow.
- [x] Receiving posts inbound stock to selected warehouse with ledger trace.
- [x] VI supplier/PO UI.

## 4C — E-invoice

- [x] Provider abstraction and stub config.
- [x] Issue invoice path with DLQ/error capture.
- [x] Order/invoice linkage via `einvoice_jobs.order_id`.
- [x] Runbook for provider outage and retry.

## 4D — Staff mobile

- [x] Thin PWA/mobile-friendly inbox and shipment flows.
- [x] Role-safe shortcuts use existing API permissions.
- [x] Web typecheck covers mobile route; live device smoke remains AMBER.

## 4E — Accounting export

- [x] Export order, COGS, shipment fee, COD, and ad spend detail in accountant-friendly CSV.
- [x] Preserve integer money fields and stable column names.
- [x] Document import assumptions.

## 4F — CPC hardening

- [x] Regression pass across Plans E–H.
- [x] DR/restore evidence referenced; paid live restore remains AMBER.
- [x] CPC checklist and API freeze notes.
- [x] Final `plan-h-dod-evidence.md` verdict.

## Out of scope

- E100 claim before Plan I.
- Plan I procurement/security/compliance work.
- Public marketplace or agency multi-org features.
