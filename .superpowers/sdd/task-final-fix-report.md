# Task Final Fix Report

## 2026-07-24 Plan B final blockers

- Fixed Instagram webhook tenant routing by resolving `object=instagram` entries through active `meta_ig.external_ig_id`, with active `meta_page.external_ig_id` as page-linkage fallback before the existing atomic receipt/outbox RPC.
- Added server-side Meta OAuth CSRF binding with single-use `oauth_states` rows scoped to `org_id`, `user_id`, random opaque state, and expiry; completion now requires `{ code, state }` and consumes state before exchanging the code.
- Updated the web callback/API client and OpenAPI contract to pass and require OAuth `state`.
- Verification: focused channel specs, `apps/api` typecheck, full `apps/api` test suite, and `apps/web` typecheck passed.
