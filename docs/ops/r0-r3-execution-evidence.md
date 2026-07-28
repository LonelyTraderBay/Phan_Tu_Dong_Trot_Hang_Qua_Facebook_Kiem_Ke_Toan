# R0—R3 execution evidence (live completion path)

> **SoT local ports (current):** [`config/local-ports.json`](../../config/local-ports.json) · [`local-ports.md`](./local-ports.md)  
> Web **4700** · API **4701** · AI **4702** · Inngest **4788** · Supabase API **54721**.  
> Older rows mentioning `:3000` / `:3001` / `:8000` / `:54321` are **legacy evidence** — do **not** use those ports for new runs. Fresh Gate A re-verify (2026-07-27) used the locked ports.

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md) · SDD Wave R0: [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md)

## R0 — Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` | — |
| R0.1 Migrations on remote staging | **GREEN** | Recreated staging `omni-commerce-staging` ref `tjsmpcgkeoglemptuymu` (old refs removed); `supabase db push` **29** migrations incl. resume `20260727220000` (E2 T2) + e-invoice `20260727230000_einvoice_http_sandbox_provider.sql` (E2 T5, 2026-07-25); `migration list` local=remote **29/29**; verified `public.resume_inbox_conversation` RPC | Prior staging/prod refs deleted |
| R0.2 Always-on staging hosts | **BLOCKED** | **E5 Task 2 (2026-07-26 Re-probe R0.2):** `RENDER_API_KEY` still **ABSENT** (env + parent `.env*` + parent `.local-secrets/*` + GH secrets — presence probe only; no `rnd_` / apiKey hit). Free→Starter API upgrade **SKIPPED**. Latest GHA keep-warm [30196670571](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30196670571) `healthy_count=3/3` = **AMBER reachability only** (api ~43s / ai ~22s / web ~52s cold-start before HTTP 200 — free-tier sleep + keep-warm ≠ always-on). **Not GREEN.** Prior E4: [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561). Owner clicks: [Upgrade to always-on](./deploy-staging-render.md#upgrade-to-always-on-owner) · [E5 Task 2 section](#wave-e5-task-2--r02-render-always-on-re-probe-2026-07-26) | **BLOCKED (owner):** Billing payment + Free→Starter ×3; GREEN only with post-upgrade no-cold-start proof |
| R0.3 §12.1 walkthrough | **AMBER** | **Local R0.3a+E0.3 + L1 Task 2 (2026-07-26)** ([walkthrough](./p0-staging-walkthrough-12-1.md)): stack health 3/3 + Supabase `:54321` **PASS** (*legacy port*; current SoT `:54721`); non-Meta rows carry prior PASS/partial; Meta **BLOCKED** OK (no public webhook); chunks still open until L1 Task 3 | Staging/Meta deferred until CPC claim; knowledge reindex for full criterion 3 |
| R0.4 Meta App Review submit | **BLOCKED** | **E5 Task 3 (2026-07-26 Re-probe R0.4):** Prep pack still complete. Parent `.env` / `.env.staging.local` (values never printed): `META_APP_ID` len=7 placeholderish; `META_APP_SECRET` len=7 placeholderish; `META_VERIFY_TOKEN` len=32 placeholderish=false (local only; hash-equal across both files); `META_REDIRECT_URI` = local `127.0.0.1` (not staging). Legal/webhook probes **SKIPPED** (creds not real — no Meta dashboard path). GHA keep-warm [30196670571](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30196670571) `healthy_count=3/3` = AMBER host reachability only — **no direct `/legal/*` proof**. **No Meta dashboard submit.** R0.2 still **BLOCKED** (webhook reliability prerequisite). · [E5 Task 3 section](#wave-e5-task-3--r04-meta-app-review-re-probe-2026-07-26) · [prep pack](./p0-meta-app-review-submit.md) | **BLOCKED (owner):** real `META_*` on `omni-api-staging` + Meta dashboard submit; needs R0.2 always-on |
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
| R0.1 | Migrations | **GREEN** | Task 5 / E2 T2+T5 | CI + staging `tjsmpcgkeoglemptuymu` (29 incl. resume `20260727220000` + http_sandbox `20260727230000`) |
| R0.2 | Always-on staging | **BLOCKED** | E3 Task 2 | No `RENDER_API_KEY` / payment; keep-warm ≠ always-on; owner: Starter ×3 |
| R0.3 | §12.1 walkthrough | **AMBER** | Task 3 (E0.3) | Local: 2 PASS · 3 partial · 2 BLOCKED (Meta); criterion 5 confirm PASS post-warehouse fix |
| R0.4 | Meta App Review | **BLOCKED** | E5 Task 3 | Re-probe R0.4: placeholders + no Meta login; prep pack refreshed; not Submitted |
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
| E0.1 Warehouse fix | **GREEN** | Migration `20260727210000_ensure_default_warehouse_on_org.sql` on branch + staging 29/29 (Task 5 + E2 T2/T5) | — |
| E0.2 Knowledge reindex local | **PASS (stub)** | L1 Task 3: `GEMINI` empty → deterministic stub embeddings (768-d); prod refuse; pytest green ([local-host](./local-host.md)) | Optional: set real `GEMINI_API_KEY` for Gemini path; smoke Inngest → chunks > 0 |

| E0.3 §12.1 confirm local | **PASS** | Criterion 5 confirm GREEN post-warehouse fix; overall walkthrough **AMBER** (Meta rows blocked) ([walkthrough](./p0-staging-walkthrough-12-1.md), Task 3) | Staging repeat + Meta for full R0.3 GREEN |
| E0.4 CPC stub decisions | **AMBER** | `cpc-checklist.md` stub table present; Zalo / e-invoice / advisor all **undecided** (Task 4) | **Owner:** fill REQUIRED \| AMBER_OK per R2.4–R2.6 |

**Gate E0 verdict:** E0.1 + E0.3 confirm **GREEN**; E0.2 **BLOCKED** (GEMINI); E0.4 **undecided** (non-blocking for Gate R0).

### Wave R0 — remaining (owner)

| Step | Status | Owner action |
|------|--------|--------------|
| R0.1 Migrations | **GREEN** | — (29 incl. resume `20260727220000` + http_sandbox `20260727230000` on `tjsmpcgkeoglemptuymu`) |
| R0.2 Always-on staging | **BLOCKED** | E4 Re-attempt R0.2: still no `RENDER_API_KEY` / payment; keep-warm [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561) 3/3 = AMBER ≠ GREEN — owner: payment → Starter ×3 ([deploy-staging-render](./deploy-staging-render.md#upgrade-to-always-on-owner); [E4 Task 2](#wave-e4-task-2--r02-render-always-on-re-attempt-2026-07-26)) |
| R0.3 §12.1 walkthrough | **AMBER** | R0.3a local partial PASS; **R0.3b** staging full repeat after R0.2 + Meta |
| R0.4 Meta App Review | **BLOCKED** | E4 Re-attempt R0.4: still placeholderish `META_*`; set real values on API + submit App Review ([prep pack](./p0-meta-app-review-submit.md); [E4 Task 3](#wave-e4-task-3--r04-meta-app-review-re-attempt-2026-07-26)) |
| R0.5 Scheduled QA | **GREEN** | — |

**Gate R0 verdict: AMBER (not GREEN).** Engineering SDD Tasks 1–6 complete; **controller STOP** — owner must clear R0.2 (payment) and R0.4 (`META_*` + submit) before R0.3b staging walkthrough.

**Next wave:** **R1 Plan E paid/live** only after **Gate R0 GREEN** (owner). Do not start R1 paid billing in this SDD wave.

**Verified Task 6:** `deploy-staging-render.md` always-on § states keep-warm ≠ GREEN; Meta prep pack staging URLs match Render services table above.

## Wave E2 SDD gate (2026-07-25) — eng CLOSED / owner STOP

**SDD plan:** [2026-07-25-sdd-e2-to-100.md](../superpowers/plans/2026-07-25-sdd-e2-to-100.md) · **Branch:** `cursor/e2-completion` · **PR:** [#22](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/22)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Land E1 | **GREEN** | E1 (inbox resume / Gemini advisor / Zalo persist) on `cursor/e2-completion`; draft PR #22 → `main`; walkthrough conflict resolved (E0.3 confirm PASS + E1 resume PASS; Meta BLOCKED) |
| **T2** Staging resume migr | **GREEN** | `20260727220000_inbox_resume_rpc.sql` on `tjsmpcgkeoglemptuymu`; was 28/28 local=remote; RPC `public.resume_inbox_conversation` verified |
| **T3** R2.5 eng http_sandbox | **GREEN** | `http_sandbox` provider + tests; stub remains default; no live tax-compliance claim ([einvoice-providers](./einvoice-providers.md)) |
| **T4** R1 eng entitlement gate | **GREEN** | `entitlement-gate.proof.spec.ts`; eng-proven gates vs owner-paid Pro/PITR/always-on distinguished in `plan-e-dod-evidence.md` |
| **T5** Gate + STOP | **GREEN** | This section; path-to-100 “tiếp theo ngay” = owner-only; **controller STOPS eng SDD** |

### Staging migrations (E2 tip)

| Item | Status |
|------|--------|
| Resume `20260727220000` | **GREEN** (E2 T2) |
| http_sandbox `20260727230000_einvoice_http_sandbox_provider.sql` | **GREEN** (E2 T5 push 2026-07-25) — `migration list` local=remote **29/29** |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau E2 eng | Còn thiếu (không phải eng SDD) |
|------|---------------|--------------------------------|
| **Eng path** | ~**95%** | E0.2 GEMINI local; E0.4 stub decisions; live R2 polish only |
| **CPC thương mại** | ~**38%** | **NOT 100%** — R0.2/R0.4 → R1 paid → R2.1–2.3 live → R2.7 checklist |
| **E100** | ~**22%** | **NOT 100%** — R3 SOC2/pen-test/SSO/SLA vendor+legal |
| **Tổng intended** | ~**55%** | CPC GREEN **và** E100 GREEN |

**Gate E2 verdict: eng CLOSED.** CPC thương mại and E100 remain **not** 100%. Owner/vendor blockers unchanged.

| Blocker | Owner / vendor next action |
|---------|----------------------------|
| **R0.2** | Render payment → Starter × `omni-api/ai/web-staging` ([owner unblock](#r02-owner-unblock-always-on)) |
| **R0.4** | Set `META_*` on API + submit App Review ([owner unblock](#r04-owner-unblock-meta-app-review)) |
| **R0.3b** | Staging full §12.1 after R0.2 + R0.4 |
| **R1** | Supabase Pro / PITR / always-on prod / LLM keys / billing live |
| **R2.1–2.3** | Carrier + COD + returns **live** |
| **R3** | SOC2 / pen-test / SSO / SLA vendors |

**Controller STOP.** Resume eng SDD only when owner unblocks or provides keys. Do not invent Meta/Render/Supabase Pro credentials.

## Wave E3 Task 2 — R0.2 Render always-on attempt (2026-07-25)

**SDD plan:** [2026-07-25-sdd-e3-r0-owner-path.md](../superpowers/plans/2026-07-25-sdd-e3-r0-owner-path.md) · **Branch:** `cursor/e3-r0-owner-path` · **Attempt:** R0.2

### Verdict: **BLOCKED** (not GREEN)

Always-on Starter was **not** applied. Keep-warm reachability is **not** R0.2 GREEN.

### Probes (secret values never printed)

| Probe | Result |
|-------|--------|
| `env:RENDER_API_KEY` | **ABSENT** |
| Parent `.env` / `.env.staging.local` / `.env.example` | **ABSENT** (no `RENDER_API_KEY=` line with a real value) |
| Parent `.local-secrets/*` | **ABSENT** (no `RENDER_API_KEY` / `rnd_` apiKey hit) |
| GitHub Actions secrets (`gh secret list`) | **ABSENT** (empty secret list / no `RENDER_API_KEY`) |
| Render API Free→Starter for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` | **SKIPPED** — no API key; payment UI cannot be invented by agent |

### Health / reachability (free tier)

| Path | Result | Interpretation |
|------|--------|----------------|
| Local curl api/ai/web | TLS reset exit **35** (~19s) | Known local network block of `onrender.com` ([deploy-staging-render](./deploy-staging-render.md#troubleshoot-url-kh%C3%B4ng-l%C3%AAn)) |
| GHA keep-warm [30154127860](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30154127860) | `healthy_count=3/3` HTTP 200 (api `{"status":"ok"}`, ai 200, web 200) | **AMBER** free-tier reachability only |
| Plan / Instance Type | Still **free** (blueprint `render.yaml` `plan: free`; no Starter upgrade performed) | Cold-start sleep remains on critical path |

### Owner next clicks (exact path)

Do **not** invent payment. Owner must:

| # | Click path |
|---|------------|
| 1 | https://dashboard.render.com/u/billing → **Add payment method** |
| 2 | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg (`omni-api-staging`) → **Settings** → **Instance Type** → **Free** → **Starter** → **Save** |
| 3 | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg (`omni-ai-staging`) → same Free → Starter → Save |
| 4 | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg (`omni-web-staging`) → same Free → Starter → Save |
| 5 | Optional: `render.yaml` `plan: free` → `plan: starter` for all three; commit |
| 6 | Post-upgrade external proof: stable HTTP 200 on api `/health`, ai `/health`, web `/` with **no** 30–90s cold-start after idle — then mark R0.2 **GREEN** |

Full checklist: [deploy-staging-render.md § Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner).

**Not claimed:** R0.2 GREEN · always-on · Starter plan on any of the three services.

## Wave E3 Task 3 — R0.4 Meta App Review attempt (2026-07-25)

**SDD plan:** [2026-07-25-sdd-e3-r0-owner-path.md](../superpowers/plans/2026-07-25-sdd-e3-r0-owner-path.md) · **Branch:** `cursor/e3-r0-owner-path` · **Attempt:** R0.4

### Verdict: **BLOCKED** (not Submitted / not Approved)

Agent cannot log into Meta App Dashboard. Parent `META_APP_ID` / `META_APP_SECRET` remain placeholderish. R0.2 always-on remains a webhook reliability prerequisite.

### Probes (secret values never printed)

| Source | Key | present | len | placeholderish |
|--------|-----|---------|-----|----------------|
| Parent `.env` | `META_APP_ID` | yes | 7 | **true** |
| Parent `.env` | `META_APP_SECRET` | yes | 7 | **true** |
| Parent `.env` | `META_VERIFY_TOKEN` | yes | 32 | **false** (local only — not proof on Render) |
| Parent `.env` | `META_REDIRECT_URI` | yes | 48 | local `http://127.0.0.1:3000/settings/channels/callback` (≠ staging) — *legacy port*; current SoT web **:4700** |
| Parent `.env.staging.local` | same four keys | same lens / same placeholderish flags; `VERIFY_TOKEN` hash-equal to `.env` | | |
| `.env.example` | `META_APP_ID` / `SECRET` / `VERIFY_TOKEN` | yes | 24 / 28 / 37 | **true** (known placeholders) |
| `render.yaml` | `META_APP_ID` / `SECRET` / `VERIFY_TOKEN` | `sync: false` | — | dashboard-only |
| `render.yaml` | `META_REDIRECT_URI` | pinned staging callback | — | correct staging value |

No credentials invented. No secret values printed or committed.

### Public / reachability checks

| Path | Result | Interpretation |
|------|--------|----------------|
| Local curl Privacy / Terms | **timeout (28)** ~15s | Known local network block of `onrender.com` |
| Local curl API `/health` | **timeout (28)** | Cannot warm-verify webhook from this host |
| Webhook GET challenge | **SKIPPED** | No warm local path to API; do not use token against unreachable host |
| GHA keep-warm [30154127860](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30154127860) | `healthy_count=3/3` (api/ai/web HTTP 200) | **AMBER** free-tier reachability only — not legal-page proof; not R0.2 GREEN |
| R0.2 always-on | **BLOCKED** (E3 Task 2) | Webhook may cold-start during App Review |

Prep pack status rows refreshed: [p0-meta-app-review-submit.md](./p0-meta-app-review-submit.md).

### Owner next clicks (exact path from prep pack)

Do **not** invent Meta credentials. Owner must:

| # | Action |
|---|--------|
| 1 | Complete [R0.2 always-on](./deploy-staging-render.md#upgrade-to-always-on-owner) — `omni-api-staging` Starter **minimum** (webhook must not cold-start during review) |
| 2 | Create/select Meta Business app → copy **App ID** + **App Secret** |
| 3 | Render `omni-api-staging` env: set real `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (8+ chars) — https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| 4 | Meta App → Webhooks: callback `https://omni-api-staging-cs2w.onrender.com/v1/webhooks/meta` + verify token + Page `messages` |
| 5 | Meta App → Facebook Login: Valid OAuth Redirect URIs = `https://omni-web-staging.onrender.com/settings/channels/callback` |
| 6 | Meta App → Settings → Basic: Privacy `…/legal/privacy` + Terms `…/legal/terms` |
| 7 | Test Page + IG Professional + testers ([checklist §6](../meta-app-review-checklist.md#6-test-users--assets)) |
| 8 | Screencast + use-case text ([checklist §2](../meta-app-review-checklist.md#2-permissions-to-request-phase-1)); permissions: `pages_show_list`, `pages_messaging`, `instagram_basic`, `instagram_manage_messages`, `pages_read_engagement` |
| 9 | Submit App Review → Permissions and Features (Advanced Access) — **do not** switch app to Live until approved |
| 10 | Update this evidence R0.4 with **Submitted at** date only (not Approved until Meta approves) |

**Not claimed:** Submitted · Approved · R0.4 GREEN · webhook verify 200 · legal pages 200 from this agent host.

## Wave E3 SDD gate (2026-07-25) — eng CLOSED / owner STOP

**SDD plan:** [2026-07-25-sdd-e3-r0-owner-path.md](../superpowers/plans/2026-07-25-sdd-e3-r0-owner-path.md) · **Branch:** `cursor/e3-r0-owner-path` · **PR:** [#23](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/23) · **Base:** `main` @ `e45bdc6` (PR #22 MERGED)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Merge PR #22 → main + E3 branch | **GREEN** | PR #22 **MERGED** to `main` @ `e45bdc6`; worktree `.worktrees/e3-sdd` on `cursor/e3-r0-owner-path` |
| **T2** Attempt R0.2 Render Starter ×3 | **BLOCKED** | `RENDER_API_KEY` ABSENT; no payment invent; keep-warm 3/3 = AMBER reachability only ≠ always-on; [Task 2 section](#wave-e3-task-2--r02-render-always-on-attempt-2026-07-25) |
| **T3** Attempt R0.4 Meta App Review | **BLOCKED** | Placeholderish `META_*` (APP_ID/SECRET len=7); no Meta dashboard submit; R0.2 prereq; [Task 3 section](#wave-e3-task-3--r04-meta-app-review-attempt-2026-07-25) |
| **T4** R3.7 SBOM enforce (I7 eng) | **GREEN/AMBER** | Fail-closed on empty/missing SBOM for `v*` tag + published release; I7 eng **GREEN**; org must still cut `v*` tags (**AMBER** process) |
| **T5** Gate + STOP | **GREEN** | This section; path-to-100 / remaining-completion “tiếp theo ngay” = owner-only; **controller STOPS** |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau E3 eng | Còn thiếu (không phải eng SDD) |
|------|---------------|--------------------------------|
| **Eng path** | ~**95%**+ | E0.2 GEMINI local; E0.4 stub decisions; SBOM org tag process AMBER; live R2 polish |
| **CPC thương mại** | ~**38%** | **NOT 100%** — R0.2/R0.4 → R0.3b → Gate R0 → R1 paid → R2.1–2.3 live → R2.7 |
| **E100** | ~**22%**+ | **NOT 100%** — R3 SOC2/pen-test/SSO/SLA vendor+legal (I7 eng enforce landed) |
| **Tổng intended** | ~**55%** | CPC GREEN **và** E100 GREEN — **NOT 100%** |

**Gate E3 verdict: eng CLOSED / STOP.** CPC thương mại and E100 remain **not** 100%. Controller cannot finish 100% without owner payment / Meta / vendors.

| Blocker | Owner / vendor next action |
|---------|----------------------------|
| **R0.2** | Render payment → Starter × `omni-api/ai/web-staging` ([owner unblock](#r02-owner-unblock-always-on)) |
| **R0.4** | Real `META_*` on API + App Review submit ([owner unblock](#r04-owner-unblock-meta-app-review)) |
| **R0.3b** | Staging full §12.1 after R0.2 + R0.4 → Gate R0 |
| **R1** | Paid (Pro/PITR/always-on prod / LLM / billing) after Gate R0 |
| **R2** | Carrier/COD/returns live → CPC checklist |
| **R3** | SOC2 / pen-test / SSO / SLA → E100 |

**Controller STOP.** Resume eng SDD only when owner unblocks R0.2/R0.4 or provides keys. Do not invent Meta/Render/Supabase Pro credentials. Do not claim CPC / E100 / tổng 100%.

## Wave E4 Task 2 — R0.2 Render always-on re-attempt (2026-07-26)

**SDD plan:** [2026-07-26-sdd-e4-owner-path.md](../superpowers/plans/2026-07-26-sdd-e4-owner-path.md) · **Branch:** `cursor/e4-owner-path` · **Attempt:** R0.2 re-attempt

### Verdict: **BLOCKED** (not GREEN)

Always-on Starter was **not** applied. Keep-warm reachability is **AMBER only** — **not** R0.2 GREEN.

### Probes (secret values never printed)

| Probe | Result |
|-------|--------|
| `env:RENDER_API_KEY` / `RENDER_API_TOKEN` | **ABSENT** |
| Parent `.env` / `.env.staging.local` / `.env.example` | **ABSENT** (no `RENDER_API_KEY=` / `TOKEN=` line with a real value) |
| Worktree `.env*` | **ABSENT** |
| Parent `.local-secrets/*` (incl. `render-*-create.json`, `render-staging-keys.json`, `keys-raw.txt`) | **ABSENT** (no `RENDER_API_KEY` / `apiKey` / `rnd_` shape) |
| GitHub Actions secrets (`gh secret list`) | **ABSENT** (`RENDER_API_KEY` not listed) |
| Render API Free→Starter for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` | **SKIPPED** — no API key; payment UI cannot be invented by agent |

### Health / reachability (free tier)

| Path | Result | Interpretation |
|------|--------|----------------|
| GHA Staging Keep Warm [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561) (2026-07-26 schedule) | `healthy_count=3/3` — api HTTP 200 `{"status":"ok"}` (~63s), ai HTTP 200 (~22s), web HTTP 200 (~33s) | **AMBER** free-tier reachability only; cold-start latency still on critical path |
| Plan / Instance Type | Still **free** (blueprint `render.yaml` `plan: free`; no Starter upgrade performed) | Cold-start sleep remains |

### Owner next clicks (exact path)

From [deploy-staging-render.md § Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner). Do **not** invent payment. Owner must:

| # | Click path |
|---|------------|
| 1 | https://dashboard.render.com/u/billing → **Add payment method** |
| 2 | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg (`omni-api-staging`) → **Settings** → **Instance Type** → **Free** → **Starter** → **Save** |
| 3 | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg (`omni-ai-staging`) → same Free → Starter → Save |
| 4 | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg (`omni-web-staging`) → same Free → Starter → Save |
| 5 | Optional: `render.yaml` `plan: free` → `plan: starter` for all three; commit |
| 6 | Post-upgrade external proof: stable HTTP 200 on api `/health`, ai `/health`, web `/` with **no** 30–90s cold-start after idle — then mark R0.2 **GREEN** |

**Not claimed:** R0.2 GREEN · always-on · Starter plan on any of the three services.

## Wave E4 Task 3 — R0.4 Meta App Review re-attempt (2026-07-26)

**SDD plan:** [2026-07-26-sdd-e4-owner-path.md](../superpowers/plans/2026-07-26-sdd-e4-owner-path.md) · **Branch:** `cursor/e4-owner-path` · **Attempt:** R0.4 re-attempt

### Verdict: **BLOCKED** (not Submitted / not Approved)

Agent cannot log into Meta App Dashboard. Parent `META_APP_ID` / `META_APP_SECRET` remain placeholderish (len=7). R0.2 always-on remains **BLOCKED** — webhook reliability prerequisite for App Review.

### Probes (secret values never printed)

| Source | Key | present | len | placeholderish |
|--------|-----|---------|-----|----------------|
| Parent `.env` | `META_APP_ID` | yes | 7 | **true** |
| Parent `.env` | `META_APP_SECRET` | yes | 7 | **true** |
| Parent `.env` | `META_VERIFY_TOKEN` | yes | 32 | **false** (local only — not proof on Render) |
| Parent `.env` | `META_REDIRECT_URI` | yes | 48 | local `http://127.0.0.1:3000/settings/channels/callback` (≠ staging) — *legacy port*; current SoT web **:4700** |
| Parent `.env.staging.local` | same four keys | same lens / same placeholderish flags; `VERIFY_TOKEN` hash-equal to `.env` | | |
| `.env.example` | `META_APP_ID` / `SECRET` / `VERIFY_TOKEN` | yes | 24 / 28 / 37 | **true** (known placeholders) |
| `render.yaml` | `META_APP_ID` / `SECRET` / `VERIFY_TOKEN` | `sync: false` | — | dashboard-only |
| `render.yaml` | `META_REDIRECT_URI` | pinned staging callback | — | correct staging value |

No credentials invented. No secret values printed or committed.

### Public / reachability checks

| Path | Result | Interpretation |
|------|--------|----------------|
| Local curl Privacy / Terms | **timeout ~15s** | Known local network block of `onrender.com` |
| Local curl API `/health` | **timeout ~15s** | Cannot warm-verify webhook from this host |
| Webhook GET challenge | **SKIPPED** | No warm local path to API; do not use token against unreachable host |
| GHA keep-warm [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561) | `healthy_count=3/3` (api/ai/web HTTP 200; web hits `/` only) | **AMBER** free-tier reachability only — not legal-page proof; not R0.2 GREEN |
| R0.2 always-on | **BLOCKED** (E4 Task 2) | Webhook may cold-start during App Review |

Prep pack status rows refreshed: [p0-meta-app-review-submit.md](./p0-meta-app-review-submit.md).

### Owner next clicks (exact path from prep pack)

Do **not** invent Meta credentials. Owner must:

| # | Action |
|---|--------|
| 1 | Complete [R0.2 always-on](./deploy-staging-render.md#upgrade-to-always-on-owner) — `omni-api-staging` Starter **minimum** (webhook must not cold-start during review) |
| 2 | Create/select Meta Business app → copy **App ID** + **App Secret** |
| 3 | Render `omni-api-staging` env: set real `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (8+ chars) — https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| 4 | Meta App → Webhooks: callback `https://omni-api-staging-cs2w.onrender.com/v1/webhooks/meta` + verify token + Page `messages` |
| 5 | Meta App → Facebook Login: Valid OAuth Redirect URIs = `https://omni-web-staging.onrender.com/settings/channels/callback` |
| 6 | Meta App → Settings → Basic: Privacy `…/legal/privacy` + Terms `…/legal/terms` |
| 7 | Test Page + IG Professional + testers ([checklist §6](../meta-app-review-checklist.md#6-test-users--assets)) |
| 8 | Screencast + use-case text ([checklist §2](../meta-app-review-checklist.md#2-permissions-to-request-phase-1)); permissions: `pages_show_list`, `pages_messaging`, `instagram_basic`, `instagram_manage_messages`, `pages_read_engagement` |
| 9 | Submit App Review → Permissions and Features (Advanced Access) — **do not** switch app to Live until approved |
| 10 | Update this evidence R0.4 with **Submitted at** date only (not Approved until Meta approves) |

**Not claimed:** Submitted · Approved · R0.4 GREEN · webhook verify 200 · legal pages 200 from this agent host.

## Wave E4 SDD gate (2026-07-26) — eng CLOSED / owner STOP

**SDD plan:** [2026-07-26-sdd-e4-owner-path.md](../superpowers/plans/2026-07-26-sdd-e4-owner-path.md) · **Branch:** `cursor/e4-owner-path` · **PR:** [#24](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/24) · **Base:** `main` @ `0221a4c` (PR #23 MERGED)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Land completion-step-by-step + SoT links | **GREEN** | Checklist `2026-07-25-completion-step-by-step.md` + path-to-100 / remaining links; E4 plan + progress ledger; draft **PR #24** |
| **T2** Re-attempt R0.2 Render Starter ×3 | **BLOCKED** | `RENDER_API_KEY` ABSENT; Free→Starter SKIPPED; keep-warm [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561) 3/3 = AMBER ≠ always-on; [Task 2 section](#wave-e4-task-2--r02-render-always-on-re-attempt-2026-07-26) |
| **T3** Re-attempt R0.4 Meta App Review | **BLOCKED** | Placeholderish `META_*` (APP_ID/SECRET len=7); no Meta dashboard submit; R0.2 prereq; [Task 3 section](#wave-e4-task-3--r04-meta-app-review-re-attempt-2026-07-26) |
| **T4** Eng parallel I8 access review dry-run | **AMBER** | Dry-run 2026-07-26: local+staging REST OK; `platform_admins` count=0; biên bản [access-review-2026-07-26-dry-run.md](./access-review-2026-07-26-dry-run.md); **not** quarterly signed GREEN; **not** E100 |
| **T5** Gate + STOP | **GREEN** | This section; path-to-100 / remaining / step-by-step “tiếp theo ngay” = owner-only; **controller STOPS** |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau E4 eng | Còn thiếu (không phải eng SDD) |
|------|---------------|--------------------------------|
| **Eng path** | ~**95%**+ | E0.2 GEMINI local; E0.4 stub decisions; live R2 polish |
| **CPC thương mại** | ~**38%** | **NOT 100%** — R0.2/R0.4 → R0.3b → Gate R0 → R1 paid → R2.1–2.3 live → R2.7 |
| **E100** | ~**22%**+ | **NOT 100%** — R3 SOC2/pen-test/SSO/SLA + I8 quarterly signed (dry-run AMBER only) |
| **Tổng intended** | ~**55%** | CPC GREEN **và** E100 GREEN — **NOT 100%** |

**Gate E4 verdict: eng CLOSED / STOP.** R0.2 and R0.4 remain **BLOCKED** after re-attempt. I8 dry-run is **AMBER** (not quarterly GREEN). CPC thương mại and E100 remain **not** 100%.

| Blocker | Owner / vendor next action |
|---------|----------------------------|
| **R0.2** | Render payment → Starter × `omni-api/ai/web-staging` ([owner unblock](#r02-owner-unblock-always-on)) |
| **R0.4** | Real `META_*` on API + App Review submit ([owner unblock](#r04-owner-unblock-meta-app-review)) |
| **R0.3b** | Staging full §12.1 after R0.2 + R0.4 → Gate R0 |
| **R1** | Paid (Pro/PITR/always-on prod / LLM / billing) after Gate R0 |
| **R2** | Carrier/COD/returns live → CPC checklist |
| **R3 / I8** | Quarterly signed access review + SOC2 / pen-test / SSO / SLA → E100 |

**Controller STOP.** Wave E4 CLOSED. Resume eng SDD only when owner unblocks R0.2/R0.4 or provides keys. Do not invent Meta/Render/Supabase Pro credentials. Do not claim CPC / E100 / tổng 100%.

## Wave E5 Task 2 — R0.2 Render always-on re-probe (2026-07-26)

**SDD plan:** [2026-07-26-sdd-e5-owner-path.md](../superpowers/plans/2026-07-26-sdd-e5-owner-path.md) · **Branch:** `cursor/e5-owner-path` · **Attempt:** R0.2 re-probe

### Verdict: **BLOCKED** (not GREEN)

Always-on Starter was **not** applied. Keep-warm reachability is **AMBER only** — **not** R0.2 GREEN.

### Probes (secret values never printed)

| Probe | Result |
|-------|--------|
| `env:RENDER_API_KEY` / `RENDER_API_TOKEN` | **ABSENT** |
| Parent `.env` / `.env.staging.local` / `.env.example` | **ABSENT** (no `RENDER_API_KEY=` / `TOKEN=` line with a real value) |
| Worktree `.env*` | **ABSENT** |
| Parent `.local-secrets/*` (incl. `render-*-create.json`, `render-staging-keys.json`, `keys-raw.txt`) | **ABSENT** (no `RENDER_API_KEY` / `apiKey` / `rnd_` shape) |
| GitHub Actions secrets (`gh secret list`) | **ABSENT** (empty secret list / no `RENDER_API_KEY`) |
| Render API Free→Starter for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` | **SKIPPED** — no API key; payment UI cannot be invented by agent |

### Health / reachability (free tier)

| Path | Result | Interpretation |
|------|--------|----------------|
| GHA Staging Keep Warm [30196670571](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30196670571) (2026-07-26 schedule) | `healthy_count=3/3` — api HTTP 200 `{"status":"ok"}` (~43s), ai HTTP 200 (~22s), web HTTP 200 (~52s) | **AMBER** free-tier reachability only; cold-start latency still on critical path — **≠ GREEN** |
| Prior E4 keep-warm [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561) | `healthy_count=3/3` | Same AMBER interpretation |
| Plan / Instance Type | Still **free** (blueprint `render.yaml` `plan: free`; no Starter upgrade performed) | Cold-start sleep remains |

### Owner next clicks (exact path)

From [deploy-staging-render.md § Upgrade to always-on (owner)](./deploy-staging-render.md#upgrade-to-always-on-owner). Do **not** invent payment. Owner must:

| # | Click path |
|---|------------|
| 1 | https://dashboard.render.com/u/billing → **Add payment method** |
| 2 | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg (`omni-api-staging`) → **Settings** → **Instance Type** → **Free** → **Starter** → **Save** |
| 3 | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg (`omni-ai-staging`) → same Free → Starter → Save |
| 4 | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg (`omni-web-staging`) → same Free → Starter → Save |
| 5 | Optional: `render.yaml` `plan: free` → `plan: starter` for all three; commit |
| 6 | Post-upgrade external proof: stable HTTP 200 on api `/health`, ai `/health`, web `/` with **no** 30–90s cold-start after idle — then mark R0.2 **GREEN** |

**Not claimed:** R0.2 GREEN · always-on · Starter plan on any of the three services.

## Wave E5 Task 3 — R0.4 Meta App Review re-probe (2026-07-26)

**SDD plan:** [2026-07-26-sdd-e5-owner-path.md](../superpowers/plans/2026-07-26-sdd-e5-owner-path.md) · **Branch:** `cursor/e5-owner-path` · **Attempt:** R0.4 re-probe

### Verdict: **BLOCKED** (not Submitted / not Approved)

Agent cannot log into Meta App Dashboard. Parent `META_APP_ID` / `META_APP_SECRET` remain placeholderish (len=7). R0.2 always-on remains **BLOCKED** (E5 Task 2) — webhook reliability prerequisite for App Review.

### Probes (secret values never printed)

| Source | Key | present | len | placeholderish |
|--------|-----|---------|-----|----------------|
| Parent `.env` | `META_APP_ID` | yes | 7 | **true** |
| Parent `.env` | `META_APP_SECRET` | yes | 7 | **true** |
| Parent `.env` | `META_VERIFY_TOKEN` | yes | 32 | **false** (local only — not proof on Render) |
| Parent `.env` | `META_REDIRECT_URI` | yes | 48 | local `127.0.0.1` (≠ staging) |
| Parent `.env.staging.local` | same four keys | same lens / same placeholderish flags; `VERIFY_TOKEN` hash-equal to `.env` | | |
| `.env.example` | `META_APP_ID` / `SECRET` / `VERIFY_TOKEN` | yes | 24 / 28 / 37 | **true** (known placeholders) |
| `render.yaml` | `META_APP_ID` / `SECRET` / `VERIFY_TOKEN` | `sync: false` | — | dashboard-only |
| `render.yaml` | `META_REDIRECT_URI` | pinned staging callback | — | correct staging value |

No credentials invented. No secret values printed or committed.

### Public / reachability checks

| Path | Result | Interpretation |
|------|--------|----------------|
| Legal URL / webhook GET | **SKIPPED** | Creds placeholderish — plan gate requires real Meta creds before public verify / submit |
| GHA keep-warm [30196670571](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30196670571) | `healthy_count=3/3` (api/ai/web HTTP 200; web hits `/` only) | **AMBER** free-tier reachability only — not legal-page proof; not R0.2 GREEN |
| R0.2 always-on | **BLOCKED** (E5 Task 2) | Webhook may cold-start during App Review |

Prep pack status rows refreshed: [p0-meta-app-review-submit.md](./p0-meta-app-review-submit.md).

### Owner next clicks (exact path from prep pack)

Do **not** invent Meta credentials. Owner must:

| # | Action |
|---|--------|
| 1 | Complete [R0.2 always-on](./deploy-staging-render.md#upgrade-to-always-on-owner) — `omni-api-staging` Starter **minimum** (webhook must not cold-start during review) |
| 2 | Create/select Meta Business app → copy **App ID** + **App Secret** |
| 3 | Render `omni-api-staging` env: set real `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (8+ chars) — https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg |
| 4 | Meta App → Webhooks: callback `https://omni-api-staging-cs2w.onrender.com/v1/webhooks/meta` + verify token + Page `messages` |
| 5 | Meta App → Facebook Login: Valid OAuth Redirect URIs = `https://omni-web-staging.onrender.com/settings/channels/callback` |
| 6 | Meta App → Settings → Basic: Privacy `…/legal/privacy` + Terms `…/legal/terms` |
| 7 | Test Page + IG Professional + testers ([checklist §6](../meta-app-review-checklist.md#6-test-users--assets)) |
| 8 | Screencast + use-case text ([checklist §2](../meta-app-review-checklist.md#2-permissions-to-request-phase-1)); permissions: `pages_show_list`, `pages_messaging`, `instagram_basic`, `instagram_manage_messages`, `pages_read_engagement` |
| 9 | Submit App Review → Permissions and Features (Advanced Access) — **do not** switch app to Live until approved |
| 10 | Update this evidence R0.4 with **Submitted at** date only (not Approved until Meta approves) |

**Not claimed:** Submitted · Approved · R0.4 GREEN · webhook verify 200 · legal pages 200 from this agent host.

## Wave E5 SDD gate (2026-07-26) — eng CLOSED / owner STOP

**SDD plan:** [2026-07-26-sdd-e5-owner-path.md](../superpowers/plans/2026-07-26-sdd-e5-owner-path.md) · **Branch:** `cursor/e5-owner-path` · **PR:** [#25](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/25) · **Base:** `main` @ `9e5976f` (PR #24 MERGED)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Plan + branch + draft PR | **GREEN** | Plan `2026-07-26-sdd-e5-owner-path.md` + progress ledger; draft **PR #25** |
| **T2** Re-probe R0.2 Render Starter ×3 | **BLOCKED** | `RENDER_API_KEY` ABSENT; Free→Starter SKIPPED; keep-warm [30196670571](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30196670571) 3/3 = AMBER ≠ always-on; [Task 2 section](#wave-e5-task-2--r02-render-always-on-re-probe-2026-07-26) |
| **T3** Re-probe R0.4 Meta App Review | **BLOCKED** | Placeholderish `META_*` (APP_ID/SECRET len=7); no Meta dashboard submit; R0.2 prereq; [Task 3 section](#wave-e5-task-3--r04-meta-app-review-re-probe-2026-07-26) |
| **T4** Eng parallel I5 notify process | **GREEN/AMBER** | Runbook [subprocessors-change-notify.md](../runbooks/subprocessors-change-notify.md); eng process template ready; **legal/owner approve still AMBER** — **not** I5 full GREEN; **not** E100 |
| **T5** Gate + STOP | **GREEN** | This section; path-to-100 / remaining / step-by-step “tiếp theo ngay” = owner-only; **controller STOPS** |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau E5 eng | Còn thiếu (không phải eng SDD) |
|------|---------------|--------------------------------|
| **Eng path** | ~**95%**+ | E0.2 GEMINI local; E0.4 stub decisions; live R2 polish |
| **CPC thương mại** | ~**38%** | **NOT 100%** — R0.2/R0.4 → R0.3b → Gate R0 → R1 paid → R2.1–2.3 live → R2.7 |
| **E100** | ~**22%**+ | **NOT 100%** — R3 SOC2/pen-test/SSO/SLA + I5 legal approve + I8 quarterly signed |
| **Tổng intended** | ~**55%** | CPC GREEN **và** E100 GREEN — **NOT 100%** |

**Gate E5 verdict: eng CLOSED / STOP.** R0.2 and R0.4 remain **BLOCKED** after re-probe. I5 notify process is eng **GREEN/AMBER** (legal still AMBER). CPC thương mại and E100 remain **not** 100%.

**Hard STOP:** further eng-only SDD waves **without** owner R0.2 + R0.4 will **not** advance CPC / E100 to 100%.

| Blocker | Owner / vendor next action |
|---------|----------------------------|
| **R0.2** | Render payment → Starter × `omni-api/ai/web-staging` ([owner unblock](#r02-owner-unblock-always-on)) |
| **R0.4** | Real `META_*` on API + App Review submit ([owner unblock](#r04-owner-unblock-meta-app-review)) |
| **R0.3b** | Staging full §12.1 after R0.2 + R0.4 → Gate R0 |
| **R1** | Paid (Pro/PITR/always-on prod / LLM / billing) after Gate R0 |
| **R2** | Carrier/COD/returns live → CPC checklist |
| **R3 / I5 / I8** | I5 legal approve notify + I8 quarterly signed + SOC2 / pen-test / SSO / SLA → E100 |

**Controller STOP.** Wave E5 CLOSED. Resume eng SDD only when owner unblocks R0.2/R0.4 or provides keys. Do not invent Meta/Render/Supabase Pro credentials. Do not claim CPC / E100 / tổng 100%.

## Wave L1 Task 2 — Local stack verify (2026-07-26) — *legacy evidence* (pre-port-lock)

Ports in this table (`:3000` / `:3001` / `:8000` / `:54321`) predate the Omni lock. **Current SoT:** 4700 / 4701 / 4702 / 4788 / 54721 ([local-ports.md](./local-ports.md)). Kept for history only.

**SDD plan:** [2026-07-26-sdd-l1-local-first.md](../superpowers/plans/2026-07-26-sdd-l1-local-first.md) · **Branch:** `cursor/l1-local-first` · **Playbook:** [local-host.md](./local-host.md)

| Check | Result |
|-------|--------|
| Docker + `npx supabase status` | **PASS** — `API_URL=http://127.0.0.1:54321`; containers up (vector restarting non-blocking) |
| Env → local Supabase | **PASS** — parent `.env` / `apps/web/.env.local` `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` = `http://127.0.0.1:54321` |
| api `GET :3001/health` | **PASS** — 200 `{"status":"ok"}` |
| ai `GET :8000/health` | **PASS** — 200 `{"status":"ok"}` |
| web `GET :3000/` | **PASS** — 200 (`Omni Commerce`) |
| Supabase auth | **PASS** — `GET :54321/auth/v1/health` 200 |
| Meta criteria (walkthrough 2, 4) | **BLOCKED** — localhost cannot receive Meta webhooks (expected; OK for L1) |
| Walkthrough refresh | **DONE** — [p0-staging-walkthrough-12-1.md](./p0-staging-walkthrough-12-1.md) non-Meta dates + health; Meta stays BLOCKED |

**Verdict:** local eng surface **PASS**. R0.3 remains **AMBER** (Meta BLOCKED; chunks pending Task 3). No CPC / E100 / tổng 100% claim. Render/Meta still deferred until CPC claim.

## Wave L1 Task 3 — E0.2 local stub embeddings (2026-07-26)

**SDD plan:** [2026-07-26-sdd-l1-local-first.md](../superpowers/plans/2026-07-26-sdd-l1-local-first.md) · **Branch:** `cursor/l1-local-first` · **Playbook:** [local-host.md](./local-host.md)

| Check | Result |
|-------|--------|
| Parent `GEMINI_API_KEY` | **EMPTY** — len=0 (value not printed) → stub path |
| Stub provider | **PASS** — deterministic 768-d `local-stub-embeddings`; factory wired into reindex + process-message |
| Prod guard | **PASS** — refused when `APP_ENV`/`NODE_ENV=production` even with `EMBEDDINGS_ALLOW_STUB=1` |
| Pytest `tests/test_stub_embeddings.py` | **PASS** |
| Live `knowledge_chunks` > 0 smoke | **DOCUMENTED** — optional; needs Inngest + AI restart ([local-host](./local-host.md)) |
| Gemini / CPC quality claim | **NONE** — stub explicitly non-production / not live LLM quality |

**Verdict:** E0.2 eng path **GREEN** for local-only (stub). E0.2 live Gemini still optional when key present. No CPC / E100 claim.

## Wave L1 SDD gate (2026-07-26) — local-first eng CLOSED; CPC claim deferred

**SDD plan:** [2026-07-26-sdd-l1-local-first.md](../superpowers/plans/2026-07-26-sdd-l1-local-first.md) · **Branch:** `cursor/l1-local-first` · **PR:** [#26](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/26) · **Base:** `main` @ `51f5370` (PR #25 MERGED)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Local-first SoT + plan + draft PR | **GREEN** | SoT reorder (Pha Local NOW; Render/Meta under CPC claim); plan + ledger; draft **PR #26** |
| **T2** Local stack verify + non-Meta walkthrough | **PASS** | Health 3/3 + Supabase; Meta BLOCKED OK; [Task 2 section](#wave-l1-task-2--local-stack-verify-2026-07-26) |
| **T3** E0.2 stub embeddings | **GREEN** (local) | Deterministic stub when `GEMINI_API_KEY` empty; prod refuse; pytest green; [Task 3 section](#wave-l1-task-3--e02-local-stub-embeddings-2026-07-26) |
| **T4** E0.4 local-phase stub notes | **GREEN** | [cpc-checklist § Stub](../superpowers/plans/cpc-checklist.md#stub-decisions-owner): undecided OK local; **must** REQUIRED/AMBER_OK before CPC; no forged owner signature |
| **T5** Gate + STOP | **GREEN** | This section; post-L1 “tiếp theo ngay” = next local work **or** when-ready CPC claim path |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau L1 eng | Còn thiếu |
|------|---------------|-----------|
| **Eng path** | ~**96%**+ | Live R2 polish; owner E0.4 Decision before CPC; optional real GEMINI |
| **CPC thương mại** | ~**38%** | **NOT 100%** — R0.2/R0.4 → R0.3b → Gate R0 → R1 paid → R2.1–2.3 live → R2.7 + E0.4 decide |
| **E100** | ~**22%**+ | **NOT 100%** — R3 SOC2/pen-test/SSO/SLA + I5 legal + I8 quarterly |
| **Tổng intended** | ~**55%** | CPC GREEN **và** E100 GREEN — **NOT 100%** |

**Gate L1 verdict: local-first eng CLOSED.** Eng local path advanced (SoT · stack · stub embeddings · E0.4 notes). **CPC thương mại and E100 remain not 100%.** Render Starter / Meta App Review stay **deferred** until owner opens Pha CPC claim — **not** “tiếp theo ngay”.

| Blocker / next | When |
|----------------|------|
| **Next local** (optional) | Further local polish / feature eng on Docker + `dev:local` — no Render payment required |
| **R0.2 / R0.4** | **Khi claim CPC only** — payment → Starter ×3; real `META_*` + App Review |
| **R0.3b → Gate R0** | After R0.2 + R0.4 |
| **E0.4 Decision** | Owner fills REQUIRED/AMBER_OK before R2.7 / CPC checklist verdict |
| **R1 → R2 → CPC** | After Gate R0 |
| **R3 → E100** | After CPC thương mại |

**Controller STOP (L1).** Wave L1 CLOSED. Continue later local eng waves **or** wait until owner starts CPC claim path. Do not invent Meta/Render credentials. Do not claim CPC / E100 / tổng 100%.

## Wave L2 progress ledger (2026-07-26) — code-complete local; commercial deferred

**SDD plan:** [2026-07-26-sdd-l2-code-complete.md](../superpowers/plans/2026-07-26-sdd-l2-code-complete.md) · **Branch:** `cursor/l2-code-complete` · **Worktree:** `.worktrees/l2-code` · **Base:** `main` @ `5fea338` (PR #26 MERGED) · **PR:** [#27](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/27) (draft)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Plan + SoT code-first + ledger | **GREEN** | Plan `2026-07-26-sdd-l2-code-complete.md`; path-to-100 / completion-step-by-step / remaining “tiếp theo ngay” = **NOW = L2 code-complete local**; CPC claim deferred · commit `980bb4f` |
| **T2** Invite list + accept loop | **GREEN** | `GET /v1/orgs/:orgId/invites` · `POST /v1/invites/accept` · create returns raw `token` once · web settings/invites · OpenAPI · vitest identity+org.guard **17/17 PASS** |
| **T3** Inngest in `dev:local` + chunks smoke | **GREEN** | `scripts/dev-local.ps1` starts/stops Inngest (`-u http://127.0.0.1:3001/api/inngest` — *legacy*; current SoT `:4701` / Inngest `:4788`); stub `APP_ENV`/`EMBEDDINGS_ALLOW_STUB`; smoke stub reindex → `knowledge_chunks` count **1** (not Gemini quality) · [local-host](./local-host.md) |
| **T4** Advisor aggregates + Zalo runbook | **GREEN** | Real catalog/sales aggregates from `products`/`product_variants`/`orders` (empty-state OK; no invented Meta ads); `zalo-oa-connect.md` + `phase2-operations.md` note worker `zalo-persist-inbound` shipped — remaining gap = full OAuth vs token paste |
| **T5** CI Node 22 + L2 gate | **GREEN** | `node-version: 22` in `ci-api`/`ci-web`/`ci-isolation`/`scheduled-qa` (matches `engines.node >=22` + `.nvmrc`); this gate section |

**Constraints (active):** No Render payment · Meta may stay BLOCKED · No CPC / E100 / tổng 100% claim.

## Wave L2 SDD gate (2026-07-26) — code-complete local CLOSED; commercial deferred

**SDD plan:** [2026-07-26-sdd-l2-code-complete.md](../superpowers/plans/2026-07-26-sdd-l2-code-complete.md) · **Branch:** `cursor/l2-code-complete` · **Worktree:** `.worktrees/l2-code` · **PR:** [#27](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/27) · **Base:** `main` @ `5fea338` (PR #26 MERGED)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Plan + SoT code-first + ledger | **GREEN** | Plan + “tiếp theo ngay” = L2; CPC deferred · `980bb4f` |
| **T2** Invite list + accept loop | **GREEN** | List + accept + raw token once · web · OpenAPI · vitest identity+org.guard |
| **T3** Inngest in `dev:local` + chunks smoke | **GREEN** | Inngest in `dev:local`; stub reindex → `knowledge_chunks` > 0 · [local-host](./local-host.md) |
| **T4** Advisor aggregates + Zalo runbook | **GREEN** | Real catalog/sales aggregates; Zalo worker shipped note · `d9d6c41` |
| **T5** CI Node 22 + L2 gate | **GREEN** | CI Node **22** aligned with `engines` / `.nvmrc`; this section |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau L2 eng | Còn thiếu |
|------|---------------|-----------|
| **Eng path** | ~**97%**+ | Optional further local hardening; live R2 polish; owner E0.4 Decision before CPC; optional real GEMINI |
| **CPC thương mại** | ~**38%** | **NOT 100%** — R0.2/R0.4 → R0.3b → Gate R0 → R1 paid → R2.1–2.3 live → R2.7 + E0.4 decide |
| **E100** | ~**22%**+ | **NOT 100%** — R3 SOC2/pen-test/SSO/SLA + I5 legal + I8 quarterly |
| **Tổng intended** | ~**55%** | CPC GREEN **và** E100 GREEN — **NOT 100%** |

**Gate L2 verdict: eng code-complete local CLOSED / advanced.** Invites · Inngest · advisor aggregates · CI Node 22 landed. **CPC thương mại and E100 remain not 100%.** Render Starter / Meta App Review stay **deferred** until owner opens Pha CPC claim — **not** default “tiếp theo ngay”.

| Blocker / next | When |
|----------------|------|
| **Next (default)** | Continue local hardening on Docker + `dev:local` — no Render payment required |
| **OR CPC claim** | Owner chooses when ready — R0.2 payment → Starter ×3; real `META_*` + App Review |
| **R0.3b → Gate R0** | After R0.2 + R0.4 |
| **E0.4 Decision** | Owner fills REQUIRED/AMBER_OK before R2.7 / CPC checklist verdict |
| **R1 → R2 → CPC** | After Gate R0 |
| **R3 → E100** | After CPC thương mại |

**Controller STOP (L2).** Wave L2 CLOSED. **Tiếp theo ngay** = continue local hardening **OR** (when ready) CPC claim — **owner chooses**; **default remains local**. Do not invent Meta/Render credentials. Do not claim CPC / E100 / tổng 100%.

## Wave L3 progress ledger (2026-07-26) — Gate A Code local READY; commercial deferred

**SDD plan:** [2026-07-26-sdd-l3-gate-a.md](../superpowers/plans/2026-07-26-sdd-l3-gate-a.md) · **Branch:** `cursor/l3-gate-a` · **Worktree:** `.worktrees/l3-code` · **Base:** `main` @ `e2105a6` (PR #27 MERGED) · **SoT:** [completion-priority-code-first](../superpowers/plans/2026-07-26-completion-priority-code-first.md)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Land code-first SoT + L3 plan + ledger | **GREEN** | SoT `2026-07-26-completion-priority-code-first.md` + path-to-100 / remaining / completion-step-by-step; plan `2026-07-26-sdd-l3-gate-a.md`; this ledger · parent `main` clean after copy |
| **T2** A1 local walkthrough smoke post-L2 | **GREEN** | Non-Meta §12.1 re-smoke: invite create+accept · product · stock · draft→confirm · export CSV 200 · advisor suggest · stub Inngest → `knowledge_chunks` > 0 (org count 1; local total ≥ 3). Meta 2/4 **BLOCKED OK**. Inbox live SKIP (empty org; prior unit PASS). Ops note: orphan AI on `:8000` (*legacy*; current SoT AI **:4702**) without stub caused transient `502 GEMINI…` — killed spawn child + restarted AI with stub. Walkthrough [p0-staging-walkthrough-12-1](./p0-staging-walkthrough-12-1.md) updated |
| **T3** A2 minimal local e2e smoke | **GREEN** | `scripts/local-e2e-smoke.mjs` + `pnpm test:e2e:local` — health→signup→org→invite accept→catalog→stock→draft→confirm→export CSV; fails if `/health` down · [local-host](./local-host.md) |
| **T4** A3 ESLint real OR remove unused + typecheck | **GREEN** | Removed unused root `eslint` + empty `eslint.config.js`; `lint`/`typecheck` = `tsc --noEmit` on api/web/authz-types/db (turbo 4 pkgs, no silent skip); `pnpm lint` + `pnpm typecheck` GREEN; README documents scope |
| **T5** A4 isolation + A5 OpenAPI honesty + Gate A + STOP | **GREEN** | A4: removed `it.skip`; `cross-tenant.rls.spec.ts` migration proof + Docker Data API (memberships/entitlements/feature_flags UPDATE denied; cross-tenant SELECT empty); `pnpm test:isolation` **8/8 pass · 0 skip**; CI starts Supabase. A5: `packages/api-client` marked **DEPRECATED/STUB**; SoT client = `apps/web/src/lib/api-client.ts`; invite paths already in OpenAPI (L2) — no drift claim. Gate A section below |

**Constraints (active):** Local only · No Render payment · Meta BLOCKED OK · Gate A = wave success · No CPC / E100 / tổng 100% claim · “100%” this wave = **Gate A Code local READY** only.

## Wave L3 Gate A (2026-07-26) — Code local READY = YES; commercial deferred

**SDD plan:** [2026-07-26-sdd-l3-gate-a.md](../superpowers/plans/2026-07-26-sdd-l3-gate-a.md) · **Branch:** `cursor/l3-gate-a` · **Worktree:** `.worktrees/l3-code` · **PR:** [#28](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/28) · **SoT:** [completion-priority-code-first](../superpowers/plans/2026-07-26-completion-priority-code-first.md)

| Task | Status | Evidence |
|------|--------|----------|
| **T1** Land code-first SoT + L3 plan + ledger | **GREEN** | SoT + plan + ledger · parent `main` clean after copy |
| **T2** A1 local walkthrough smoke | **GREEN** | Non-Meta §12.1 re-smoke PASS; Meta **BLOCKED OK** · [walkthrough](./p0-staging-walkthrough-12-1.md) |
| **T3** A2 minimal local e2e smoke | **GREEN** | `pnpm test:e2e:local` / `scripts/local-e2e-smoke.mjs` |
| **T4** A3 lint/typecheck honesty | **GREEN** | Unused eslint removed; monorepo `lint`/`typecheck` = tsc GREEN |
| **T5** A4 isolation + A5 client honesty + Gate A | **GREEN** | Isolation **8/8 · 0 skip**; api-client README deprecated/honest; this section |

### Gate A checklist (code-first § A8)

| Checklist | Status |
|-----------|--------|
| `pnpm --filter api test` xanh (prior / regression) | **YES** (baseline kept; not re-run this task) |
| `uv run pytest` (apps/ai) xanh (prior / regression) | **YES** (baseline kept; not re-run this task) |
| `pnpm test:isolation` xanh (**0 skip**) | **YES** — 8 passed / 0 skipped |
| Walkthrough non-Meta A1 PASS | **YES** (T2) |
| A2 e2e smoke xanh | **YES** (T3) |
| A3 lint/typecheck xanh | **YES** (T4) |
| No P0 open (invite/confirm/knowledge) | **YES** (L2 + T2 smoke) |
| Meta/Zalo/e-invoice live | **Not required** for Gate A |

**Gate A Code local READY = YES.**

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau Gate A | Còn thiếu |
|------|---------------|-----------|
| **Eng path / Gate A** | **READY** (local) | Optional polish (A6 offline SW · A7 Zalo decision) — not blockers |
| **CPC thương mại** | ~**38%** | **NOT 100%** — Render Starter · Meta App Review · Gate R0 → R1 → R2 → CPC |
| **E100** | ~**22%**+ | **NOT 100%** — Plan I / SOC2 / pen-test / SSO / SLA |
| **Tổng intended** | ~**55%** | CPC **và** E100 — **NOT 100%** |

| Blocker / next | When |
|----------------|------|
| **Next (default)** | Optional local polish **OR** idle until owner wants commercial |
| **Pha B (commercial)** | **Only when owner wants to sell** — Render payment → Meta → R0… |
| **CPC / E100** | Still **deferred** — do not claim 100% |

**Controller STOP (L3).** Wave L3 **CLOSED**. Progress **DONE**. **Tiếp theo ngay** = optional polish **OR** Pha B when owner wants commercial. Do not invent Meta/Render credentials. Do not claim CPC / E100 / tổng 100%.

## Wave P0 / Gate A re-verify 2026-07-27

**SDD plan:** [2026-07-27-sdd-p0-post-audit.md](../superpowers/plans/2026-07-27-sdd-p0-post-audit.md) · **Branch:** `cursor/p0-post-audit` · **PR:** [#31](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/31) · **SoT ports:** `config/local-ports.json` → web **4700** · api **4701** · ai **4702** · inngest **4788** · supabase **54721**

**Date:** 2026-07-27 · **Evidence commit:** `016672b` (parent `527c1e7`)

### Stack health (locked ports)

| URL | Result |
|-----|--------|
| `http://127.0.0.1:4700/` | **200** |
| `http://127.0.0.1:4701/health` | **200** `{"status":"ok"}` |
| `http://127.0.0.1:4702/health` | **200** `{"status":"ok"}` |
| `http://127.0.0.1:54721/auth/v1/health` | **200** (GoTrue) after `npx supabase stop` + `start` on locked ports |

**Ops note (port lock):** Before re-bind, Docker Kong for `omni-commerce` was still on legacy `:54321` while `config.toml` / status reported `:54721`. Host process **AgentsRoom.exe** held `127.0.0.1:54721` (404 on auth) — stopped to free SoT port, then Supabase Kong rebound `0.0.0.0:54721`. Stale shell `SUPABASE_URL=http://127.0.0.1:54321` overrode repo `.env` in e2e — fixed in `scripts/local-e2e-smoke.mjs` (prefer repo `.env` + `local-ports.json`).

### Gate A commands

| Command | Result |
|---------|--------|
| `pnpm --filter @omni/api test` | **GREEN** — 50 files · **185** tests passed |
| `uv run pytest` (`apps/ai`) | **GREEN** — **37** passed (2 deprecation warnings) |
| `pnpm test:isolation` | **GREEN** — 3 files · **8** passed · **0** skipped |
| `pnpm test:e2e:local` | **GREEN** — health→auth→org→invite→catalog→stock→draft→confirm→export CSV (API `:4701` · Supabase `:54721`) |
| `pnpm lint` | **GREEN** — turbo 5/5 successful (4 pkgs lint + authz-types build) |
| `pnpm typecheck` | **GREEN** — turbo 5/5 successful |

### Gate A checklist (re-verify)

| Checklist | Status |
|-----------|--------|
| API unit tests | **YES** — 185/185 |
| AI pytest | **YES** — 37/37 |
| Isolation (**0 skip**) | **YES** — 8/8 |
| Local e2e smoke | **YES** |
| lint / typecheck | **YES** |
| Meta / Zalo / e-invoice live | **BLOCKED OK** — not required for Gate A / Wave P0.1 |
| CPC / E100 / tổng 100% | **NOT claimed** |

**P0.1 Gate A regression = GREEN** on locked ports. Meta still **BLOCKED OK**. CPC thương mại / E100 / tổng intended remain **not 100%**.

| Blocker / next | When |
|----------------|------|
| **Next (Wave P0)** | Task 3 docs ports drift · Task 4 optional A6/A7 + Gate P0 close |
| **Pha B** | Owner-only — Render / Meta commercial |
| **AgentsRoom vs :54721** | Keep AgentsRoom off `:54721` when running Omni local Supabase |

**Controller STOP (P0.1).** Regression evidence recorded. Do not claim CPC / E100 / tổng 100%. Do not start Pha B without owner.

## Wave P0 CLOSED 2026-07-27 — eng local sạch = YES (commercial deferred)

**SDD plan:** [2026-07-27-sdd-p0-post-audit.md](../superpowers/plans/2026-07-27-sdd-p0-post-audit.md) · **Branch:** `cursor/p0-post-audit` · **PR:** [#31](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/pull/31) · **SoT:** [completion-priority-post-audit](../superpowers/plans/2026-07-27-completion-priority-post-audit.md) · **Ports:** `config/local-ports.json` (4700 / 4701 / 4702 / 4788 / 54721)

**Date:** 2026-07-27

### Gate P0 checklist

| Item | Status | Evidence |
|------|--------|----------|
| **P0.1** Gate A regression | **GREEN** | [Wave P0 / Gate A re-verify](#wave-p0--gate-a-re-verify-2026-07-27) — API 185 · AI 37 · isolation 8/0 skip · e2e · lint · typecheck · commit `016672b` |
| **P0.2** Docs ports SoT | **GREEN** | SoT banners + legacy `:3000`/`:54321` labels · commit `113d926` |
| **P0.3 A6** Offline SW `/m` | **AMBER_OK** | Network-only `apps/web/public/sw.js` accepted for Gate P0 — offline `/m` **not required** to close eng local sạch (Plan H mobile already GREEN/AMBER). No SW rewrite in this wave. |
| **P0.3 A7** Zalo R2.4 | **deferred** | `cpc-checklist.md` R2.4 stays **`undecided`** — owner must choose `REQUIRED` \| `AMBER_OK` at **Pha B step B5** before CPC claim. **No forged signature.** |
| Stack ports SoT | **YES** | Web `:4700` · API `:4701` · AI `:4702` · Inngest `:4788` · Supabase `:54721` |

### Honest maturity (do **not** invent 100%)

| Đích | ~% sau Gate P0 | Claim |
|------|----------------|-------|
| **Eng / Gate P0** (local sạch) | **YES** | Wave success = Gate P0 only |
| **CPC thương mại** | ~**38%** | **NOT 100%** |
| **E100** | ~**22%+** | **NOT 100%** |
| **Tổng intended** | ~**55%** | **NOT 100%** |

**Gate P0 eng local sạch = YES.** Commercial path remains deferred.

| Next | When |
|------|------|
| **Pha B** (B1 Render Starter ×3 → …) | **Only when owner wants to sell** — **BLOCKED owner** until then |
| **B5** R2.4–R2.6 Decision | Before CPC claim — owner fills REQUIRED \| AMBER_OK |
| **CPC / E100 / tổng** | Still **not** claimable |

**Controller STOP (Wave P0).** Do not start Pha B / Render / Meta without owner. Do not claim CPC / E100 / tổng 100%.

---

## Wave B1 OPEN 2026-07-27 — eng kickoff Render Starter (R0.2 vẫn BLOCKED owner)

**SDD:** [2026-07-27-sdd-b1-render-starter.md](../superpowers/plans/2026-07-27-sdd-b1-render-starter.md) · **Owner runbook VI:** [b1-render-starter-owner.md](./b1-render-starter-owner.md) · **Dashboard clicks:** [deploy-staging-render § Upgrade](./deploy-staging-render.md#upgrade-to-always-on-owner)

**Date:** 2026-07-27 · **Baseline tip before this wave:** `main` @ `ae16347` (Gate P0 CLOSED)

### Re-probe R0.2 (eng — không nâng Starter)

| Check | Result |
|-------|--------|
| `RENDER_API_KEY` in repo `.env` / `.env.staging.local` | **ABSENT** (presence-only; no value printed) |
| GitHub secret `RENDER_*` | **ABSENT** (list) |
| `render.yaml` plans | `plan: free` ×3 (`omni-api/ai/web-staging`) |
| Keep-warm latest | [30214990011](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30214990011) `success` (schedule) — **AMBER** reachability only |
| Local probe api health | **FAIL** TLS/send closed (~39s) — mạng local thường chặn/không ổn định tới onrender.com; **không** dùng làm GREEN |
| Free→Starter Dashboard | **NOT DONE** (owner) |

### Verdict

| Item | Status |
|------|--------|
| Eng B1 kickoff (docs + re-probe + owner runbook VI) | **YES** |
| R0.2 always-on GREEN | **NO — BLOCKED (owner)** payment + Starter ×3 + no-cold-start proof |
| CPC / E100 / tổng 100% | **NOT claimed** (~38% / ~22%+ / ~55%) |

**Next:** Owner làm [b1-render-starter-owner.md](./b1-render-starter-owner.md) → eng ghi R0.2 GREEN → **B2** Meta.

---

## Local hardening 2026-07-27 — eng local browser + cross-service verification (Đích A only)

**Scope:** Ad-hoc thorough local verification pass (not a scheduled SDD wave — no separate plan doc). **Đích A / Eng local only.** Does **not** touch CPC thương mại or E100 — both remain exactly where [Wave B1 OPEN](#wave-b1-open-2026-07-27--eng-kickoff-render-starter-r02-vẫn-blocked-owner) / [Wave P0 CLOSED](#wave-p0-closed-2026-07-27--eng-local-sạch--yes-commercial-deferred) left them (~38% / ~22%+ / ~55% — **unchanged**, **NOT** re-claimed here).

**Method:** Drove the real stack end-to-end (`pnpm run dev:local`), including a real browser session against `:4700`/`:4701`, not just `fetch`-based automated tests. Found and fixed 7 real bugs; found and deferred 2 more (non-blocking).

### Bugs found and fixed

| # | Bug | Fix | File(s) |
|---|-----|-----|---------|
| 1 | Mojibake in `.env.example` comments (`—`/`→` → `â€"`/`â†'`) — PS 5.1 `Get-Content` misreads UTF-8-no-BOM without an explicit encoding, so every `pnpm run ports:sync` reintroduced the corruption | Added `-Encoding utf8` to the `Get-Content` call | `scripts/sync-local-env-ports.ps1` |
| 2 | Inngest SDK registered against its own hardcoded default `http://localhost:8288` instead of this repo's locked `:4788`, spamming "Failed to register" / ECONNREFUSED (harmless — auto-discovery still worked — but noisy) | Added `INNGEST_DEV=http://127.0.0.1:4788` | `.env`, `.env.example`, `scripts/sync-local-env-ports.ps1`, `scripts/dev-local.ps1` |
| 3 | **CORS never enabled on the API** — `main.ts` never called `app.enableCors`; every browser cross-origin call from web `:4700` → api `:4701` (login/dashboard/catalog/orders) was silently blocked at preflight. Only a real browser could catch this — existing tests all call the API via Node `fetch`, which isn't subject to CORS | Added `buildCorsOptions`, wired into bootstrap; new `WEB_ORIGIN` env var (default `http://127.0.0.1:4700`) | `apps/api/src/config/cors.ts` (new), `apps/api/src/main.ts`, `apps/api/src/config/env.ts`, `.env`/`.env.example`/`sync-local-env-ports.ps1`/`dev-local.ps1` |
| 4 | **apps/ai silently used the wrong `SERVICE_M2M_KEY`** — `apps/ai/app/config.py` reads `.env` relative to its own cwd (per README's manual "copy `.env` → `apps/ai/.env`" step), but `dev-local.ps1` never did that copy, so AI always fell back to its hardcoded default while the API loaded the real key. Every API→AI M2M call (`POST /internal/v1/reindex`, the product-creation embedding pipeline) silently 401'd — products saved fine but nothing ever reached `knowledge_chunks` | `dev-local.ps1` now copies root `.env` → `apps/ai/.env` before starting AI, and fails loudly at startup if the two `SERVICE_M2M_KEY` values don't match (value itself never logged) | `scripts/dev-local.ps1` |
| 5 | Stale legacy-port defaults from the Wave P0 port-lock migration (harmless under documented run paths — always overridden — but a trap for standalone runs) | `:3001`→`:4701`, `:8000`→`:4702` defaults corrected | `apps/web/src/lib/api-client.ts`, `apps/api/src/config/env.ts` (`PORT`, `AI_BASE_URL`), `apps/ai/app/config.py` (`core_base_url`) |
| 6 | `next build` crashed 100%-reproducibly: `The "id" argument must be of type string. Received undefined` — `typescript@7.0.2`'s native-compiler rewrite dropped the legacy `lib/typescript.js` CommonJS entry that Next.js 16.2.11 hardcodes a check against, so Next always saw `typescript` as "missing," tried a pointless reinstall, then crashed. GitHub Actions CI never saw this (`CI=1` takes a different, non-crashing path) — **silently broken for every local dev, invisible to CI** | Added `@typescript/native-preview` devDependency (trips Next's sanctioned native-TS escape hatch); `typescript: { ignoreBuildErrors: true }` in `next.config.ts` as defense-in-depth — real type safety unaffected, still enforced by the separate `pnpm typecheck` gate (confirmed still green) | `apps/web/package.json`, `apps/web/next.config.ts` |
| 7 (deferred, non-blocking) | `next dev`/`next build` under Turbopack fail with "couldn't find next/package.json" specifically when checked out as a **nested** git worktree under another checkout of the same repo (two `pnpm-workspace.yaml` found; wrong one picked). Confirmed the outer directory is a separate real (non-nested) checkout — very likely a testing-sandbox-only artifact | Added `turbopack.root` pointing at monorepo root (fixes part, not all, of the ambiguity). **Did not** force `--webpack` project-wide — that's a real perf-affecting call that shouldn't be made from nested-worktree evidence alone. Recommend owner re-check `pnpm run dev:local` / `pnpm build` in the real (non-worktree) checkout | `apps/web/next.config.ts` |
| 8 (deferred, pre-existing, non-blocking) | Booting `AppModule`/`AdvisorService` via `@nestjs/testing`'s `Test.createTestingModule` fails under Vitest — esbuild's TS transform doesn't reliably emit `emitDecoratorMetadata` like `tsc` does, and `AdvisorService` relies on implicit constructor-type DI. Real app (built with `tsc`, run via `next dev`) unaffected — worked around locally with a route-level stub controller for the CORS regression test instead of booting the full module graph | `apps/api/src/config/cors.integration.spec.ts` |

### Regression coverage added (so #3 and #4 can't silently reappear)

| Coverage | File |
|----------|------|
| CORS unit test | `apps/api/src/config/cors.spec.ts` |
| CORS live-preflight integration test (real ephemeral Nest HTTP server) | `apps/api/src/config/cors.integration.spec.ts` |
| AI config test (`Settings()` reads `SERVICE_M2M_KEY` from env; `core_base_url` default correct) | `apps/ai/tests/test_config.py` |
| e2e smoke `knowledge.reindex` step — polls `knowledge_chunks` after product creation, fails with a pointed error if the AI-embedding pipeline doesn't complete | `scripts/local-e2e-smoke.mjs` |
| `dev-local.ps1` fails loudly at stack startup if `apps/ai/.env` `SERVICE_M2M_KEY` ≠ root `.env` | `scripts/dev-local.ps1` |

### Test counts (before → after)

| Suite | Before | After |
|-------|--------|-------|
| API unit tests | 185/185 | **190/190** (+5 CORS) |
| AI pytest | 37/37 | **39/39** (+2 config) |
| Isolation | 8/8 · 0 skip | **8/8 · 0 skip** (unchanged) |
| Local e2e smoke | GREEN | **GREEN** (+ `knowledge.reindex` step) |
| lint | 5/5 tasks | **5/5 tasks** |
| typecheck | 5/5 tasks | **5/5 tasks** |
| `pnpm build` (production, all 4 packages) | — | **GREEN** |

### Real browser verification (not just automated tests)

Created a real Supabase Auth user → logged into actual `/login` → reached real `/dashboard` → created a product through the actual `/catalog` UI form (not an API script). Confirmed working end-to-end **after** the CORS fix (#3), zero browser console errors.

### Verdict

| Item | Status |
|------|--------|
| Local eng hardening (7 bugs fixed + regression coverage + browser verify) | **GREEN** |
| Turbopack nested-worktree issue (#7) | **Deferred** — non-blocking, likely sandbox-only; owner to confirm in real checkout |
| AdvisorService/Vitest DI issue (#8) | **Deferred** — pre-existing, out of scope, doesn't block current suite |
| CPC thương mại | **NOT re-claimed** — unchanged at ~38% |
| E100 | **NOT re-claimed** — unchanged at ~22%+ |
| Tổng intended | **NOT re-claimed** — unchanged at ~55% |

**What's still NOT claimed:** no change to Gate R0/R1 status, no CPC or E100 percentage movement, no Render/Meta progress — this pass is local/eng-only. Turbopack (#7) and the AdvisorService/Vitest Nest-testing gap (#8) remain open, deferred, non-blocking findings — see rows above.

**Controller STOP (local hardening).** Do not claim CPC / E100 / tổng 100% from this pass. Pha B (Render/Meta) remains **BLOCKED owner** exactly as in [Wave B1 OPEN](#wave-b1-open-2026-07-27--eng-kickoff-render-starter-r02-vẫn-blocked-owner).

### Follow-up (same day) — #8 AdvisorService/Vitest DI gap fixed

Item #8 above (deferred) was subsequently fixed, not left open:

- **Fix:** added explicit `@Inject(FeatureFlagsService)` / `@Inject(AiRunsService)` to `apps/api/src/modules/advisor/advisor.service.ts`'s constructor, matching the `@Optional() @Inject(...)` pattern already used for the later token-based param — DI resolution no longer depends on `emitDecoratorMetadata` output at all.
- **New regression coverage:** `apps/api/src/app.module.integration.spec.ts` boots the **entire** `AppModule` (all 23 feature modules) via `Test.createTestingModule` under Vitest and asserts it resolves and can listen — guards against this class of bug for ANY future service, not just AdvisorService. Verified meaningful by reverting the fix and confirming the test fails with the original error, then restoring it and confirming it passes.
- **Survey:** grepped `apps/api/src/modules/**` for other implicit-type-DI classes (~30 found, mostly controllers depending on their own module's service) — none caused a failure in the full-boot test, so left untouched (implicit DI is normal/idiomatic; only the confirmed-broken case was fixed).
- **Test counts after this follow-up:** API unit tests **191/191** (was 190 — +1 full-boot test); lint/typecheck still 5/5 tasks.

Row #8's verdict above is superseded: **Fixed**, not deferred.

---

## Full-app browser sweep 2026-07-28 — eng local only (Đích A only)

**Scope:** Subagent-driven, 4 waves, each covering one slice of the app not yet manually exercised (previous passes only covered login/dashboard/catalog). Every wave: real browser session (real Supabase Auth user + real org, not a fixture), real CRUD through the actual UI, root-cause fixes, regression coverage, independently re-verified by the orchestrating session (not just trusted self-report). **Đích A / Eng local only** — does **not** touch CPC/E100, unchanged at ~38% / ~22%+ / ~55%.

### Bugs found and fixed

| # | Wave | Bug | Fix | File(s) |
|---|------|-----|-----|---------|
| 9 | 1 — Inventory | **`public.receive_po()` left `stock_qty` stale** whenever a variant's stock spanned >1 warehouse — a `totals` CTE re-scanned `variant_stocks` as a *sibling* of the CTE that had just updated it in the same `WITH` statement; Postgres never lets a sibling CTE see another's writes except via `RETURNING`. Silently made every PO receive a no-op for the reported total | New migration threading `RETURNING` value + fresh sum of untouched warehouses, mirroring `private.sync_variant_total_stock`'s already-correct pattern | `supabase/migrations/20260728000000_fix_receive_po_stock_total.sql`, `apps/api/src/modules/supplier-po/receive-po.integration.spec.ts` |
| 10 | 2 — Orders | **Same sibling-CTE bug in `private.apply_order_stock_change()`** (confirm/cancel/return) — confirmed by direct investigation, not assumed from #9's pattern alone | Same fix pattern | `supabase/migrations/20260728010000_fix_apply_order_stock_change_total.sql`, `apps/api/src/modules/orders/apply-order-stock-change.integration.spec.ts` |
| 11 | 3 — Analytics | **`AI_MODEL_ALLOWLIST` config drift** — `.env`/`.env.example` shipped `gemini-2.0-flash` only, missing `advisor-stub`; with no `GEMINI_API_KEY` (the expected local default) the AI service always returns the stub model, which `AiRunsService.assertModelAllowed` then rejected — **`/advisor` was unusable out of the box** for anyone following the documented local setup. `render.yaml`'s deployed config already had the correct value, confirming this was template drift | Added `advisor-stub` to the allowlist in `.env`/`.env.example` | `.env`, `.env.example`, `apps/api/src/modules/audit/ai-runs.local-env.integration.spec.ts` (reads the real tracked `.env.example`, fails again if it regresses) |
| 12 | 4 — Comms/admin | Stale `activeOrgId` in `localStorage` never validated against the user's real org list (unlike `auth-session.ts`, which already did this elsewhere) — anyone with leftover org context got silent 403/400s app-wide | Extracted shared `resolveActiveOrgId()`, used consistently | `apps/web/src/lib/org-context.ts` (+test), `apps/web/src/lib/auth-session.ts`, `apps/web/src/components/app-shell.tsx` |
| 13 | 4 — Comms/admin | API error `detail` text (RFC 7807 shape, per `problem-details.filter.ts`) was discarded app-wide — the web client only read `body.message`, which the API never sends — every error shown to users was a useless generic message instead of the real reason | `parseApiErrorBody()`: checks `detail` → `message` → `title` → fallback | `apps/web/src/lib/api-client.ts` (+test) |
| 14 | 4 — Comms/admin | **New orgs provisioned with zero entitlements** regardless of plan — `create_organization_with_owner()` inserts the entitlements row scoped only by `org_id`, falling back to the table's raw `0/0/false` defaults instead of `PLAN_CATALOG.free`'s real limits (1 page, 100k AI tokens/mo); `syncPlanEntitlements` existed but was only wired to the admin manual-plan-change path — **every real signup was stuck at zero until an admin intervened by hand** | `createOrganization()` now calls `syncPlanEntitlements` right after the RPC; `IdentityModule` now imports `BillingModule` (verified no circular dependency, and `app.module.integration.spec.ts` — see follow-up above — still boots clean) | `apps/api/src/modules/identity/identity.service.ts`, `identity.service.spec.ts`, `identity.module.ts` |

Bugs #9 and #10 are the same root-cause class discovered independently in two different functions — a full grep of `supabase/migrations/**/*.sql` for the pattern (later CTE fresh-scanning a table an earlier sibling CTE just wrote) turned up no third instance; `adjust_variant_stock`/`transfer_stock` already avoid it by design (separate sequential statement, not folded into one `WITH`).

### Live re-verification (this session, independent of subagent self-reports)

- #9/#10: confirmed the fixed function bodies are the ones actually loaded in the running Postgres (`pg_proc.prosrc` contains the `RETURNING`-threaded fix), not just written to a migration file.
- #14: signed up a fresh throwaway user, created a fresh org via the real API, confirmed the response carries `{maxPages:1, aiMonthlyTokenLimit:100000}` — not zeros.
- Reran the full suite independently after every wave rather than trusting the reported numbers.

### Test counts (after this sweep, cumulative with the follow-up above)

| Suite | Count |
|-------|-------|
| API unit/integration tests | **194/194** (56 files) |
| Web unit tests | **9/9** (2 files) — new: `org-context.test.ts`, `api-client.test.ts` |
| AI pytest | **39/39** (unchanged) |
| typecheck / lint | **5/5 tasks** each |

### Deferred — product decisions, not bugs (flagged via `spawn_task`, not implemented)

- **E-invoice status-transition gap** (wave 2): no code path ever sets `orders.status = 'done'`, the state `einvoice.service.ts` requires to issue — the manual e-invoice feature is unreachable through the app's own confirm→ship→COD-collect flow. Needs a product decision (manual "Hoàn tất" action vs. auto-transition on COD match); not freelanced.

### Verdict

| Item | Status |
|------|--------|
| Full-app browser sweep (4 waves, 6 bugs fixed incl. 2 data-integrity + 1 onboarding-blocker, all independently re-verified) | **GREEN** |
| CPC thương mại / E100 / Tổng | **NOT re-claimed** — unchanged |

**Controller STOP (full-app sweep).** Do not claim CPC / E100 / tổng 100% from this pass. E-invoice status-transition gap remains an open product decision. Pha B (Render/Meta) remains **BLOCKED owner**.

### Follow-up (2026-07-28) — e-invoice status-transition gap closed

Owner decided: **manual-only** "Hoàn tất" action (no auto-transition on COD match — that stays a separate, still-open decision, not implemented).

- **New RPC**: `public.done_order(p_org_id, p_order_id, p_done_at)` — `shipped` → `done`, mirroring `ship_order`'s exact structure (idempotent on already-`done`, rejects any other source status with `hint = 'invalid_order_status'`). `supabase/migrations/20260728020000_order_done_rpc.sql`. The `done_at` column and `'done'` value already existed from earlier Plan D/F work — only the missing RPC + Nest wiring were the gap.
- **New endpoint**: `POST /v1/orders/:orderId/done` (`orders.controller.ts`/`orders.service.ts::markOrderDone`), same permission guard (`orders.write`) and audit event pattern (`order.done`) as `confirm`/`cancel`/`ship`/`return`.
- **Web UI**: "Hoàn tất" button in `/orders`, shown when `order.status === 'shipped'`, next to "Hoàn hàng".
- **Regression coverage**: unit tests for the new transition (happy path + wrong-source-status rejection) in `orders.service.spec.ts`/`orders.controller.spec.ts`; `scripts/local-e2e-smoke.mjs` extended with real `ship → done → einvoice.issue` steps, proving the full reachability gap is closed end-to-end over real HTTP, not just in isolation.
- **Verified live**: full e2e smoke run — `PASS [orders.ship]` → `PASS [orders.done]` → `PASS [einvoice.issue]` — confirmed independently, not just from the implementing subagent's self-report.
- **Test counts after this follow-up:** API **198/198** (was 194 — +4: 2 new unit tests, existing suite unaffected). typecheck and lint both still green across all packages (turbo).

The "Deferred" row above is superseded: **Fixed**, not open. No CPC/E100 change — this is a bug-closure (the feature already existed and was already counted; it was simply unreachable), not new commercial functionality.

### Follow-up (2026-07-28) — code-vs-docs audit finds and closes public webhook dispatch gap

Ran a fresh audit comparing current code against the official SoT docs (`cpc-checklist.md`, `plan-i-dod-evidence.md`, `2026-07-27-completion-priority-post-audit.md`, charter §7) rather than trusting the Jul-27 snapshot as still current. Two rows in that audit's "PARTIAL/STUB" table and "Eng bổ sung có thể làm sớm" list were verified directly against live code (not re-derived from the doc's own claims):

- **I1 SSO `org_sso_settings`/OIDC adapter** — confirmed zero code exists (grep 0 hits). Left as-is: the doc's own reasoning ("khi có IdP") is sound — building this with no real IdP or enterprise customer would be speculative scaffolding, not a real gap to close.
- **Public webhook `order.*` dispatch** — confirmed a real, more-than-cosmetic gap: `PublicApiService` let merchants register `outbound_webhooks` and manually fire a `webhook.test` ping, but **nothing anywhere called that sender when a real order event happened**. `orders.service.ts` only ever wrote to the internal audit log. A merchant registering a webhook for `order.shipped` today would get a successful "Test" ping and then silence forever on real shipments — a shipped-but-non-functional feature, not just an unbuilt one.

**Fix:** real dispatch wired through the existing outbox + Inngest pattern already used for `meta.inbound`/`ai.process_inbound`/`knowledge.reindex` — no new async mechanism invented.

- `orders.service.ts` now calls `enqueueOutbox()` after every real lifecycle transition (`order.created`, `order.confirmed`, `order.cancelled`, `order.shipped`, `order.done`, `order.returned`), including both the plain-draft and auto-confirm create paths, correctly guarded so idempotent replays never double-enqueue.
- New `apps/api/src/jobs/functions/order-webhook-dispatch.ts` — one shared Inngest function (all 6 order events funnel into a single `order/webhook_dispatch` trigger, mirroring how `meta.inbound`/zalo already share `ai/process_inbound`), looks up `outbound_webhooks` by org + enabled + Postgres array-containment on `events`, signs with the existing `signWebhookPayload`, POSTs, and throws on non-2xx so the outbox's existing retry/dead-letter (5 attempts) handles real delivery failures. Payload carries a stable `id` (the outbox event id) so receivers can dedupe against at-least-once redelivery.
- **DB-layer drift also found, not just the app schema**: `outbound_webhooks_events_check` (the Postgres CHECK constraint from the original migration) only allowed `order.created/updated/cancelled/returned/webhook.test` — missing `order.confirmed`/`order.shipped`/`order.done` even at the database level, a second, deeper copy of the same gap. New migration `20260728060000_outbound_webhooks_order_events.sql` widens it; verified live against a real `supabase db reset` (not just written to a file) — `pg_constraint` confirms the fresh 8-value list is actually loaded.
- `WebhookEventSchema` (Zod, `public-api/dto.ts`) updated to match; `order.updated` deliberately left as an unused-but-valid value — no real "edit order" call site exists yet, so no dispatch was invented for it.

**Regression coverage:** extended `orders.service.spec.ts` with an outbox-assertion for all 6 transitions (a dedicated new `shipOrder` test didn't exist before) plus a strict "exactly 2 outbox rows, not 4" assertion on the auto-confirm idempotent-replay path; new `order-webhook-dispatch.spec.ts` (6 tests: zero-match no-op, correctly-signed single match, not-subscribed webhook skipped, disabled webhook excluded, non-2xx rejects for retry, multi-webhook fan-out). Two pre-existing tests in unrelated files (`entitlement-gate.proof.spec.ts`, plus mocks inside `orders.service.spec.ts`) hard-asserted "no other table is ever touched" and needed genuine extension (not loosening) to also model the new legitimate `outbox_events` insert.

**Verified independently, not from self-report:** re-ran lint/typecheck/tests myself after reviewing the full diff; separately, the implementing agent started Docker, ran a real `supabase start` → `db reset` → live `pg_constraint` query → full suite against real Postgres → `supabase stop`, which I reviewed rather than accepted at face value.

**Test counts after this follow-up:** API **212/212** (was 198/198) — +14 across 3 modified spec files + 1 new spec file (6 tests). Lint and `tsc --noEmit` both clean.

No CPC/E100 change — Public API webhooks were already counted as "Khớp/DONE" in the Jul-27 audit; this closes a real functional gap inside that same row rather than adding new scope. Everything else in the Jul-27 audit's "BLOCKED ngoài eng" table (Render payment, Meta App Review, Supabase Pro, live carrier accounts, SOC2/pen-test, legal SLA/subprocessors) remains genuinely owner/vendor-blocked — confirmed unchanged, not re-derived from memory.
