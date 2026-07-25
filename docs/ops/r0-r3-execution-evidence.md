# R0–R3 execution evidence (live completion path)

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md)

## R0 — Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` (`supabase start` + `db reset`) | Remote staging project still needs owner link |
| R0.1 Migrations on remote staging | **AMBER** | No `SUPABASE_ACCESS_TOKEN` / project ref in agent or GitHub secrets | Provide token + `STAGING_PROJECT_REF` then run `scripts/staging-migrate.ps1` |
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

## Secrets needed to unblock automation

```
SUPABASE_ACCESS_TOKEN=
STAGING_PROJECT_REF=
# optional prod
PROD_PROJECT_REF=
TOKEN_ENCRYPTION_KEY=   # for app deploy
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
```

Set as local env or GitHub Actions secrets, then re-run agent / `scripts/staging-migrate.ps1`.
