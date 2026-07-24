# Task 9 Report

Status: DONE

Implemented:
- Added global JWT guard using Supabase `auth.getUser(jwt)`; skips `/health` and `/ready`.
- Added global OrgGuard requiring `X-Org-Id`, checking `memberships`, attaching `req.orgId` and `req.membership`.
- Added `@CurrentUser()` and `@OrgId()` decorators; OrgGuard skips `/ops/*` and `/internal/*`.
- Added TDD coverage for missing `X-Org-Id` (400) and membership miss (403).

Verification:
- `pnpm --filter @omni/api test -- src/common/guards/org.guard.spec.ts`
- `pnpm --filter @omni/api typecheck`; `pnpm --filter @omni/api test`; `pnpm typecheck`; `pnpm test`; `pnpm --filter @omni/api build`
