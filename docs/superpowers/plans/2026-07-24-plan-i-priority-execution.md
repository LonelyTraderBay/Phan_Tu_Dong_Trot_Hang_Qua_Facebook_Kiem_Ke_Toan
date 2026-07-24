# Plan I - Kế hoạch thực thi ưu tiên M4 Enterprise

**Status:** **IN PROGRESS** - E100 is blocked until I1-I8 are live or supported by accepted compliance evidence  
**Authority (tasks):** [plan-i-m4-enterprise](./2026-07-24-plan-i-m4-enterprise.md)  
**Roadmap:** [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md) · [path-to-completion](./2026-07-24-path-to-completion-priority.md)  
**Baseline:** Plan H DONE; CPC engineering path READY with live-ops AMBERs.

---

## 1. Plan I trên đường tới E100

```
DONE  Plan F  Phase 2 Operations
DONE  Plan G  Phase 3 Intelligence
DONE  Plan H  Phase 4 ERP-lite      → CPC engineering READY
▶ NOW Plan I  M4 Enterprise         → E100 only after I1-I8 GREEN
```

## 2. Task order

| Priority | Task | Deliverable | Exit gate |
|---------:|------|-------------|-----------|
| I1 | SSO/SAML path | SSO path doc and public status stub | SSO available or <=90 day enterprise commitment accepted |
| I2 | SOC2 evidence pack | Evidence outline and control map | SOC2 Type I in progress with evidence owner/date |
| I3 | Pen-test | Checklist and remediation tracker | Critical/high findings fixed or formally risk-accepted |
| I4 | Status page | Public VI status page | Public availability and incident comms page exists |
| I5 | Public subprocessors | Public subprocessor page from legal doc | URL published and linked in evidence |
| I6 | SLA template | Contract SLA/support tier template | Legal/commercial template ready for review |
| I7 | SBOM | Release SBOM workflow stub | CI can generate SBOM artifact |
| I8 | Access review | Platform admin review runbook | Quarterly checklist exists for `platform_admins` |

## 3. Guardrails

- Do not claim E100 from scaffolding alone.
- Mark vendor/compliance items AMBER until SOC2 vendor/auditor, pen-test vendor, legal approval, and live operational evidence exist.
- Keep public pages honest: no uptime/SLA/security certification claims beyond current evidence.
- Keep SSO disabled by default; no SAML assertion handling until a real IdP integration is implemented and tested.

## 4. Current task checklist

1. Create Plan I JIT docs and evidence stub.
2. Publish implementable M4 scaffolding: SSO path/status stub, status page, subprocessors page, SLA template, SBOM workflow, access review runbook.
3. Add SOC2 evidence pack outline and pen-test checklist only.
4. Run API tests/checks.
5. Update evidence with honest GREEN/AMBER.
6. Commit and push `feat: plan I M4 enterprise scaffolding`.
