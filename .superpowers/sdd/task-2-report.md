## Task 2: C1 Catalog module CRUD

Status: Completed.

Changes:
- Added Nest catalog module under `apps/api/src/modules/catalog`.
- Implemented `/v1/catalog/products` list/get/create/update/soft-delete routes.
- Implemented nested product variant create/update/delete routes.
- Added service-role Supabase writes scoped by `org_id`.
- Enqueued `knowledge.reindex` outbox events for product and variant writes.
- Normalized `priceVnd` to PostgreSQL bigint-compatible string values; floats are rejected.
- Wired `CatalogModule` into `AppModule`.
- Updated `packages/contracts/openapi.yaml` stubs for catalog paths.

Verification:
- `pnpm --dir apps/api exec vitest run src/modules/catalog/catalog.service.spec.ts`
- `pnpm --dir apps/api typecheck`
- `pnpm --dir apps/api test`

Notes:
- `backend_doc/START_HERE.md` was not present in this worktree; used available task brief, module patterns, migrations, authz types, and `packages/contracts/openapi.yaml`.
- Ran `pnpm install --frozen-lockfile` because dependencies were absent from the worktree.
