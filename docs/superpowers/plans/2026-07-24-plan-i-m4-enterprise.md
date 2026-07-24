# Plan I - M4 Enterprise (I1-I8)

> Implement the engineering scaffolding now, then update `plan-i-dod-evidence.md` with honest GREEN/AMBER status. E100 is not available until every I1-I8 exit gate is GREEN.

**Status:** IN PROGRESS - scaffolding wave  
**Depends on:** Plan H DONE (`plan-h-dod-evidence.md`)  
**Next:** E100 only after I1-I8 live/compliance gates  
**Playbook:** [plan-i-priority-execution](./2026-07-24-plan-i-priority-execution.md)

## Plan I Definition of Done

- [ ] I1-I8 complete with live evidence or accepted compliance evidence.
- [ ] Public enterprise pages are published and reviewed.
- [ ] SOC2, pen-test, SLA, and access-review evidence have named owners and dates.
- [ ] SBOM is generated for releases.
- [ ] No E100 claim before all AMBER items are cleared.

## I1 - SSO/SAML path

- [x] Document enterprise SSO/SAML path in `docs/enterprise/sso-saml-path.md`.
- [x] Add public placeholder `GET /v1/auth/sso/status` returning `{ available: false, etaDays: 90 }`.
- [ ] Add persisted org-level `sso_enabled`/IdP settings after product/legal accepts SSO scope.
- [ ] Implement real SAML/OIDC flow, metadata handling, tests, and rollout controls.

## I2 - SOC2 evidence pack

- [x] Create `docs/enterprise/soc2-evidence-pack.md` outline.
- [ ] Select auditor/vendor and control framework.
- [ ] Collect dated control evidence and ownership.
- [ ] Begin/complete SOC2 Type I readiness.

## I3 - Pen-test

- [x] Create `docs/enterprise/pentest-checklist.md`.
- [ ] Schedule vendor test against staging/prod scope.
- [ ] Fix critical/high findings or record formal risk acceptance.
- [ ] Attach final report and remediation evidence.

## I4 - Status page

- [x] Publish static VI `/status` page.
- [ ] Wire real uptime/incident provider and historical incident process.

## I5 - Public subprocessors

- [x] Publish `/legal/subprocessors` from `docs/legal/subprocessors.md`.
- [ ] Add formal customer notification process for material subprocessor changes.

## I6 - SLA template

- [x] Create `docs/legal/sla-template.md`.
- [ ] Legal/commercial approval and contract packaging.

## I7 - SBOM

- [x] Add `.github/workflows/sbom.yml` stub using Syft.
- [ ] Make SBOM generation required for release tags.

## I8 - Access review

- [x] Create `docs/runbooks/platform-admin-access-review.md`.
- [ ] Run first quarterly access review and attach evidence.

## Out of scope for this scaffolding commit

- SOC2 certification or audit completion.
- Pen-test completion.
- Real SSO/SAML login.
- Paid status-page/SLA vendor operations.
- E100 claim.
