Task 16 report
- Added ServiceKeyGuard for X-Service-Key and made /internal skip JWT/org user auth.
- Added GET /internal/v1/ai/health proxy forwarding SERVICE_M2M_KEY and traceparent.
- Added traceparent middleware generating 00-<32hex>-<16hex>-01 when missing.
- Updated AI /health to echo traceparent when present.
- Tests: pnpm --dir apps/api test; pnpm --dir apps/api typecheck; uv run pytest (apps/ai).
