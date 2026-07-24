# Plan H DoD Evidence — Phase 4 ERP-lite

**Status:** DONE — CPC engineering path READY (live ops AMBER)
**Branch:** `feat/plan-h-phase4`  
**Baseline:** Plan G DONE on `main` @ `3c9ed8c`  
**Rule:** Do not claim E100. CPC engineering can be marked ready with honest
AMBERs for paid/live operations.

## Wave status

| Wave | Status | Evidence |
|------|--------|----------|
| 4A Multi-warehouse | GREEN | `warehouses` + `variant_stocks` migration/RLS/backfill; `transfer_stock` RPC; API module; VI `/warehouses`; OpenAPI; API tests pass |
| 4B Supplier & PO | GREEN | `suppliers`, `purchase_orders`, `purchase_order_items`; `receive_po` RPC posts inbound stock movements and syncs `product_variants.stock_qty`; API `/suppliers`, `/purchase-orders`; VI `/suppliers`, `/purchase-orders`; focused service test |
| 4C E-invoice | GREEN/AMBER | `einvoice_jobs`; manual `POST /v1/einvoice/issue`; stub provider succeeds; failed jobs become `dead` after attempts >= 3; VI `/einvoice`; live provider sandbox remains AMBER |
| 4D Staff mobile | GREEN/AMBER | `/m` staff mobile inbox + ship surface; `manifest.webmanifest`; network-only `sw.js`; full offline/mobile app remains AMBER |
| 4E Accounting export | GREEN/AMBER | `GET /v1/accounting/export?from=&to=&format=csv`; journal-like `date,account_hint,amount_vnd,ref`; BIGINT strings; `/pnl` export button; accountant-specific mapping remains AMBER |
| 4F CPC hardening | GREEN/AMBER | Runbook `docs/runbooks/phase4-erp-lite.md`; CPC checklist; OpenAPI updated; CHANGELOG/path updated; live Plan E/carrier/Zalo/e-invoice ops remain AMBER |

## Verification log

- GREEN 4A: `pnpm --filter api test` — 45 files, 158 tests passed
- GREEN 4A: `pnpm --filter api lint` — passed
- GREEN 4A: `pnpm --filter web lint` — passed
- GREEN 4B-4F: `pnpm --filter api lint` — passed
- GREEN 4B-4F: `pnpm --filter api test` — 47 files, 160 tests passed
- GREEN 4B-4F: `pnpm --filter web lint` — passed

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
- `receive_po` is the required stock entry path for PO receipt. It writes `inbound`
  stock movements with `reason = receive_po:<po_id>`, updates warehouse stock, and
  syncs aggregate variant stock.
- E-invoice is a stub engineering path only. Real provider sandbox/live tax invoice
  readiness remains AMBER.
- Staff mobile is a thin PWA/admin route. Offline caching and native packaging are
  outside Plan H.
- Accounting export is journal-like CSV for import/reconciliation, not a full legal
  accounting subsystem.
- Live CPC AMBERs remain: Plan E paid ops, live carrier E2E, Zalo worker/OAuth,
  e-invoice real provider, Meta App Review/staging walkthrough.

## Verdict

Plan H is **DONE** for the engineering path. CPC engineering is **READY with
AMBERs** for live operations listed above. **E100 is not claimed**; Plan I remains
NEXT.
