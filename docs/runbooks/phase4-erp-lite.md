# Runbook — Phase 4 ERP-lite

## Scope

Plan H covers multi-warehouse stock, suppliers, purchase orders, stub
e-invoice jobs, staff mobile PWA surface, and accounting CSV export.

## Daily checks

1. Run `pnpm --filter api test` before release.
2. Spot-check `/warehouses`, `/suppliers`, `/purchase-orders`, `/einvoice`,
   `/m`, and `/pnl` with a pilot org.
3. Receive one PO into a non-default warehouse and verify:
   - `variant_stocks.qty` increased in that warehouse.
   - `stock_movements.movement_type = inbound` exists with
     `reason = receive_po:<po_id>`.
   - `product_variants.stock_qty` equals the sum of warehouse stock.
4. Issue one stub e-invoice for a `done` order and verify the job becomes
   `sent` with `attempts = 1`.
5. Download `/v1/accounting/export?format=csv` and confirm columns are
   `date,account_hint,amount_vnd,ref`.

## Guardrails

- Money remains integer VND strings. Do not introduce floating point.
- PO receiving must go through `receive_po`; do not mutate
  `variant_stocks` directly from application code.
- E-invoice provider is `stub` only. Live provider onboarding and sandbox E2E
  are AMBER until owner/vendor credentials exist.
- `/m` is a thin staff surface, not a full offline mobile app. Service worker is
  network-only.
- Accounting CSV is journal-like import aid, not a legal accounting subsystem.

## Incident response

### PO receive posted wrong warehouse

1. Stop further receives for the affected SKU.
2. Use `/warehouses` transfer to move stock from the wrong warehouse to the
   correct warehouse; this preserves ledger trace.
3. Add an ops note referencing the PO id and transfer movement ids.
4. If cost was wrong, create a corrective PO or inventory adjustment; do not
   edit historical stock movements.

### E-invoice jobs failing

1. Filter `/einvoice` by failed/dead status through API if needed.
2. For `failed` jobs, investigate `last_error`; current stub should normally
   succeed.
3. Jobs with `attempts >= 3` are dead-lettered (`dead`) and require manual
   replay after provider/runbook update.
4. Do not claim live tax invoice readiness until a real provider sandbox is
   integrated and tested.

### Accounting export mismatch

1. Confirm the date range and timezone expectation with the accountant.
2. Check source refs in the CSV: `order:*`, `shipment:*`, `cod:*`,
   `ad_spend:*`.
3. Reconcile against `/pnl` for sales/COGS/ad spend and `/cod` for COD cash.
4. If a source table is missing live data, mark the export AMBER for that org.

## Release evidence

- Required: `pnpm --filter api test`.
- Recommended: `pnpm --filter api lint`, `pnpm --filter web lint`.
- Evidence file: `docs/superpowers/plans/plan-h-dod-evidence.md`.
