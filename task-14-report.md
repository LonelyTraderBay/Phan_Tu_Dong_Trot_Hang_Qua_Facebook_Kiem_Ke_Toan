## Task 14 Report

- Added `FeatureFlagsService.isEnabled(key, orgId)` with org override, global fallback, and missing-flag default `false`.
- Added `EntitlementsService.getEntitlements(orgId)` mapper for the existing `entitlements` table.
- Added `AuditService.writeAudit(...)` for `audit_logs` inserts with platform actor default.
- Wired `AdminOpsService.suspendOrganization` to write `organization.suspended` audit entries.
- Tests: `pnpm --dir apps/api test`
- Typecheck: `pnpm --dir apps/api run typecheck`
