# Task 9 Report — D8 Rate limits

- Task 8 (PDPA D7): still pending; no `app.module` conflict — wired via `main.ts` + `InternalModule`.
- In-memory fixed-window limiter with env config (`RATE_LIMIT_*`, defaults: auth 30/min, webhook 200/min, tools 60/min per org).
- Middleware: `/v1/orgs*`, Meta OAuth paths, `/v1/webhooks/meta` → 429 `rate_limit_exceeded` + ProblemDetails + `Retry-After`.
- `ToolsRateLimitGuard` on `/internal/v1/tools/*` keyed by `orgId`.
- Tests: limiter, middleware, guard (7 new cases); full API suite 105 passed.
- Verification: `pnpm --dir apps/api test` pass; typecheck has pre-existing `orders.service.ts` error unrelated to this task.
