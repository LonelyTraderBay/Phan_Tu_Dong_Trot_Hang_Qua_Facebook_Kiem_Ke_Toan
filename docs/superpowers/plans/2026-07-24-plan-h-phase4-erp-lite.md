# Plan H — Phase 4 ERP-lite (Waves 4A–4F)

> Implement one wave at a time and update `plan-h-dod-evidence.md` after each wave with honest GREEN/AMBER/RED status.

**Status:** IN PROGRESS  
**Depends on:** Plan G DONE (`plan-g-dod-evidence.md`)  
**Next:** Plan I M4 only after Plan H DoD  
**Playbook:** [plan-h-priority-execution](./2026-07-24-plan-h-priority-execution.md)

## Plan H Definition of Done

- [ ] 4A–4F waves complete with tests/evidence.
- [ ] OpenAPI reflects every new public Core endpoint.
- [ ] Tenant isolation/RLS preserved for all new tables and functions.
- [ ] CPC checklist updated; no CPC claim before evidence closes.

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

- [ ] Suppliers table + CRUD.
- [ ] Purchase order draft/submit/receive flow.
- [ ] Receiving posts inbound stock to selected warehouse with ledger trace.
- [ ] VI supplier/PO UI.

## 4C — E-invoice

- [ ] Provider abstraction and sandbox config.
- [ ] Issue invoice path with DLQ/error capture.
- [ ] Order/invoice linkage and immutable audit.
- [ ] Runbook for provider outage and retry.

## 4D — Staff mobile

- [ ] Thin PWA/mobile-friendly inbox and shipment flows.
- [ ] Role-safe shortcuts for CSKH and kho users.
- [ ] Smoke tests for mobile layout-critical pages.

## 4E — Accounting export

- [ ] Export order, COD, stock, and invoice detail in accountant-friendly files.
- [ ] Preserve integer money fields and stable column names.
- [ ] Document import assumptions.

## 4F — CPC hardening

- [ ] Regression pass across Plans E–H.
- [ ] DR/restore evidence refreshed.
- [ ] CPC checklist and API freeze notes.
- [ ] Final `plan-h-dod-evidence.md` verdict.

## Out of scope

- CPC claim before 4A–4F close.
- Plan I procurement/security/compliance work.
- Public marketplace or agency multi-org features.
