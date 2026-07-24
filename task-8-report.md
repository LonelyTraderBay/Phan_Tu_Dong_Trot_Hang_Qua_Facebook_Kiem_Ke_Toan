# Task 8 report

- Added owner-only `POST /v1/orgs/me/export` JSON PDPA bundle for org, memberships, contacts, conversation summaries, and orders/items.
- Added owner-only `POST /v1/orgs/me/delete-request` returning pending status and recording `organization.delete_requested` in audit logs.
- Added PDPA delete/anonymize runbook at `docs/runbooks/pdpa-delete.md`.
- Added OpenAPI stubs and authz permissions/tests for owner-only PDPA actions.
- Verified: `pnpm --dir apps/api test`, `pnpm --dir apps/api typecheck`, `pnpm --dir packages/authz-types test`, `pnpm --dir packages/authz-types typecheck`.
# Task 8 Report - C7 Entitlement quota before LLM
- Added `AiTokenUsageService`: sums `usage_events` (`ai_tokens`) vs `entitlements.ai_monthly_token_limit` for UTC month.
- Internal Core endpoints: `POST /internal/v1/billing/ai-token-quota/check` (429 on exceed) and `/record`.
- `process-inbound` job checks quota before AI call; on exceed writes `quota_exceeded` ai_run and escalates without LLM.
- AI orchestrator checks Core quota before LLM and records token usage after successful completion.
- Tests: over-quota job path, usage service, AI orchestrator quota skip + record.
- Verification: `pnpm --dir apps/api test`; `pnpm --dir apps/api typecheck`; `pytest tests/test_process_message.py`.
