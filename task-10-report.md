Task 10 complete.

- Added Nest identity module for org create/list and owner-only invite stub.
- `POST /v1/orgs` creates organization, owner membership, and entitlements row.
- `GET /v1/orgs` uses a user-scoped Supabase client with the validated JWT.
- Invite insert uses service role only after OrgGuard + owner role checks.
- OrgGuard skips only exact `POST /v1/orgs` and `GET /v1/orgs`.
- Added unit coverage for entitlements write and guard bootstrap exceptions.
- Verified: `pnpm --filter @omni/api test`
- Verified: `pnpm --filter @omni/api typecheck`
