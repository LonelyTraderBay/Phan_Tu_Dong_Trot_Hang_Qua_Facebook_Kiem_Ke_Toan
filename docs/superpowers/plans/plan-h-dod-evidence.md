# Plan H DoD Evidence — Phase 4 ERP-lite

**Status:** IN PROGRESS  
**Branch:** `feat/plan-h-phase4`  
**Baseline:** Plan G DONE on `main` @ `3c9ed8c`  
**Rule:** Do not claim CPC until all Plan H waves close and owner-paid AMBER items are resolved.

## Wave status

| Wave | Status | Evidence |
|------|--------|----------|
| 4A Multi-warehouse | GREEN | `warehouses` + `variant_stocks` migration/RLS/backfill; `transfer_stock` RPC; API module; VI `/warehouses`; OpenAPI; API tests pass |
| 4B Supplier & PO | TODO | Not started |
| 4C E-invoice | TODO | Not started |
| 4D Staff mobile | TODO | Not started |
| 4E Accounting export | TODO | Not started |
| 4F CPC hardening | TODO | Not started |

## Verification log

- GREEN 4A: `pnpm --filter api test` — 45 files, 158 tests passed
- GREEN 4A: `pnpm --filter api lint` — passed
- GREEN 4A: `pnpm --filter web lint` — passed

## 4A endpoints

- `GET /v1/warehouses` — list org-scoped warehouses (`catalog.read`)
- `POST /v1/warehouses` — create org-scoped warehouse (`catalog.write`)
- `GET /v1/warehouses/:id/stock` — list per-warehouse variant stock (`catalog.read`)
- `POST /v1/warehouses/transfer` — atomic stock transfer and ledger rows (`catalog.write`)
- Web `/warehouses` — Vietnamese warehouse list/create, stock view, and transfer form

## Notes

- Wave 4A starts with one default `Kho chính` / `MAIN` warehouse per org and backfills `variant_stocks` from `product_variants.stock_qty`.
- `transfer_stock` writes `transfer_out` and `transfer_in` stock movements and syncs `product_variants.stock_qty` from the sum of warehouse stock rows.
- Existing order stock changes and manual inventory adjustments now target the default warehouse to keep the new stock ledger coherent.
- Plan H starts with multi-warehouse only. Supplier/PO, e-invoice, mobile, accounting export, and CPC hardening remain future waves.
- CPC is not claimed from Wave 4A.

## Verdict

Plan H is **IN PROGRESS** with Wave 4A GREEN.
