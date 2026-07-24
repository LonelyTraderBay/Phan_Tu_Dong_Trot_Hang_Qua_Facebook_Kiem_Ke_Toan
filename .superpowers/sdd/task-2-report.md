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

Review fixes (atomic create + outbox):
- Added migration `20260725150000_catalog_create_product_atomic.sql` with `create_product_with_variants_and_reindex` RPC (security definer, service_role only). Inserts product, variants, and `knowledge.reindex` outbox row in one transaction.
- `CatalogService.createProduct` now calls the RPC; no separate variant insert or post-commit enqueue.
- Update/delete/variant writes still enqueue outbox after commit via `enqueueOutbox` (throws on failure — API returns 500; write may already be committed).
- Tests: RPC path for create; outbox failure propagation on update.

Notes:
- `backend_doc/START_HERE.md` was not present in this worktree; used available task brief, module patterns, migrations, authz types, and `packages/contracts/openapi.yaml`.
- Ran `pnpm install --frozen-lockfile` because dependencies were absent from the worktree.
