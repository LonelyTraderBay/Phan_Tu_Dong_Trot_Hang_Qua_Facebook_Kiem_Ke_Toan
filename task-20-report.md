Status: DONE_WITH_CONCERNS
Green: pnpm lint (tsc-only), pnpm typecheck, pnpm test, pnpm test:isolation.
Green: apps/ai `uv run pytest -q` and eval stub `ok:10`.
Green: M2 checklist documented in `docs/superpowers/plans/plan-a-dod-evidence.md`.
Green: API config now exports `DEFAULT_AI_DRAFT_MAX_AMOUNT_VND = 5_000_000`.
Green: README quality checks now include isolation and AI pytest.
Amber: manual Docker/Supabase/Inngest smoke NOT RUN (no Docker/dev services).
Amber: live API->AI health smoke NOT RUN; unit/pytest traceparent evidence is green.
Note: `pnpm test` initially hit Vitest 4 web startup issue; fixed by aligning web to Vitest 3.
