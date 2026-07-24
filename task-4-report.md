# Task 4 Report - D3 Web auth shell + org switcher

## Summary
- Added Vietnamese `/login` and `/signup` auth shell pages. `apps/web` does not depend on `@supabase/ssr`, so the shell stores a user access token plus organization list in localStorage.
- Added app shell org switcher backed by `omni.organizations` and `omni.activeOrgId`; org-scoped API calls continue to inject `X-Org-Id` through `buildApiHeaders`.
- Added invites settings UI wired to `POST /v1/orgs/:orgId/invites`. The API has no invite-list endpoint yet, so the page documents the TODO and lists invites created in the current browser session.
- Added token-only organization fetch support for `GET /v1/orgs` and kept web env usage limited to `NEXT_PUBLIC_API_BASE_URL`.

## Verification
- `pnpm --dir apps/web typecheck`
- `rg` scan in `apps/web` found no `NEXT_PUBLIC_*` service-role, Meta, or LLM key patterns.
