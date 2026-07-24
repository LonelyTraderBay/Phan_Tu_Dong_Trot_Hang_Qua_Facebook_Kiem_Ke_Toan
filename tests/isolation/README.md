# Isolation tests

`cross-tenant.org.spec.ts` covers the Nest `OrgGuard` path with mocked
membership lookups. It proves API requests cannot use another tenant's org
context before application writes run.

Before Plan B Meta work starts, this gate must include Docker-backed Supabase
RLS E2E coverage using real anon/authenticated clients against migrated local
Postgres. At minimum, the RLS suite should prove a user who belongs to org A
cannot directly read or mutate org B rows through the Supabase Data API, and
cannot update control-plane tables such as `memberships`, `entitlements`, or
`feature_flags`.
