### Task 5: C4 Orchestrator process-message

- Added `POST /internal/v1/ai/process-message` with service-key auth.
- Added grounded orchestrator with prompt `v1_grounded_process_message`.
- AI embeds the message, retrieves org-scoped top-k chunks from Core, and answers only with retrieved context.
- Empty retrieval returns `escalate=true`, no citations, no tool calls, and skips the LLM.
- Response shape: `replyText`, `citations`, `toolsUsed`, `promptVersion`, `model`, `tokens`, `escalate`.
- Added Core `POST /internal/v1/knowledge/retrieve` and `retrieve_knowledge_chunks` RPC for service-role-only vector search.
- Added mocked pytest coverage for grounded answer, no-context escalation, route auth.
- Added API service tests for retrieval RPC payload and embedding validation.

Verification:
- `apps/ai/.venv/Scripts/python.exe -m pytest` -> 13 passed
- `pnpm --dir apps/api typecheck` -> passed
- `pnpm --dir apps/api test` -> 77 passed
- `git diff --check` -> passed
# Task 5 Report — B4 Webhook verify + ingest

## Status

Completed.

## Implementation

- Added `GET /v1/webhooks/meta` subscription verification.
  - Returns the `hub.challenge` as `text/plain` only when `hub.mode=subscribe` and `hub.verify_token` matches `META_VERIFY_TOKEN`.
  - Returns 401 for invalid verification input.
- Added `POST /v1/webhooks/meta` ingestion.
  - Verifies `x-hub-signature-256` with `verifyMetaSignature` and `META_APP_SECRET` against the raw request body.
  - Builds `receipt_key` from the first message `mid`, falling back to `entry[0].id-entry[0].time`.
  - Hashes the raw payload and stores a `webhook_receipts` row with conflict-ignore semantics.
  - Maps `org_id` from active `channel_connections.external_page_id` for provider `meta_page`.
  - Enqueues `meta.inbound` through `enqueueOutbox` only when the receipt insert is new and an org mapping exists.
  - Does not call LLM/AI services or Meta Graph send APIs.
- Enabled Nest raw body capture with `rawBody: true`.
- Skipped `/v1/webhooks/meta` in both `JwtAuthGuard` and `OrgGuard`.
- Registered webhook controller/service in `ChannelsModule`.
- Added OpenAPI contract stub entries for the public Meta webhook GET/POST endpoints.

## Tests

- Added `meta-webhook.service.spec.ts` covering:
  - verify challenge success
  - bad signature rejection
  - one-time outbox enqueue for a new receipt
  - fallback receipt key from entry id/time
  - duplicate receipt suppression
- Added guard specs proving JWT/org guards skip `/v1/webhooks/meta`.

## Verification

- `pnpm --dir "apps/api" exec vitest run src/modules/channels/meta-webhook.service.spec.ts src/common/guards/jwt-auth.guard.spec.ts src/common/guards/org.guard.spec.ts`
  - 3 files passed, 15 tests passed.
- `pnpm --dir "apps/api" run typecheck`
  - Passed.
- `pnpm --dir "apps/api" test`
  - 17 files passed, 50 tests passed.

## Concerns / Notes

- Unknown/unmapped page IDs are acknowledged with `{ ok: true }` after receipt recording, but no outbox event is enqueued because `outbox_events.org_id` is required.
- If a Meta payload contains entries for multiple page IDs, this implementation maps to the first active matching `meta_page` connection and writes one receipt/outbox event for the payload, matching the task's single-receipt flow.

## Review Fixes — Atomicity and Tenant Routing

- Added `public.record_meta_webhook_receipt_and_enqueue(...)`, a service-role-only `security definer` RPC that inserts `webhook_receipts` and `outbox_events` in one Postgres transaction with event name `meta.inbound`.
- Updated Meta ingestion to process each Meta `entry` independently, resolve `org_id` by that entry's active `channel_connections.external_page_id`, and pass a single-entry payload to the RPC.
- Unmapped page entries are still receipted with `org_id = null` and intentionally create no outbox event because there is no tenant-safe destination.
- Removed the cross-page `.limit(1)` routing path and added tests for RPC/atomic failure behavior plus multi-page/two-org routing.

### Verification commands/output

- `pnpm --dir "apps/api" exec vitest run src/modules/channels/meta-webhook.service.spec.ts`
  - `Test Files  1 passed (1)`
  - `Tests  8 passed (8)`
- `pnpm --dir "apps/api" exec vitest run src/common/guards/jwt-auth.guard.spec.ts src/common/guards/org.guard.spec.ts src/common/guards/platform-admin.guard.spec.ts src/common/guards/service-key.guard.spec.ts src/modules/authz/permissions.guard.spec.ts`
  - `Test Files  5 passed (5)`
  - `Tests  16 passed (16)`
- `pnpm --dir "apps/api" test`
  - `Test Files  17 passed (17)`
  - `Tests  53 passed (53)`
- `pnpm --dir "apps/api" lint`
  - `tsc --noEmit` passed.
