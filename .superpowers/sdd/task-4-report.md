# Task 4 Report — B3 Channels module OAuth connect

## Status

Completed.

## Implementation

- Added `ChannelsModule` and registered it in `apps/api/src/app.module.ts`.
- Added `ChannelsController` routes:
  - `GET /v1/channels/meta/oauth-url` with `channels.connect`.
  - `POST /v1/channels/meta/complete` with `channels.connect`.
  - `GET /v1/channels` membership-only via global `OrgGuard`.
  - `POST /v1/channels/:id/revoke` with `channels.connect`.
- Added zod DTO parsing for `{ code }`.
- Added `ChannelsService` with:
  - Meta OAuth URL generation using Phase 1 scopes.
  - OAuth code exchange, token debug validation, managed page fetch.
  - `channel_connections` service-role upsert using encrypted page tokens only.
  - `meta_page` rows for pages and `meta_ig` rows when a page has an Instagram business account.
  - Token-free list/revoke DTO mapping in camelCase.
  - `channel.connected` audit writes on successful connection.
- Updated `packages/contracts/openapi.yaml` stub with the new channel endpoints.

## Security / tenancy notes

- No endpoint accepts `orgId` from request bodies; org context comes from global `OrgGuard` / `X-Org-Id`.
- Mutating routes require `channels.connect`; listing only requires org membership.
- Service reads select only non-token columns for DTOs.
- Stored page tokens are encrypted with `encryptToken(..., TOKEN_ENCRYPTION_KEY)`.
- Audit metadata excludes raw provider tokens.

## Verification

- `pnpm --dir "apps/api" exec vitest run src/modules/channels/channels.service.spec.ts` — passed, 4 tests.
- `pnpm --dir "apps/api" run typecheck` — passed.
- `pnpm --dir "apps/api" test` — passed, 15 files / 41 tests.
- `pnpm typecheck` — passed, 4 packages.
- `pnpm test` — passed, 4 packages.

## Concerns / follow-ups

- The backend skill references `backend_doc/START_HERE.md`, but that file/path was not present in this worktree.
- OAuth URL does not include a CSRF `state` parameter because the locked Task 4 interface only completes with `{ code }`.
- Meta App Review scope requirements may change; the Phase 1 scope list is commented in code as requested.
