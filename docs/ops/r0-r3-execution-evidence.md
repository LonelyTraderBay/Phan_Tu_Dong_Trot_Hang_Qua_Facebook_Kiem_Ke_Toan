# R0Ã¢â‚¬â€œR3 execution evidence (live completion path)

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md) · SDD Wave R0: [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md)

## R0 Ã¢â‚¬â€ Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` | Ã¢â‚¬â€ |
| R0.1 Migrations on remote staging | **GREEN** | Recreated staging `omni-commerce-staging` ref `tjsmpcgkeoglemptuymu` (old refs removed); `supabase db push` 26 migrations; verified `public.*` tables | Prior staging/prod refs deleted |
| R0.2 Always-on staging hosts | **AMBER** | Free-tier LIVE; **not** always-on. Probes 2026-07-25: local probes failed — api `curl` TLS reset (exit 35); ai/web PowerShell timeout; GHA [keep-warm run 30143832342](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30143832342) `healthy_count=3/3` HTTP 200 (AMBER reachability only, not GREEN proof); prior external probe in [deploy-staging-render](./deploy-staging-render.md). Owner checklist: [Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner) | **BLOCKED (owner):** Render payment → upgrade `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` Free→Starter; GREEN needs post-upgrade no-cold-start external proof |
| R0.3 §12.1 walkthrough | **AMBER** | **Local R0.3a** ([walkthrough](./p0-staging-walkthrough-12-1.md), SDD [plan](../superpowers/plans/2026-07-25-sdd-completion-r0.md)): 1 PASS · 3 PASS (partial) · 1 FAIL (confirm 500 + reindex) · 2 BLOCKED (Meta); health 3/3; `pnpm test:isolation` 6 pass · 1 skip | Staging repeat + Meta OAuth/DM + order confirm + knowledge reindex for GREEN |
| R0.4 Meta App Review submit | **AMBER** | Meta dashboard is owner-only (`META_*` still placeholders) | After public legal URLs + webhook always-on |
| R0.5 Scheduled QA | **GREEN** | [run 30139904845](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30139904845) Ã¢â‚¬â€ isolation + eval success (workflow_dispatch 2026-07-25) | Ã¢â‚¬â€ |

## R1 Ã¢â‚¬â€ Plan E paid/live

| Step | Status | Notes |
|------|--------|-------|
| R1.0Ã¢â‚¬â€œR1.6 | **AMBER / BLOCKED** | Requires Supabase Pro billing, always-on paid hosts, real LLM keys, uptime vendor |

## R2 Ã¢â‚¬â€ CPC commercial clear

| Step | Status | Notes |
|------|--------|-------|
| R2.1Ã¢â‚¬â€œR2.7 | **AMBER / BLOCKED** | Requires staging/prod with carrier + Meta + walkthrough |

## R3 Ã¢â‚¬â€ E100

| Step | Status | Notes |
|------|--------|-------|
| Scaffolding I1Ã¢â‚¬â€œI8 | **GREEN (docs/code)** | Merged Plan I |
| Live/compliance I1Ã¢â‚¬â€œI8 | **AMBER** | Vendor SOC2/pen-test, legal SLA, real SSO, quarterly access review |

## Staging project (linked)

| Field | Value |
|-------|-------|
| Name | `omni-commerce-staging` |
| Ref | `tjsmpcgkeoglemptuymu` |
| Region | `ap-southeast-1` |
| URL | `https://tjsmpcgkeoglemptuymu.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/tjsmpcgkeoglemptuymu |
| Prod | **none** (old prod ref removed Ã¢â‚¬â€ recreate when needed) |

## Render staging services

| App | Service | URL | Dashboard |
|-----|---------|-----|-----------|
| api | `omni-api-staging` | https://omni-api-staging-cs2w.onrender.com | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| ai | `omni-ai-staging` | https://omni-ai-staging.onrender.com | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg |
| web | `omni-web-staging` | https://omni-web-staging.onrender.com | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg |

Local non-committed secrets: `.local-secrets/` (gitignored).

## R0.2 owner unblock (always-on)

| # | Owner action | Link |
|---|--------------|------|
| 1 | Add Render payment method | https://dashboard.render.com/u/billing |
| 2 | `omni-api-staging` Free → Starter | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| 3 | `omni-ai-staging` Free → Starter | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg |
| 4 | `omni-web-staging` Free → Starter | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg |
| 5 | Verify no cold-start + mark R0.2 GREEN | After all three Starter upgrades: post-upgrade external `curl` proof (no cold-start on api/ai/web critical path). Keep-warm `healthy_count=3/3` = AMBER reachability only, not GREEN |

Full checklist: [deploy-staging-render.md § Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner).

## Still needed to unblock R0.3+

```
# META_* real App Review credentials (replace placeholders on api)
# R0.2: owner completes table above (payment + Starter on all 3 Render services)
# Optional GitHub secrets for CI Staging Migrate workflow
SUPABASE_ACCESS_TOKEN=
STAGING_PROJECT_REF=tjsmpcgkeoglemptuymu
```
