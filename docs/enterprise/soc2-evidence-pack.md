# SOC2 Evidence Pack Outline

**Status:** AMBER - outline only; no SOC2 Type I claim  
**Owner needed:** security/compliance owner plus auditor/vendor  
**Purpose:** collect dated evidence for SOC2 readiness and enterprise procurement.

## Control domains

| Domain | Evidence to collect | Current state |
|--------|---------------------|---------------|
| Security governance | Security policy, risk register, control owners | AMBER - not packaged |
| Access control | User lifecycle, `platform_admins` review, MFA/SSO posture | AMBER - checklist exists, review not run |
| Change management | PR review, CI results, migration review, release notes | AMBER - repo evidence exists, pack not curated |
| Incident response | Incident runbook, status page, postmortem template | AMBER - status page scaffold only |
| Availability | Uptime monitors, SLO/SLA, backup/restore drill | AMBER - live paid evidence pending |
| Confidentiality | Encryption, secrets handling, subprocessor list, DPA | AMBER - docs exist, vendor review pending |
| Vendor management | Subprocessor review and customer notification process | AMBER - public page scaffold |
| Logging/monitoring | Audit logs, Sentry/monitoring screenshots, alert evidence | AMBER - not collected |

## Evidence inventory

- Architecture overview and data-flow diagram.
- Current subprocessors list.
- Access review checklist and quarterly results.
- CI checks for API/web/tests.
- Backup/PITR and restore drill evidence.
- Incident response and status page process.
- Pen-test report and remediation log.
- Security training/acknowledgement records, if applicable.

## Required metadata per artifact

- Artifact name
- Control/domain
- Owner
- Collection date
- Source URL/path
- Review status
- Expiration or next review date

## Exit gate for GREEN

SOC2 readiness can only move GREEN when an auditor/vendor or named compliance owner accepts the control map, evidence is dated, and SOC2 Type I is formally in progress or complete. This document alone is not SOC2 evidence.
