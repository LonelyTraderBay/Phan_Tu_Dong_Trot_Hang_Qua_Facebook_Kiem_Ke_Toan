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
