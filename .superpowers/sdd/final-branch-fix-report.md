# Final Branch Fix Report

## 2026-07-24 Plan A review fixes

- Added additive migration `20260724193000_harden_control_plane_and_org_bootstrap.sql`.
  - Revokes authenticated/anon `insert`, `update`, and `delete` on foundation control-plane tables.
  - Drops broad member update policies while preserving authenticated `select` grants for user-scoped reads.
  - Documents that browsers never use service-role and Core/Nest uses service-role only after authz.
  - Adds `public.create_organization_with_owner(...)` RPC for atomic org + owner membership + entitlements bootstrap, executable only by `service_role`.
- Updated `IdentityService.createOrganization()` to call the atomic RPC.
- Wired `OutboxPublisher.publishPending()` to a 2s interval via Nest module lifecycle hooks outside `NODE_ENV=test`, with shutdown cleanup and overlap protection.
- Updated AI `/health` to remain public when `X-Service-Key` is absent, return 401 when present and wrong, and allow correct-key requests with traceparent echo.
- Added `tests/isolation/README.md` and a skipped direct Supabase RLS E2E placeholder documenting the required Docker-backed coverage before Plan B Meta.

## Verification

- `pnpm --filter @omni/api test` - passed, 12 files / 29 tests.
- `pnpm test:isolation` - passed, 3 tests / 1 skipped.
- `cd apps/ai && uv run pytest -q` - passed, 4 tests; warnings only from existing FastAPI/httpx and Pydantic config deprecations.
- Additional sanity: `pnpm --filter @omni/api typecheck` - passed.

## Remaining concerns

- Direct Docker-backed Supabase RLS E2E is still required before Plan B Meta; current branch documents it and includes a skipped placeholder only.
