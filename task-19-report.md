# Task 19 report

- Reserved business module folders: `channels`, `catalog`, `inbox`, `orders`, `knowledge` (`.gitkeep` each).
- Added `apps/api/src/instrument.ts`; imported first in `main.ts`; init when `SENTRY_DSN` set.
- Added optional web `instrumentation.ts` and ai `instrument.py` with the same DSN-gated pattern.
- Dependencies: `@sentry/node` (api), `@sentry/nextjs` (web), `sentry-sdk` (ai).
- Verification: `pnpm --filter @omni/api typecheck` and `test` passed (28 tests).
- Verification: `pnpm --filter @omni/web typecheck` passed.
- Verification: `uv run pytest -q` in `apps/ai` passed (2 tests).
