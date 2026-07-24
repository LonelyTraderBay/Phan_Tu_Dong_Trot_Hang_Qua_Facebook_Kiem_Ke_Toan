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
