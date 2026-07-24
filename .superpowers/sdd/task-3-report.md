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
