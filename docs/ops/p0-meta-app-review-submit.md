# P0.2 — Meta App Review submit pack

**Checklist chi tiết:** [docs/meta-app-review-checklist.md](../meta-app-review-checklist.md)

## Fill-in before submit

| Item | Value |
|------|-------|
| App ID | |
| Privacy URL | `https://<staging-or-prod-web>/legal/privacy` |
| Terms URL | `https://<staging-or-prod-web>/legal/terms` |
| Webhook callback | `https://<always-on-api>/v1/webhooks/meta` |
| Verify token | matches `META_VERIFY_TOKEN` |
| OAuth redirect | `https://<web>/settings/channels/callback` |
| Screencast link | |
| Test user / Page | |

## Permissions (Phase 1)

- `pages_show_list`, `pages_messaging`, `instagram_basic`, `instagram_manage_messages`, `pages_read_engagement`  
- Adjust to current Meta App Review list before submit.

## Submit gate

- [ ] Legal pages publicly reachable (no auth)  
- [ ] Webhook verifies (GET challenge) on always-on or tunnel for review period  
- [ ] Screencast shows connect → DM → AI/staff → order export  
- [ ] Subprocessors list reviewed ([docs/legal/subprocessors.md](../legal/subprocessors.md))  

## Status

| Field | Value |
|-------|-------|
| Submitted at | **NOT RUN** until URLs + always-on ready |
| Review status | |
| Notes | Free-tier cold start may block review — prefer Plan E1 always-on or paid staging temporarily |
