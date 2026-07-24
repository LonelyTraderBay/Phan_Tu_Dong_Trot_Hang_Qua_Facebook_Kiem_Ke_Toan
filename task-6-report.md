## Fix section - Important review findings

- Added OpenAPI contract entries for:
  - `GET /v1/inbox/conversations`
  - `GET /v1/inbox/conversations/{id}/messages`
  - `POST /v1/inbox/conversations/{id}/takeover`
- Added `public.takeover_inbox_conversation(...)` RPC so takeover performs `bot_epoch = bot_epoch + 1` atomically in SQL and is executable only by `service_role`.
- Updated `InboxService` takeover to call the RPC and require `AuditService`; audit write failures now propagate instead of being silent.
- Persisted inbound text messages with `raw_type = 'text'`.

Verification:

- `pnpm --dir apps/api exec vitest run src/modules/inbox/inbox.service.spec.ts src/jobs/functions/meta-persist-inbound.spec.ts`
- `pnpm --dir apps/api test`
- `pnpm --dir apps/api typecheck`
