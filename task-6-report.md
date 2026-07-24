# Task 6 Report: Web Catalog + Orders + Dashboard + Settings

## Completed

- Added web API client coverage for:
  - Catalog product CRUD and variant CRUD under `/v1/catalog/products`.
  - Orders list, confirm, cancel, ship under `/v1/orders`.
  - Orders export download for CSV/XLSX/PDF under `/v1/orders/export`.
- Replaced the dashboard placeholder with Vietnamese widgets for:
  - Draft/new orders.
  - Low-stock variants.
  - Needs-attention items from draft orders, low stock, and channel reauth issues.
- Added Vietnamese catalog page at `/catalog`:
  - Product list/detail.
  - Create/update/delete product.
  - Create/update/delete SKU variants with price and stock.
- Added Vietnamese orders page at `/orders`:
  - Status filter.
  - Confirm/cancel/ship actions.
  - CSV/XLSX/PDF export download.
- Added Vietnamese settings page at `/settings`:
  - `auto_confirm` and AI toggle UI.
  - Per-organization localStorage persistence.
  - Visible API-gap notice.
- Updated nav links for dashboard, inbox, catalog, orders, channels, settings, and invites.

## Verification

- `pnpm --dir apps/web typecheck` passed.
- Checked `NEXT_PUBLIC` usage: no secrets added; existing client exposure remains limited to `NEXT_PUBLIC_API_BASE_URL`.

## API Gap / Concern

- No org settings PATCH endpoint exists in the current API (`/v1/orgs` exposes create/list orgs and create invite only). Settings changes are therefore browser-local only until a backend endpoint such as `PATCH /v1/orgs/:orgId/settings` is added.
Task 6 complete.
- Added service-key POST /internal/v1/tools/get-product.
- Added service-key POST /internal/v1/tools/create-draft-order.
- Draft orders resolve variant price snapshots in Core and enforce org/env max VND.
- Added service-key POST /internal/v1/ai/runs and AiRunsService persistence.
- Added DEFAULT_AI_DRAFT_MAX_AMOUNT_VND env schema/example.
- Added minimal orders/order_items migration plus atomic create_draft_order RPC.
- Updated OpenAPI stubs for tools and ai_runs.
- Tests: draft max rejection and ai_runs write/model allowlist.
- Verified: focused Vitest, API typecheck, full API tests, OpenAPI Prettier check.

Spec review (e712106..b326a02): **Approved** — see `.superpowers/sdd/task-6-brief.md`.
