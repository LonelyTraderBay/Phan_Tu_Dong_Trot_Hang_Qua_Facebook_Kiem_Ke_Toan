### Task 3: Knowledge reindex job -> AI embed

Status: completed.

Implemented:
- Added explicit outbox mapping `knowledge.reindex` -> `knowledge/reindex`.
- Added `knowledge-reindex` Inngest function in `apps/api` that validates org/source, builds product knowledge text, and calls AI `POST /internal/v1/reindex` with `X-Service-Key`.
- Added Core internal ingest endpoint `POST /internal/v1/knowledge/chunks` that service-key protects org-scoped replacement of `knowledge_chunks`.
- Added AI FastAPI reindex route, Gemini `text-embedding-004` embedding adapter, Core callback client, chunking, content hashing, and 768-dimension enforcement.

Verification:
- `pnpm --dir apps/api exec vitest run src/jobs/outbox.publisher.spec.ts src/jobs/functions/knowledge-reindex.spec.ts src/modules/internal/knowledge-ingest.service.spec.ts`
- `pnpm --dir apps/api typecheck`
- `python -m pytest apps/ai/tests`
- `pnpm --dir apps/api test`
- `git diff --check`

Concerns:
- Core replacement is implemented as delete-then-insert via the internal service endpoint as requested; a future RPC can make this fully transactional if needed.

---

### Review fixes - important findings

Status: completed.

Implemented:
- Added `replace_knowledge_chunks` SQL RPC for atomic delete+insert by `(org_id, source_type, source_id)`.
- Added unique constraint on `(org_id, source_type, source_id, chunk_index)`.
- Updated Nest knowledge ingest to verify product ownership/non-deleted state before replacement and call the RPC.
- Added `/internal/v1/knowledge/chunks` to `packages/contracts/openapi.yaml`.
- Switched AI reindex service-key check to `hmac.compare_digest`.

Verification:
- `pnpm --dir apps/api exec vitest run src/modules/internal/knowledge-ingest.service.spec.ts src/jobs/functions/knowledge-reindex.spec.ts` (pass, 6 tests)
- `python -m pytest tests/test_reindex.py` in `apps/ai` (pass, 3 tests, existing warnings)
- `pnpm --dir apps/api run typecheck` (pass)

---

### Re-review fix - soft-deleted product chunk purge

Status: completed.

Implemented:
- Empty-chunk replace (purge) skips `deleted_at IS NULL` on product ownership check so reindex after soft-delete can clear `knowledge_chunks`.
- Non-empty ingest still requires a live (non-deleted) product.

Verification:
- `pnpm --dir apps/api exec vitest run src/modules/internal/knowledge-ingest.service.spec.ts` (pass, 5 tests)
