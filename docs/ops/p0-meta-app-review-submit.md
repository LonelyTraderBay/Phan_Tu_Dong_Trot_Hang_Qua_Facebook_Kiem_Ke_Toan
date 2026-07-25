# P0.2 — Meta App Review submit pack

**Checklist chi tiết:** [docs/meta-app-review-checklist.md](../meta-app-review-checklist.md)  
**Staging hosts:** [r0-r3-execution-evidence.md](./r0-r3-execution-evidence.md#render-staging-services) · SDD Task 3 prep `2026-07-25`

## Staging URLs (fill Meta dashboard from this table)

| Item | Staging value | Owner fills |
|------|---------------|-------------|
| **Web host** | `https://omni-web-staging.onrender.com` | — |
| **API host** | `https://omni-api-staging-cs2w.onrender.com` | — |
| **Privacy URL** | `https://omni-web-staging.onrender.com/legal/privacy` | Enter in App → Settings → Basic |
| **Terms URL** | `https://omni-web-staging.onrender.com/legal/terms` | Enter in App → Settings → Basic |
| **Webhook callback** | `https://omni-api-staging-cs2w.onrender.com/v1/webhooks/meta` | App → Webhooks → Page → `messages` |
| **Verify token** | *(same as `META_VERIFY_TOKEN` on `omni-api-staging`)* | Owner sets 8+ chars; never commit |
| **OAuth redirect URI** | `https://omni-web-staging.onrender.com/settings/channels/callback` | Must match `META_REDIRECT_URI` on API |
| **App ID** | | Owner — Meta App → Settings → Basic |
| **App secret** | | Owner — set `META_APP_SECRET` on API only |
| **Screencast link** | | Owner — see § Screencast in checklist |
| **Test user / Page / IG** | | Owner — see checklist §6 |

`render.yaml` already pins staging `META_REDIRECT_URI`; `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` are `sync: false` (dashboard only). Local `.env.example` keeps `replace-with-*` placeholders — **no real secrets in git**.

## Permissions (Phase 1 — from code)

Request **Advanced Access** for each scope in `apps/api/src/modules/channels/channels.service.ts`:

- `pages_show_list`
- `pages_messaging`
- `instagram_basic`
- `instagram_manage_messages`
- `pages_read_engagement`

Confirm names against [Meta permissions reference](https://developers.facebook.com/docs/permissions/reference) before submit.

## Pre-submit verification checklist

| # | Item | Staging target | Status |
|---|------|----------------|--------|
| 1 | Legal pages public (no auth) | Privacy + Terms URLs above | **UNVERIFIED** — local probe TLS reset 2026-07-25; GHA keep-warm `healthy_count=3/3` suggests reachability when warm |
| 2 | API always-on for webhook | `omni-api-staging` on Render Starter | **BLOCKED** — free tier sleeps ([R0.2 owner upgrade](./deploy-staging-render.md#upgrade-to-always-on-owner)) |
| 3 | Webhook GET verify (challenge 200) | `GET /v1/webhooks/meta?hub.mode=subscribe&hub.verify_token=<META_VERIFY_TOKEN>&hub.challenge=test` | **BLOCKED** — needs real `META_VERIFY_TOKEN` + warm API |
| 4 | Webhook POST `X-Hub-Signature-256` | Same callback URL | **BLOCKED** — needs `META_APP_SECRET` on API |
| 5 | OAuth connect flow | Settings → Kết nối kênh → callback above | **BLOCKED** — `META_*` placeholders on API |
| 6 | Subprocessors reviewed | [docs/legal/subprocessors.md](../legal/subprocessors.md) | Owner review before submit |
| 7 | Screencast (connect → DM → reply → export) | Staging web URL | Owner records |
| 8 | App Review form submitted | Meta dashboard | **NOT RUN** |

## Submit gate (owner)

- [ ] R0.2: `omni-api-staging` (and ideally all three) upgraded to Starter — webhook must not cold-start during review
- [ ] Render env on `omni-api-staging`: `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (real values)
- [ ] Meta App → Webhooks: callback + verify token + Page `messages` subscription
- [ ] Meta App → Facebook Login: Valid OAuth Redirect URIs includes staging callback (exact match)
- [ ] Meta App → Settings → Basic: Privacy + Terms URLs (staging table above)
- [ ] Test Page + IG Professional + tester accounts prepared ([checklist §6](../meta-app-review-checklist.md#6-test-users--assets))
- [ ] Screencast uploaded; use case text from [checklist §2](../meta-app-review-checklist.md#2-permissions-to-request-phase-1)
- [ ] Submit App Review → Permissions and Features (Advanced Access for § Permissions list)
- [ ] **Do not** switch app to Live until approved

## Status

| Field | Value |
|-------|-------|
| Prep pack | **COMPLETE** (SDD Task 3, 2026-07-25) |
| Submitted at | **NOT RUN** — owner must set `META_*` and submit in Meta dashboard |
| Review status | *(blank — not submitted)* |
| R0.4 gate | **AMBER** |
| Notes | Agent cannot access Meta dashboard. After R0.2 always-on + real `META_*`, owner submits; then track review status here. |

## Owner next actions (single path)

1. Complete [R0.2 always-on upgrade](./deploy-staging-render.md#upgrade-to-always-on-owner) (payment + Starter on `omni-api-staging` minimum).
2. Create or select Meta Business app; copy App ID + App Secret.
3. Set on Render `omni-api-staging`: `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (8+ chars).
4. Configure webhook + OAuth redirect per table above; test GET verify with real verify token.
5. Record screencast; submit App Review with permissions list + test credentials.
6. Update [r0-r3-execution-evidence.md](./r0-r3-execution-evidence.md) R0.4 when submitted (date only — not Approved until Meta approves).
