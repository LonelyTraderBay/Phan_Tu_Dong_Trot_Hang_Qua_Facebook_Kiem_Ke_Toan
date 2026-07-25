# R0–R3 execution evidence (live completion path)

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md)

## R0 — Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` | — |
| R0.1 Migrations on remote staging | **GREEN** | Linked `lrcsbrmqlyvkxxspbezi` (`Phan_mem_ban_hang_online-staging`); repaired orphan history; `supabase db push` 26 migrations; verified core `public.*` tables | Legacy `app.*` schema remains from prior product |
| R0.2 Always-on staging hosts | **AMBER** | No Docker/hosting credentials in env | Owner deploy Railway/Fly/Render |
| R0.3 §12.1 walkthrough | **AMBER** | Needs live staging URLs | After R0.1–R0.2 |
| R0.4 Meta App Review submit | **AMBER** | Meta dashboard is owner-only | After public legal URLs + webhook always-on |
| R0.5 Scheduled QA | **GREEN** | [run 30139904845](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30139904845) — isolation + eval success (workflow_dispatch 2026-07-25) | — |

## R1 — Plan E paid/live

| Step | Status | Notes |
|------|--------|-------|
| R1.0–R1.6 | **AMBER / BLOCKED** | Requires Supabase Pro billing, always-on paid hosts, real LLM keys, uptime vendor |

## R2 — CPC commercial clear

| Step | Status | Notes |
|------|--------|-------|
| R2.1–R2.7 | **AMBER / BLOCKED** | Requires staging/prod with carrier + Meta + walkthrough |

## R3 — E100

| Step | Status | Notes |
|------|--------|-------|
| Scaffolding I1–I8 | **GREEN (docs/code)** | Merged Plan I |
| Live/compliance I1–I8 | **AMBER** | Vendor SOC2/pen-test, legal SLA, real SSO, quarterly access review |

## Staging project (linked)

| Field | Value |
|-------|-------|
| Name | `Phan_mem_ban_hang_online-staging` |
| Ref | `lrcsbrmqlyvkxxspbezi` |
| Region | `ap-southeast-1` |
| URL | `https://lrcsbrmqlyvkxxspbezi.supabase.co` |
| Prod (do not push casually) | `sppdnlpbkdasmjealhjm` (`Phan_mem_ban_hang_online-prod`) |

## Still needed to unblock R0.2+

```
# Deploy hosts (web/api/ai always-on staging URLs)
# META_* for App Review
# Optional GitHub secrets for CI Staging Migrate workflow
SUPABASE_ACCESS_TOKEN=
STAGING_PROJECT_REF=lrcsbrmqlyvkxxspbezi
```
