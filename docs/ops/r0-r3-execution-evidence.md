# R0–R3 execution evidence (live completion path)

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md)

## R0 — Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` | — |
| R0.1 Migrations on remote staging | **GREEN** | Recreated staging `omni-commerce-staging` ref `tjsmpcgkeoglemptuymu` (old refs removed); `supabase db push` 26 migrations; verified `public.*` tables | Prior staging/prod refs deleted |
| R0.2 Always-on staging hosts | **AMBER** | Render free services created (SG): api `omni-api-staging-cs2w`, ai `omni-ai-staging`, web `omni-web-staging`; env wired to new Supabase | Free plan sleeps → not true always-on until starter + payment |
| R0.3 §12.1 walkthrough | **AMBER** | Staging URLs exist; walkthrough after deploys go live | Meta still pending |
| R0.4 Meta App Review submit | **AMBER** | Meta dashboard is owner-only (`META_*` still placeholders) | After public legal URLs + webhook always-on |
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
| Name | `omni-commerce-staging` |
| Ref | `tjsmpcgkeoglemptuymu` |
| Region | `ap-southeast-1` |
| URL | `https://tjsmpcgkeoglemptuymu.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/tjsmpcgkeoglemptuymu |
| Prod | **none** (old prod ref removed — recreate when needed) |

## Render staging services

| App | Service | URL | Dashboard |
|-----|---------|-----|-----------|
| api | `omni-api-staging` | https://omni-api-staging-cs2w.onrender.com | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| ai | `omni-ai-staging` | https://omni-ai-staging.onrender.com | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg |
| web | `omni-web-staging` | https://omni-web-staging.onrender.com | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg |

Local non-committed secrets: `.local-secrets/` (gitignored).

## Still needed to unblock R0.3+

```
# META_* real App Review credentials (replace placeholders on api)
# Payment method on Render → upgrade plan free → starter for always-on
# Optional GitHub secrets for CI Staging Migrate workflow
SUPABASE_ACCESS_TOKEN=
STAGING_PROJECT_REF=tjsmpcgkeoglemptuymu
```
