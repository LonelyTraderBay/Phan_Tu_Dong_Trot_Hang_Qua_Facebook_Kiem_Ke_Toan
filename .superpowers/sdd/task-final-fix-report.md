# Plan C Final Merge Blocker Fix Report

## Fix 1: Soft-deleted product chunk purge

- Added migration `20260725223000_allow_soft_deleted_product_chunk_purge.sql`.
- `replace_knowledge_chunks` now permits empty chunk replacement for product rows that still belong to the org even when `deleted_at` is set.
- Non-empty product chunk replacement still requires a live product (`deleted_at is null`).
- Added Nest service coverage for rejecting purges when the product is missing from the org.

## Fix 2: Core tools in AI process-message loop

- Passed `conversationId`, `contactId`, `messageId`, `channel`, and `channelConnectionId` from Core inbound processing into AI `process-message`.
- Added AI Core client methods for service-key POSTs to `/internal/v1/tools/get-product` and `/internal/v1/tools/create-draft-order`.
- Added a minimal orchestrator tool loop:
  - calls `getProduct` for product/order intents grounded by a retrieved product chunk;
  - calls `createDraftOrder` only for clear order intent with one available variant;
  - keeps order mutation in Core and records `toolsUsed`;
  - includes Core tool results in the grounded prompt and bumps prompt version to `v2_grounded_process_message`.
- Added AI tests for mocked tool use and Core client service-key POST payloads.
- Added Core inbound test coverage for context forwarding.

## Verification

- `pnpm --dir "apps/api" test` - passed, 27 files / 93 tests.
- `uv run --directory "apps/ai" pytest` - passed, 20 tests.
- `pnpm test:eval` - passed, `ok:adversarial=10 golden=6`.
- `pnpm --dir "apps/api" typecheck` - passed.
# Task Final Fix Report

## 2026-07-24 Plan B final blockers

- Fixed Instagram webhook tenant routing by resolving `object=instagram` entries through active `meta_ig.external_ig_id`, with active `meta_page.external_ig_id` as page-linkage fallback before the existing atomic receipt/outbox RPC.
- Added server-side Meta OAuth CSRF binding with single-use `oauth_states` rows scoped to `org_id`, `user_id`, random opaque state, and expiry; completion now requires `{ code, state }` and consumes state before exchanging the code.
- Updated the web callback/API client and OpenAPI contract to pass and require OAuth `state`.
- Verification: focused channel specs, `apps/api` typecheck, full `apps/api` test suite, and `apps/web` typecheck passed.
