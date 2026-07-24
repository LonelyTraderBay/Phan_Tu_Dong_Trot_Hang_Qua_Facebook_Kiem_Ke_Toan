# Task 17 Report

## Delivered
- Workflows: `ci-web`, `ci-api`, `ci-ai`, `ci-isolation` (Node 20), `migrate-check` (Supabase start + db reset)
- `.github/dependabot.yml`: weekly npm, github-actions, pip (`apps/ai`)
- `.gitleaks.toml`: default rules + allowlist for docs/locks
- Stubs: `packages/contracts/openapi.yaml` (health/orgs/ops/internal paths), `packages/api-client/README.md`

## Local verification
- `pnpm turbo run lint typecheck test --filter=@omni/web...` — pass
- `pnpm turbo run lint typecheck test --filter=@omni/api...` — pass
- `cd apps/ai && uv sync --frozen && uv run pytest -q` — 2 passed

## Commit
`ci: add web api ai isolation migrate workflows and dependabot`
