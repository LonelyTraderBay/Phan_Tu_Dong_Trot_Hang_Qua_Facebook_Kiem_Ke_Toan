# Platform admin access review — eng dry-run (2026-07-26)

**Runbook:** [platform-admin-access-review.md](../runbooks/platform-admin-access-review.md)  
**Quarter template:** [access-review-2026-Q3.md](./access-review-2026-Q3.md)  
**Wave:** SDD E4 Task 4  
**Status:** **AMBER — eng dry-run only** (not quarterly live GREEN; **not** E100)

## Purpose

Advance I8 eng-parallel evidence by executing the runbook query path against reachable DBs. This is **not** a signed quarterly access review and does **not** claim I8 GREEN or E100.

## Dry-run execution log

| Field | Value |
|-------|-------|
| Review date (dry-run) | 2026-07-26 |
| Reviewer | Eng agent (SDD E4 Task 4) — unsigned |
| Method | PostgREST `GET /rest/v1/platform_admins?select=user_id,created_at` via existing parent `.local-secrets/supabase-*.json` (no secret values in this file) |
| Systems queried | Local Supabase API (`127.0.0.1`); staging Supabase project `omni-commerce-staging` ref `tjsmpcgkeoglemptuymu` |
| PII policy | Count + `user_id` only; no email dump |

### Query results

| Target | Reachable | `platform_admins` count | user_id list |
|--------|-----------|-------------------------|--------------|
| Local REST | **YES** (HTTP 200) | **0** | _(empty)_ |
| Staging REST | **YES** (HTTP 200) | **0** | _(empty)_ |

### Config presence (no values)

| Check | Result |
|-------|--------|
| Parent `.local-secrets/supabase-local.json` | PRESENT (`db_url`, `api_url`) |
| Parent `.local-secrets/supabase-staging.json` | PRESENT (`url`, `service_role_key`, `ref`) |
| Parent `.env` `PLATFORM_ADMIN_EMAILS` | PRESENT key, **email_count=0** (empty value) |
| Production DB | **N/A** — no prod project linked (see [r0-r3-execution-evidence.md](./r0-r3-execution-evidence.md) Staging project) |

## Runbook checklist (dry-run vs live)

| Step | Dry-run | Live quarterly (still required for I8 GREEN) |
|------|---------|-----------------------------------------------|
| 1. Export `platform_admins` | **DONE** (local+staging count=0) | Re-run on prod when prod exists |
| 2. Compare to approved roster | **SKIPPED** — roster empty / unset | Owner/eng with approved list |
| 3. Business need per admin | N/A (count=0) | Required when admins exist |
| 4. MFA on identity/provider | **NOT DONE** | Required |
| 5. Hosting / Supabase / GitHub / Sentry / Inngest least privilege | **NOT DONE** | Required |
| 6. Remove/downgrade unneeded | N/A (count=0) | Required when stale found |
| 7. Record reviewer + exceptions | Dry-run only; **no sign-off** | Dated signed biên bản |

## Evidence template (filled — dry-run)

| Field | Value |
|-------|-------|
| Review date | 2026-07-26 (dry-run) |
| Reviewer | Eng dry-run — **unsigned** |
| Systems reviewed | `platform_admins` via local + staging REST only |
| Admins retained | 0 (table empty on both targets) |
| Admins removed | 0 |
| Exceptions | Staging/local have zero `platform_admins` rows; `PLATFORM_ADMIN_EMAILS` empty — seed/approve roster before live ops |
| Next review date | 2026-10-01 (Q4) or immediately after first admin seed / offboarding |

## What would still be reviewed for live GREEN

1. Production `platform_admins` export (when prod exists) + approved roster diff.
2. Console access: GitHub org owners, Supabase project members, Render/hosting admins, Sentry/Inngest if enabled.
3. MFA confirmation and break-glass credential rotation check.
4. Signed reviewer + exceptions with owner/expiry.
5. Link from `plan-i-dod-evidence.md` I8 → **GREEN** only after that package.

## Exit claim (honest)

| Claim | Status |
|-------|--------|
| Runbook exists | GREEN |
| Eng dry-run query executed | **DONE** (this file) |
| I8 Access review | **AMBER** — dry-run ≠ quarterly live |
| E100 | **NOT claimed** |

## Next eng/owner actions

1. Seed approved platform admins via `PLATFORM_ADMIN_EMAILS` / ops process when ready for live ops.
2. Complete Q3 live biên bản in [access-review-2026-Q3.md](./access-review-2026-Q3.md) with sign-off (or open Q4 if Q3 window closes).
3. Do **not** mark I8 GREEN until live checklist + sign-off are done.
