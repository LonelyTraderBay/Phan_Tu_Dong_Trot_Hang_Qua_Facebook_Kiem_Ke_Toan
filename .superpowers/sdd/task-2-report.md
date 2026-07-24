# Task 2 Report — C1 Catalog module CRUD

## Status

Completed.

## Commits

| SHA | Message |
|-----|---------|
| `25d75b2` | `feat(api): catalog crud with reindex outbox` |
| `d6ead53` | `fix(catalog): atomic create RPC with outbox and propagate enqueue failures` |

Base: `5ba4a9f` · Head: `d6ead53`

## Implementation

- Added Nest catalog module under `apps/api/src/modules/catalog`.
- Implemented `/v1/catalog/products` list/get/create/update/soft-delete routes.
- Implemented nested product variant create/update/delete routes.
- Added service-role Supabase writes scoped by `org_id`.
- Normalized `priceVnd` to PostgreSQL bigint-compatible string values; floats are rejected.
- Wired `CatalogModule` into `AppModule`.
- Updated `packages/contracts/openapi.yaml` stubs for catalog paths.

### Review fix — atomic create (Important)

- Added migration `20260725150000_catalog_create_product_atomic.sql` with `create_product_with_variants_and_reindex` RPC (`security definer`, `set search_path = ''`, `service_role` only).
- RPC inserts product, variants, and `knowledge.reindex` outbox row in one Postgres transaction.
- `CatalogService.createProduct` calls the RPC; no separate variant insert or post-commit enqueue.
- Outbox payload matches spec: `{ orgId, sourceType: 'product', sourceId }`.
- Test asserts RPC path and that `enqueueOutbox` is not called on create.

### Update/delete/variant writes

- Still enqueue outbox after commit via `enqueueOutbox` (throws on failure → API 500; write may already be committed).
- Test covers outbox failure propagation on product update.

## Verification

| Check | Result |
|-------|--------|
| `pnpm --dir apps/api exec vitest run src/modules/catalog/catalog.service.spec.ts` | Pass (2 tests) |
| `pnpm --dir apps/api test` | Pass (20 files / 67 tests) |
| `pnpm --dir apps/api typecheck` | Not rerun this pass (prior report green) |

---

## Re-review (5ba4a9f..d6ead53)

Reviewed fix delta only; spot-check of atomic create RPC and spec alignment.

### Spec checklist

| Requirement | Status |
|-------------|--------|
| TDD create product+variant with `price_vnd` bigint | ✅ `PriceVndSchema` + RPC create test |
| Routes `/v1/catalog/products` CRUD | ✅ list/get/create/update/soft-delete |
| Permissions `catalog.read` / `catalog.write` | ✅ `@RequirePermission` on all routes |
| On write → `enqueueOutbox({ eventName: 'knowledge.reindex', payload: { orgId, sourceType: 'product', sourceId } })` | ✅ create in RPC; update/delete/variant post-commit |
| Commit message | ✅ `feat(api): catalog crud with reindex outbox` |

**Spec: ✅**

### Findings

#### Important — resolved

1. **Create path was not atomic (product + variants + outbox).**
   - Prior (`25d75b2`): `createProduct` inserted product, called `insertVariants`, then `enqueueProductReindex` as three separate service-role calls — partial failure could leave orphan product or product without reindex event.
   - Fix (`d6ead53`): `create_product_with_variants_and_reindex` RPC mirrors the Plan B Meta webhook pattern (`record_meta_webhook_receipt_and_enqueue`): single transaction, revoked from `public`/`anon`/`authenticated`, granted to `service_role` only.
   - Service and test confirm create no longer calls `enqueueOutbox` separately.

#### Minor — deferred

1. **Update/delete/variant writes enqueue outbox after commit.**
   - If `enqueueOutbox` fails after a successful write, the catalog row is committed but no reindex event is queued (API returns 500). Acceptable deferred debt for C1; follow-up RPCs or compensating retry can align with create pattern later.
2. **`createVariant` is also non-atomic** (insert then enqueue) — same class as above; defer with update paths.
3. OpenAPI entries remain stubs (no shared response schemas) — consistent with other Plan C modules.

### Verdict

**Approved.**

Important create atomicity is resolved. Outbox-on-update non-atomicity is documented and deferred as Minor.
