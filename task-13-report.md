# Task 13 Report
Status: DONE_WITH_CONCERNS
- Added CI-ready Nest HTTP isolation tests under `tests/isolation`.
- Proves userA + `X-Org-Id=orgB` is denied 403.
- Proves userA + `X-Org-Id=orgA` is allowed 200.
- Proves real identity invite path denies orgB before writes.
- Added root `test:isolation` and `ci-isolation.yml`.
- Verified: `pnpm test:isolation` PASS (3 tests); isolation tsc PASS.
Concern: full multi-user Supabase RLS E2E needs Docker/test fixtures.
