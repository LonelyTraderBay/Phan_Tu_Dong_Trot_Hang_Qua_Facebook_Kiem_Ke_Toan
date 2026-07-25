# R0—R3 execution evidence (live completion path)

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md) · SDD Wave R0: [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md)

## R0 — Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` | — |
| R0.1 Migrations on remote staging | **GREEN** | Recreated staging `omni-commerce-staging` ref `tjsmpcgkeoglemptuymu` (old refs removed); `supabase db push` 27 migrations incl. `20260727210000_ensure_default_warehouse_on_org.sql` (SDD Task 5, 2026-07-25); verified `public.*` tables | Prior staging/prod refs deleted |
| R0.2 Always-on staging hosts | **AMBER** | Free-tier LIVE; **not** always-on. Probes 2026-07-25: local probes failed — api `curl` TLS reset (exit 35); ai/web PowerShell timeout; GHA [keep-warm run 30143832342](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30143832342) `healthy_count=3/3` HTTP 200 (AMBER reachability only, not GREEN proof); prior external probe in [deploy-staging-render](./deploy-staging-render.md). Owner checklist: [Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner) | **BLOCKED (owner):** Render payment → upgrade `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` Free→Starter; GREEN needs post-upgrade no-cold-start external proof |
| R0.3 §12.1 walkthrough | **AMBER** | **Local R0.3a+E0.3** ([walkthrough](./p0-staging-walkthrough-12-1.md)): 2 PASS · 3 PASS (partial) · 2 BLOCKED (Meta); confirm GREEN after warehouse migration `20260727210000`; health 3/3; `pnpm test:isolation` 6 pass · 1 skip | Staging repeat + Meta OAuth/DM + knowledge reindex for GREEN |
| R0.4 Meta App Review submit | **AMBER** | Prep pack complete ([p0-meta-app-review-submit](./p0-meta-app-review-submit.md), SDD Task 3 `2026-07-25`): staging Privacy/Terms/webhook/OAuth URLs filled; permissions list from code; `META_*` placeholders only in git (`.env.example`, `render.yaml` sync:false) | **BLOCKED (owner):** replace `META_*` on `omni-api-staging` + submit in Meta dashboard; needs R0.2 always-on for webhook during review |
| R0.5 Scheduled QA | **GREEN** | [run 30139904845](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30139904845) — isolation + eval success (workflow_dispatch 2026-07-25) | — |

## R1 — Plan E paid/live

| Step | Status | Notes |
|------|--------|-------|
| R1.0—R1.6 | **AMBER / BLOCKED** | Requires Supabase Pro billing, always-on paid hosts, real LLM keys, uptime vendor |

## R2 — CPC commercial clear

| Step | Status | Notes |
|------|--------|-------|
| R2.1—R2.7 | **AMBER / BLOCKED** | Requires staging/prod with carrier + Meta + walkthrough |

## R3 — E100

| Step | Status | Notes |
|------|--------|-------|
| Scaffolding I1—I8 | **GREEN (docs/code)** | Merged Plan I |
| Live/compliance I1—I8 | **AMBER** | Vendor SOC2/pen-test, legal SLA, real SSO, quarterly access review |

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

## R0.2 owner unblock (always-on)

| # | Owner action | Link |
|---|--------------|------|
| 1 | Add Render payment method | https://dashboard.render.com/u/billing |
| 2 | `omni-api-staging` Free → Starter | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| 3 | `omni-ai-staging` Free → Starter | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg |
| 4 | `omni-web-staging` Free → Starter | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg |
| 5 | Verify no cold-start + mark R0.2 GREEN | After all three Starter upgrades: post-upgrade external `curl` proof (no cold-start on api/ai/web critical path). Keep-warm `healthy_count=3/3` = AMBER reachability only, not GREEN |

Full checklist: [deploy-staging-render.md § Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner).

## R0.4 owner unblock (Meta App Review)

| # | Owner action | Link / value |
|---|--------------|--------------|
| 1 | R0.2 always-on (`omni-api-staging` minimum) | [Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner) |
| 2 | Set `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` on API | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| 3 | Meta webhook: `https://omni-api-staging-cs2w.onrender.com/v1/webhooks/meta` + verify token | [prep pack](./p0-meta-app-review-submit.md) |
| 4 | OAuth redirect: `https://omni-web-staging.onrender.com/settings/channels/callback` | Must match `META_REDIRECT_URI` |
| 5 | Privacy / Terms in Meta App Settings | `https://omni-web-staging.onrender.com/legal/privacy` · `/legal/terms` |
| 6 | Screencast + test Page/IG + submit App Review | [meta-app-review-checklist](../meta-app-review-checklist.md) |

## Still needed to unblock R0.3+

```
# META_* real App Review credentials (replace placeholders on api)
# R0.2: owner completes table above (payment + Starter on all 3 Render services)
# Optional GitHub secrets for CI Staging Migrate workflow
SUPABASE_ACCESS_TOKEN=
STAGING_PROJECT_REF=tjsmpcgkeoglemptuymu
```

## Wave R0 SDD gate summary (2026-07-25)

**SDD plan:** [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md) · **Parent SoT:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md)

| Step | Gate | Status | SDD task | Notes |
|------|------|--------|----------|-------|
| R0.1 | Migrations | **GREEN** | Task 5 | CI + staging `tjsmpcgkeoglemptuymu` (27 incl. warehouse `20260727210000`) |
| R0.2 | Always-on staging | **AMBER** | Task 2 | Owner: Render payment → Starter on 3 services |
| R0.3 | §12.1 walkthrough | **AMBER** | Task 3 (E0.3) | Local: 2 PASS · 3 partial · 2 BLOCKED (Meta); criterion 5 confirm PASS post-warehouse fix |
| R0.4 | Meta App Review | **AMBER** | Task 3 | Prep pack complete; owner: `META_*` + submit |
| R0.5 | Scheduled QA | **GREEN** | — (pre-done) | Actions run 30139904845 |

**Gate R0 verdict: AMBER (not GREEN).** Engineering prep for Tasks 1–3 is complete; owner blockers remain.

| Blocker | Owner action | Ref |
|---------|--------------|-----|
| R0.2 always-on | Payment + Free→Starter on `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` | [R0.2 owner unblock](#r02-owner-unblock-always-on) |
| R0.4 Meta | Set `META_*` on API + submit App Review | [R0.4 owner unblock](#r04-owner-unblock-meta-app-review) |
| R0.3 staging | Repeat walkthrough on staging; Meta OAuth/DM after R0.4 | [walkthrough](./p0-staging-walkthrough-12-1.md) |

**Next wave:** **R1 Plan E paid/live** (owner billing: Supabase Pro, prod always-on, LLM keys, uptime) — do not start SDD R1 until owner clears R0 blockers or explicitly requests R1 prep-only docs.

**Not claimed:** CPC commercial GREEN · E100 · full Gate R0 GREEN.

## E0+R0 SDD gate (2026-07-25)

**SDD plan:** [2026-07-25-sdd-e0-r0.md](../superpowers/plans/2026-07-25-sdd-e0-r0.md) · **Branch:** `feat/sdd-e0-r0-completion` @ Task 6

### Wave E0 — eng leftovers

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| E0.1 Warehouse fix | **GREEN** | Migration `20260727210000_ensure_default_warehouse_on_org.sql` on branch + staging 27/27 (Task 5) | — |
| E0.2 Knowledge reindex local | **BLOCKED** | Outbox `knowledge.reindex` publishes; `knowledge_chunks` count `0` — AI `502 GEMINI_API_KEY is required` ([local-host](./local-host.md), Task 2) | **Owner/eng:** set `GEMINI_API_KEY` in `.env` + `apps/ai/.env`; rerun with Inngest dev |
| E0.3 §12.1 confirm local | **PASS** | Criterion 5 confirm GREEN post-warehouse fix; overall walkthrough **AMBER** (Meta rows blocked) ([walkthrough](./p0-staging-walkthrough-12-1.md), Task 3) | Staging repeat + Meta for full R0.3 GREEN |
| E0.4 CPC stub decisions | **AMBER** | `cpc-checklist.md` stub table present; Zalo / e-invoice / advisor all **undecided** (Task 4) | **Owner:** fill REQUIRED \| AMBER_OK per R2.4–R2.6 |

**Gate E0 verdict:** E0.1 + E0.3 confirm **GREEN**; E0.2 **BLOCKED** (GEMINI); E0.4 **undecided** (non-blocking for Gate R0).

### Wave R0 — remaining (owner)

| Step | Status | Owner action |
|------|--------|--------------|
| R0.1 Migrations | **GREEN** | — (27 incl. warehouse on `tjsmpcgkeoglemptuymu`) |
| R0.2 Always-on staging | **AMBER** | Render payment → Starter on `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` — keep-warm `healthy_count=3/3` ≠ GREEN ([deploy-staging-render](./deploy-staging-render.md#upgrade-to-always-on-owner)) |
| R0.3 §12.1 walkthrough | **AMBER** | R0.3a local partial PASS; **R0.3b** staging full repeat after R0.2 + Meta |
| R0.4 Meta App Review | **AMBER** | Set `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` on API + submit ([prep pack](./p0-meta-app-review-submit.md) URLs verified vs staging) |
| R0.5 Scheduled QA | **GREEN** | — |

**Gate R0 verdict: AMBER (not GREEN).** Engineering SDD Tasks 1–6 complete; **controller STOP** — owner must clear R0.2 (payment) and R0.4 (`META_*` + submit) before R0.3b staging walkthrough.

**Next wave:** **R1 Plan E paid/live** only after **Gate R0 GREEN** (owner). Do not start R1 paid billing in this SDD wave.

**Verified Task 6:** `deploy-staging-render.md` always-on § states keep-warm ≠ GREEN; Meta prep pack staging URLs match Render services table above.
