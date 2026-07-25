# Plan I DoD Evidence - M4 Enterprise

**Status:** IN PROGRESS - scaffolding GREEN; E100 blocked by AMBER live/compliance gates  
**Branch:** `feat/plan-i-m4`  
**Baseline:** Plan H DONE on `main`; CPC engineering path READY with live-ops AMBERs  
**Rule:** Do not claim E100 until I1-I8 are GREEN with live or compliance evidence.

## Task status

| Task | Status | Evidence |
|------|--------|----------|
| I1 SSO/SAML path | GREEN/AMBER | GREEN: `docs/enterprise/sso-saml-path.md`; public `GET /v1/auth/sso/status` returns `{ available: false, etaDays: 90 }`. AMBER: no real SAML/OIDC IdP, no persisted org SSO settings, no enterprise customer onboarded. |
| I2 SOC2 evidence pack | AMBER | Outline exists at `docs/enterprise/soc2-evidence-pack.md`. Auditor/vendor, control evidence, and Type I report are not complete. |
| I3 Pen-test | AMBER | Checklist exists at `docs/enterprise/pentest-checklist.md`. Vendor test/report and remediation evidence are not complete. |
| I4 Status page | GREEN/AMBER | Static public VI page at `/status` with operational placeholder and incident link. AMBER: not wired to uptime/status vendor or live incident history. |
| I5 Public subprocessors | GREEN/AMBER | Public page `/legal/subprocessors`; source doc `docs/legal/subprocessors.md` updated with public URL. AMBER: legal/customer notification process still needs owner approval. |
| I6 SLA template | AMBER | Template exists at `docs/legal/sla-template.md`. Legal approval and customer contract use are not complete. |
| I7 SBOM | GREEN/AMBER | `.github/workflows/sbom.yml` generates Syft SPDX on `v*` tags, `workflow_dispatch`, and attaches to GitHub Release. AMBER: org process must always cut releases with tags so SBOM is produced. |
| I8 Access review | AMBER | Runbook exists at `docs/runbooks/platform-admin-access-review.md`. First quarterly review evidence is not complete. |

## Verification log

- GREEN: `pnpm --filter @omni/api test` — 47 files, 163 tests passed
- GREEN: `pnpm --filter @omni/api lint` — passed
- GREEN: `pnpm --filter @omni/web lint` — passed

## Public/API surfaces added

- `GET /v1/auth/sso/status` - public SSO availability placeholder; returns unavailable with 90-day ETA; documented in `packages/contracts/openapi.yaml`.
- Web `/status` - Vietnamese public service status placeholder.
- Web `/legal/subprocessors` - public subprocessor list.

## Notes

- This commit starts Plan I and creates implementable scaffolding only.
- SOC2 and pen-test remain AMBER because they require vendor/auditor execution and dated evidence.
- SLA remains AMBER until legal/commercial approval.
- E100 remains blocked on I1-I8 live/compliance completion.

## Verdict

Plan I is **IN PROGRESS**. M4 scaffolding can be GREEN where implemented, but **E100 is not claimed** and remains blocked by I1-I8 live/compliance gates.
