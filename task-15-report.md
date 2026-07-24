Status: DONE_WITH_CONCERNS
Implemented Inngest client, platform-noop function, and Nest /api/inngest serve endpoint.
Added enqueueOutbox plus OutboxPublisher.publishPending() for unpublished rows.
Publisher sends platform.noop as Inngest platform/noop and marks published_at on success.
Failures increment attempts and write job_dead_letters after max attempts.
JwtAuthGuard and OrgGuard skip /api/inngest.
No migration added: job_dead_letters already exists in init_platform.sql.
Tests: pnpm --filter @omni/api test
Typecheck: pnpm --filter @omni/api typecheck
Concern: Inngest CLI/manual E2E not run in this agent.
Local E2E: npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
