# Plan A DoD evidence

Date: 2026-07-24
Worktree: `feat/plan-a-platform-foundation`
Status: DONE_WITH_CONCERNS - automated gates green; Docker/Supabase/Inngest manual smoke not run locally.

## Environment note

- Local command shell reported Node `v24.5.0`; repo target is Node 20 (`.nvmrc`).
- `pnpm test` initially failed before running `@omni/web` tests with Vitest 4.1.10:

```text
@omni/web:test: TypeError [ERR_PACKAGE_IMPORT_NOT_DEFINED]: Package import specifier "#module-evaluator" is not defined
Failed: @omni/web#test
```

Remediation: aligned `apps/web` to Vitest `^3.2.7`, matching the other workspace test packages. The root test gate passed after the change.

## Automated gate results

### `pnpm lint`

Result: PASS. Note: current package lint scripts are tsc-only (`tsc --noEmit`) for `@omni/api` and `@omni/web`.

```text
> omni-commerce@ lint ...\plan-a-platform
> turbo run lint
Packages in scope: @omni/api, @omni/authz-types, @omni/db, @omni/web
@omni/api:lint: > tsc --noEmit
@omni/web:lint: > tsc --noEmit
Tasks:    2 successful, 2 total
```

### `pnpm typecheck`

Result: PASS.

```text
> omni-commerce@ typecheck ...\plan-a-platform
> turbo run typecheck
Packages in scope: @omni/api, @omni/authz-types, @omni/db, @omni/web
@omni/authz-types:typecheck: > tsc --noEmit
@omni/db:typecheck: > tsc --noEmit
@omni/web:typecheck: > tsc --noEmit
@omni/api:typecheck: > tsc --noEmit
Tasks:    4 successful, 4 total
```

### `pnpm test`

Result: PASS after Vitest alignment.

```text
> omni-commerce@ test ...\plan-a-platform
> turbo run test
@omni/web:test:  Test Files  1 passed (1)
@omni/web:test:       Tests  1 passed (1)
@omni/db:test:  Test Files  1 passed (1)
@omni/db:test:       Tests  1 passed (1)
@omni/api:test:  Test Files  12 passed (12)
@omni/api:test:       Tests  28 passed (28)
@omni/authz-types:test:  Test Files  1 passed (1)
@omni/authz-types:test:       Tests  6 passed (6)
Tasks:    4 successful, 4 total
```

### `pnpm test:isolation`

Result: PASS.

```text
> omni-commerce@ test:isolation ...\plan-a-platform
> pnpm --dir apps/api exec vitest run --root ../../tests/isolation cross-tenant.org.spec.ts
RUN  v3.2.7 .../tests/isolation
PASS cross-tenant.org.spec.ts (3 tests) 159ms
Test Files  1 passed (1)
Tests  3 passed (3)
```

### `cd apps/ai && uv run pytest -q`

Result: PASS with existing deprecation warnings.

```text
..                                                                       [100%]
2 passed, 2 warnings in 0.19s
```

Warnings observed: Starlette `httpx` deprecation and Pydantic class-based config deprecation.

### `cd apps/ai && uv run python ../../tests/eval/run_stub.py`

Result: PASS.

```text
ok:10
```

## Manual smoke

| Smoke item | Result | Reason |
| --- | --- | --- |
| `supabase start` + migrate | NOT RUN | Docker/Supabase services unavailable in this gate environment |
| `pnpm --filter @omni/api dev` -> `/health` `/ready` | NOT RUN | Requires local dev server smoke with Supabase env |
| `uv run uvicorn app.main:app --port 8000` -> `/health` | NOT RUN | Requires long-running local dev server |
| `pnpm --filter @omni/web dev` -> VI shell | NOT RUN | Requires long-running local dev server |
| Insert outbox noop -> Inngest receives | NOT RUN | Requires Docker/Supabase plus Inngest dev service |
| `GET /internal/v1/ai/health` with service key | NOT RUN | Requires API and AI dev servers running together |

## M2 hook checklist

| M2 item | Result | Evidence |
| --- | --- | --- |
| Security headers | GREEN | `apps/web/next.config.ts`; `apps/api/src/common/middleware/security-headers.middleware.ts` |
| Dependabot | GREEN | `.github/dependabot.yml` |
| Idempotency-Key middleware | GREEN | `apps/api/src/common/middleware/idempotency.middleware.ts` |
| PII redacting logger | GREEN | `apps/api/src/common/logging/redacting-logger.ts`; root tests PASS |
| Outbox same-TX helper | GREEN | `apps/api/src/jobs/outbox.publisher.ts` `enqueueOutbox()` inserts `outbox_events`; migration table exists |
| traceparent | GREEN | API middleware + internal AI proxy + AI `/health` echo tests pass |
| prompt_version / allowlist | GREEN | `AI_MODEL_ALLOWLIST` env/config present; future `ai_runs` rule documented in maturity spec |
| kill_ai_outbound | GREEN | Seeded in `supabase/seed/dev.sql`; feature flag tests pass |
| Runbooks | GREEN | `docs/runbooks/` |
| >=10 adversarial eval files | GREEN | `uv run python ../../tests/eval/run_stub.py` -> `ok:10` |
| AI draft max amount policy | GREEN | `settings_json` migration comment plus `DEFAULT_AI_DRAFT_MAX_AMOUNT_VND=5000000` API config constant |

## DoD summary

| DoD item | Result |
| --- | --- |
| Structure tree matches structure doc sections 1-4 | GREEN |
| Identity migration + RLS + platform_admins + outbox_events + kill-switches | GREEN |
| Nest health/ready + FastAPI health + Next VI shell placeholder | GREEN by code/tests; live smoke NOT RUN |
| CI workflows + Dependabot + gitleaks | GREEN |
| `.env.example` + README run-all-three | GREEN |
| M2 hooks | GREEN |
| Eval folder with >=10 adversarial prompt files | GREEN |
| Isolation tests prove cross-tenant denial | GREEN |
| Sample outbox -> Inngest no-op E2E locally | AMBER: NOT RUN, no Docker/Supabase/Inngest services |
| API can HTTP-GET AI `/health` with service key + traceparent | AMBER: unit/pytest GREEN; live two-service smoke NOT RUN |
