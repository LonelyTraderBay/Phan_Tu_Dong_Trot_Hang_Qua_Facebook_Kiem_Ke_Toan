# Phase 2 operations checklist

Use this checklist before and during a Phase 2 pilot ops shift. Record the org, operator, timestamp, issue, action, and outcome in the normal ops log.

## Inventory

- Check **Inventory** low-stock list before confirming a batch of orders.
- Adjust stock only through the inventory adjust flow; include a short reason.
- If a confirm/cancel/return stock number looks wrong, inspect recent `stock_movements` before editing catalog data.

## Shipping

- Confirm the carrier connection is enabled and credentials are present before using GHN.
- If carrier creation fails, use the manual shipment path and the Excel export fallback.
- Keep shipping fees in integer VND and verify the order `shipping_fee_vnd` matches the shipment fee.

## COD

- After shipping COD orders, check the COD report for expected rows.
- Reconcile carrier collections in batches, then review discrepancies before marking them resolved.
- Do not manually delete COD events; use reconciliation status and notes.

## Returns

- Return only `shipped` or `done` orders through the order return action.
- Decide whether to restock during the return action; restock must create `return_restock` ledger rows.
- For COD discrepancies, keep the return note attached until finance decides the write-off or collection path.

## P&L

- Update SKU COGS before the selling period when possible; order items snapshot the current value.
- Use `/pnl` day and SKU views for gross profit checks, then export CSV when finance needs a handoff.
- Treat missing COGS as an ops data issue, not a money math bug.

## Zalo

- Connect Zalo OA with an existing access token in **Settings -> Channels**.
- If `ZALO_WEBHOOK_SECRET` is configured, verify inbound calls include the matching header.
- Current production status is AMBER until full Zalo OAuth and message persistence worker are implemented.

## Billing

- Use the billing settings page for current plan, meters, invoices, and payment instructions.
- Ops invoices must be issued through `/ops/v1/orgs/:orgId/invoices`.
- If an org is `past_due` or `suspended`, auto-confirm is softly gated; resolve billing before re-enabling.
