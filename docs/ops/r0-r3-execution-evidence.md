# R0—R3 execution evidence (live completion path)

**Baseline tip:** `main` @ see git  
**Plan:** [remaining-completion-priority](../superpowers/plans/2026-07-25-remaining-completion-priority.md) · SDD Wave R0: [2026-07-25-sdd-completion-r0.md](../superpowers/plans/2026-07-25-sdd-completion-r0.md)

## R0 — Staging + Meta

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| R0.1 Migrations apply (CI local Supabase) | **GREEN** | GitHub Actions **Migrate Check** succeeds on `main` | — |
| R0.1 Migrations on remote staging | **GREEN** | Recreated staging `omni-commerce-staging` ref `tjsmpcgkeoglemptuymu` (old refs removed); `supabase db push` **29** migrations incl. resume `20260727220000` (E2 T2) + e-invoice `20260727230000_einvoice_http_sandbox_provider.sql` (E2 T5, 2026-07-25); `migration list` local=remote **29/29**; verified `public.resume_inbox_conversation` RPC | Prior staging/prod refs deleted |
| R0.2 Always-on staging hosts | **BLOCKED** | **E5 Task 2 (2026-07-26 Re-probe R0.2):** `RENDER_API_KEY` still **ABSENT** (env + parent `.env*` + parent `.local-secrets/*` + GH secrets — presence probe only; no `rnd_` / apiKey hit). Free→Starter API upgrade **SKIPPED**. Latest GHA keep-warm [30196670571](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30196670571) `healthy_count=3/3` = **AMBER reachability only** (api ~43s / ai ~22s / web ~52s cold-start before HTTP 200 — free-tier sleep + keep-warm ≠ always-on). **Not GREEN.** Prior E4: [30182626561](https://github.com/LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan/actions/runs/30182626561). Owner clicks: [Upgrade to always-on](./deploy-staging-render.md#upgrade-to-always-on-owner) · [E5 Task 2 section](#wave-e5-task-2--r02-render-always-on-re-probe-2026-07-26) | **BLOCKED (owner):** Billing payment + Free→Starter ×3; GREEN only with post-upgrade no-cold-start proof |
| R0.3 §12.1 walkthrough | **AMBER** | **Local R0.3a+E0.3 + L1 Task 2 (2026-07-26)** ([walkthrough](./p0-staging-walkthrough-12-1.md)): stack health 3/3 + Supabase `:54321` **PASS**; non-Meta rows carry prior PASS/partial; Meta **BLOCKED** OK (no public webhook); chunks still open until L1 Task 3 | Staging/Meta deferred until CPC claim; knowledge reindex for full criterion 3 |
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
| Parent `.env` | `META_REDIRECT_URI` | yes | 48 | local `http://127.0.0.1:3000/settings/channels/callback` (≠ staging) |
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
| Parent `.env` | `META_REDIRECT_URI` | yes | 48 | local `http://127.0.0.1:3000/settings/channels/callback` (≠ staging) |
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

## Wave L1 Task 2 — Local stack verify (2026-07-26)

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
| **T3** Inngest in `dev:local` + chunks smoke | **GREEN** | `scripts/dev-local.ps1` starts/stops Inngest (`-u http://127.0.0.1:3001/api/inngest`); stub `APP_ENV`/`EMBEDDINGS_ALLOW_STUB`; smoke stub reindex → `knowledge_chunks` count **1** (not Gemini quality) · [local-host](./local-host.md) |
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
| **T2** A1 local walkthrough smoke post-L2 | **GREEN** | Non-Meta §12.1 re-smoke: invite create+accept · product · stock · draft→confirm · export CSV 200 · advisor suggest · stub Inngest → `knowledge_chunks` > 0 (org count 1; local total ≥ 3). Meta 2/4 **BLOCKED OK**. Inbox live SKIP (empty org; prior unit PASS). Ops note: orphan AI on `:8000` without stub caused transient `502 GEMINI…` — killed spawn child + restarted AI with stub. Walkthrough [p0-staging-walkthrough-12-1](./p0-staging-walkthrough-12-1.md) updated |
| **T3** A2 minimal local e2e smoke | **PENDING** | Playwright or API script + `pnpm` script |
| **T4** A3 ESLint real OR remove unused + typecheck | **PENDING** | packages typecheck green |
| **T5** A4 isolation + A5 OpenAPI honesty + Gate A + STOP | **PENDING** | Gate A evidence; CPC/E100 still deferred |

**Constraints (active):** Local only · No Render payment · Meta BLOCKED OK · Gate A = wave success · No CPC / E100 / tổng 100% claim · “100%” this wave = **Gate A Code local READY** only.
