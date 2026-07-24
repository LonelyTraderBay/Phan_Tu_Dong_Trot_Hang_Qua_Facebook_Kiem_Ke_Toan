# Final Branch Review - Plan A Platform Foundation

Reviewed branch: `feat/plan-a-platform-foundation`  
Base: `264f8de4330942cc847292bd56ef995a36e6171d`  
Head inspected: `413b6577a44e50ecb7fd608b10a2e5fd0bd805b0`  
Worktree: `.worktrees/plan-a-platform`  
Review mode: read-mostly spot check; no full suite rerun per request. Git status at review time was clean against `origin/feat/plan-a-platform-foundation`.

## Strengths

- The branch is coherent and well packaged: commit stack, review package, DoD evidence, progress ledger, ADRs, runbooks, and task reports make the implementation auditable.
- The monorepo foundation is in place for `web`, `api`, `ai`, `packages/*`, Supabase migrations, CI workflows, Dependabot, and docs. No Meta/catalog/orders product features were introduced.
- The API guard shape is generally aligned with the platform split: global JWT + org guards, `/ops/v1` guarded by `PlatformAdminGuard`, `/internal/v1/ai/health` guarded by `ServiceKeyGuard`, and explicit `X-Org-Id` validation on org-scoped routes.
- Cross-tenant API guard coverage is present and useful: `tests/isolation/cross-tenant.org.spec.ts` proves user A cannot use org B context through the Nest guard path before invite writes.
- M2 hooks are broadly represented: request id, ProblemDetails filter, redacting logger, security headers, traceparent middleware, idempotency-key stub, kill flags, eval stubs, and runbooks.
- Automated evidence is strong for a foundation branch: root lint/typecheck/test, API tests, isolation test, AI pytest, and eval stub are recorded green, with live Docker/service smoke explicitly marked amber.

## Critical findings

1. **Any authenticated org member can mutate tenant control-plane tables directly through Supabase RLS.**
   - Evidence:
     - `supabase/migrations/20260724120000_init_platform.sql:177-182` allows any org member to `UPDATE` `memberships`.
     - `supabase/migrations/20260724120000_init_platform.sql:203-208` allows any org member to `UPDATE` `entitlements`.
     - `supabase/migrations/20260724120000_init_platform.sql:216-221` allows any org member to `UPDATE` org feature flags.
     - `supabase/migrations/20260724120000_init_platform.sql:242-247` allows any org member to `UPDATE` `outbox_events`.
     - `supabase/migrations/20260724120000_init_platform.sql:268-276` grants `select, update` on these tables to `authenticated`.
     - `README.md:40-46` and `.env.example` expose/use the Supabase anon key for client-side environments.
   - Impact: the Nest permission guard is bypassable at the database API layer. A `cskh`/`kho` user with a normal Supabase JWT could call Supabase REST directly and update membership roles, entitlements, feature flags, outbox state, or other tenant rows as long as they are a member of the org. This is privilege escalation and control-plane tampering, not just a missing product permission.
   - Required fix before merge: make direct authenticated DB access read-only for these foundation tables unless a specific client-write policy is needed and role-scoped. For Plan A, the safest foundation is to revoke authenticated `UPDATE` on memberships, invites, entitlements, feature flags, usage events, and outbox, and keep writes behind Core service-role paths with explicit Nest guards. Add a Supabase/RLS negative test proving non-owner members cannot update memberships/entitlements/flags directly.

## Important findings

1. **Outbox events are never published in the running API.**
   - Evidence:
     - `apps/api/src/jobs/outbox.publisher.ts:101-144` implements `publishPending()`.
     - `apps/api/src/modules/internal/internal.module.ts:8-11` registers `OutboxPublisher` as a provider only.
     - `rg` found `publishPending` only in `outbox.publisher.ts` and `outbox.publisher.spec.ts`; there is no scheduler, interval, cron, dev trigger, or controller path that invokes it.
   - Impact: `enqueueOutbox()` can insert rows, and the Inngest serve endpoint exists, but queued rows will sit unpublished forever in the actual app. The deferred Docker/Inngest smoke would fail unless the publisher is invoked manually from code.
   - Recommended fix: wire a minimal runtime trigger appropriate for Plan A, e.g. `OnModuleInit` dev interval gated by env, a scheduler job, or a guarded internal/dev-only publish endpoint documented in README. Keep it idempotent and safe for multi-instance later.

2. **Organization bootstrap is not atomic.**
   - Evidence: `apps/api/src/modules/identity/identity.service.ts:99-135` performs organization insert, membership insert, and entitlements insert as three independent service-role calls.
   - Impact: if membership or entitlements creation fails after the org insert succeeds, the system can leave an orphan organization or an org without entitlements. That is painful to clean up and undermines the identity/tenancy foundation.
   - Recommended fix: move bootstrap into a Postgres RPC/transaction or another atomic server-side path. If that is deferred, record a compensating cleanup strategy and add failure-path tests.

3. **The AI m2m health path sends a service key but the AI service does not validate it.**
   - Evidence:
     - Core sends `X-Service-Key` in `apps/api/src/modules/internal/ai-proxy.service.ts:9-13`.
     - AI config defines `service_m2m_key` in `apps/ai/app/config.py:4-5`.
     - AI `/health` only reads/echoes `traceparent` in `apps/ai/app/api/health.py:6-11`; it does not read or validate `X-Service-Key`.
   - Impact: the current tests prove outbound header propagation, not m2m authorization on the AI side. If `/health` is intentionally public, the branch should not describe this as authenticated m2m health; if it is meant to be the m2m stub, AI should reject missing/bad service keys and have pytest coverage.

4. **Isolation coverage proves the Nest guard path, not the actual Supabase RLS boundary.**
   - Evidence: `tests/isolation/cross-tenant.org.spec.ts:49-59` uses an in-memory membership map, and `tests/isolation/cross-tenant.org.spec.ts:119-128` wires a mocked repository into a Nest test module.
   - Impact: the test is valuable, but it would not catch the critical RLS update issue above. For a branch whose foundation includes RLS, add at least one DB-backed policy test in the migrate/isolation gate for direct Supabase access.

## Minor findings / known rollup

- ProblemDetails vs structure §6.2 remains a documented minor mismatch. `apps/api/src/common/filters/problem-details.filter.ts` emits a useful shape, but the OpenAPI stub at `packages/contracts/openapi.yaml` does not yet define shared error schemas.
- Docker/Supabase/Inngest live smoke remains deferred and correctly marked amber in `docs/superpowers/plans/plan-a-dod-evidence.md:99-109`.
- `.gitleaks.toml` exists, but the CI workflow step is still missing from the workflow set.
- `EntitlementsService` exists but Nest module registration is deferred.
- `PLATFORM_ADMIN_EMAILS` is declared, but boot/dev sync is deferred in favor of manual seed SQL. This is acceptable for Plan A if documented, but it should be resolved before operator onboarding.
- `AiProxyService.checkAiHealth()` does not check upstream HTTP status before returning `res.json()`. For health-only Plan A this is not a blocker, but it should map non-2xx AI responses to a clear API error before production use.

## Merge readiness - Plan A platform only

**Recommendation: Request changes before merging Plan A.**

The branch is strong as a scaffold and the documented green gates are credible, but the RLS `UPDATE` grants are a platform-foundation security blocker. The outbox publisher not being wired also means one of the headline Plan A platform spines is implemented only as a unit-tested library, not as runtime behavior.

Minimum before merge:

1. Tighten Supabase RLS/grants so authenticated users cannot directly mutate memberships, entitlements, feature flags, usage/outbox state, or other control-plane rows without role-specific policies.
2. Add DB-backed negative RLS coverage for direct Supabase access.
3. Wire or explicitly re-scope the outbox publisher runtime trigger.
4. Make org bootstrap atomic or add a deliberate accepted-debt record with cleanup/test coverage.
5. Clarify/fix whether AI `/health` is public liveness or service-key-protected m2m health.

After those are addressed, the remaining known rollups are minor/deferred foundation debt rather than merge blockers for the platform-only scope.

## Re-review after fixes

Re-reviewed head: `8d07d3e2d35536cffdd73eb626e3742ac0860279`  
Prior inspected head: `413b6577a44e50ecb7fd608b10a2e5fd0bd805b0`  
Scope: spot-check of the fix delta only; no full suite rerun in this pass.

### Merge readiness - Plan A platform only

**Recommendation: Merge ready YES for Plan A platform.**

No new blocking findings were found in the fix delta. The prior critical RLS mutation blocker and the important runtime/atomicity/key-behavior issues are addressed sufficiently for the platform-foundation scope.

### Fix spot-checks

1. **RLS hardening: resolved.**
   - `supabase/migrations/20260724193000_harden_control_plane_and_org_bootstrap.sql` drops the broad authenticated `UPDATE` policies from the initial migration and revokes `insert`, `update`, and `delete` on the foundation control-plane tables from `anon` and `authenticated`.
   - The final grant state leaves authenticated clients with `select` only on the listed tenant tables, while privileged writes remain behind `service_role`.
   - Residual risk: the DB-backed Supabase RLS E2E remains a skipped placeholder (`tests/isolation/cross-tenant.org.spec.ts`) and is documented as required before Plan B Meta work.

2. **Outbox runtime wiring: resolved for Plan A.**
   - `OutboxPublisher` now implements `OnModuleInit`/`OnModuleDestroy`, starts a 2s publish interval outside `NODE_ENV=test`, clears it on shutdown, and prevents same-instance overlapping publish runs.
   - `InternalModule` provides `OutboxPublisher`, and `AppModule` imports `InternalModule`, so the publisher is instantiated in the running API.
   - Residual risk: no live Docker/Supabase/Inngest smoke was rerun in this pass, and multi-instance locking/deduplication remains future hardening.

3. **Organization bootstrap atomicity: resolved.**
   - `IdentityService.createOrganization()` now calls `create_organization_with_owner`.
   - The new PL/pgSQL RPC inserts the organization, owner membership, and default entitlements in one database function call, and execute permission is granted only to `service_role`.

4. **AI health service-key behavior: acceptable for Plan A.**
   - Core still sends `X-Service-Key` when proxying AI health.
   - AI `/health` now rejects a present wrong service key, accepts the configured key, and keeps no-key `/health` public as liveness. That is acceptable for a non-sensitive health endpoint, but it should not be described as a fully protected AI authorization boundary.

### Remaining non-blocking follow-ups

- Replace the skipped RLS placeholder with real Docker-backed Supabase RLS E2E before Plan B Meta.
- Run the deferred live smoke: local Supabase migrate, API/AI health through both services, and outbox-to-Inngest noop.
- Consider outbox row claiming/locking before multi-instance production deployment.
