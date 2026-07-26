# Platform Admin Access Review

**Status:** AMBER - runbook exists; eng dry-run 2026-07-26 done; first **live/signed** quarterly review still pending  
**Scope:** `platform_admins`, ops endpoints, production secrets, and hosting/database admin consoles.  
**Evidence:** [access-review-2026-07-26-dry-run.md](../ops/access-review-2026-07-26-dry-run.md) · [access-review-2026-Q3.md](../ops/access-review-2026-Q3.md)

## Cadence

Run quarterly, and immediately after a staff/vendor offboarding event.

## Review steps

1. Export current `platform_admins` rows from production.
2. Compare each admin to the current approved admin roster.
3. Verify every admin still has a business need.
4. Confirm MFA is enabled for identity/provider accounts where applicable.
5. Check hosting, Supabase, Sentry, Inngest, and GitHub admin access for matching least privilege.
6. Remove or downgrade unneeded access.
7. Record reviewer, date, removed users, and exceptions.

## Evidence template

| Field | Value |
|-------|-------|
| Review date | TBD |
| Reviewer | TBD |
| Systems reviewed | `platform_admins`, GitHub, Supabase, hosting, Sentry/Inngest if enabled |
| Admins retained | TBD |
| Admins removed | TBD |
| Exceptions | TBD |
| Next review date | TBD |

## SQL helper

```sql
select user_id, created_at
from public.platform_admins
order by created_at asc;
```

## Exit gate for GREEN

- Review completed with dated evidence.
- Unneeded access removed.
- Exceptions have owner and expiry date.
- Evidence linked from `docs/superpowers/plans/plan-i-dod-evidence.md`.
