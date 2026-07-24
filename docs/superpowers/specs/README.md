# Specs index — Omni-Commerce AI SaaS

**Last full sync:** 2026-07-24 (re-audit CLEAN)  
**Conflict authority:** [CANONICAL-LOCKED-DECISIONS](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) wins over any older paragraph.

## Reading order

| Order | File | Role |
|-------|------|------|
| **0** | [2026-07-24-CANONICAL-LOCKED-DECISIONS.md](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) | **Anti-conflict SoT when coding** |
| 1 | [2026-07-24-omni-commerce-ai-saas-design.md](./2026-07-24-omni-commerce-ai-saas-design.md) | Product + architecture |
| 2 | [2026-07-24-enterprise-engineering-foundation-charter.md](./2026-07-24-enterprise-engineering-foundation-charter.md) | Engineering law |
| 2b | [2026-07-24-enterprise-structure-and-data-architecture.md](./2026-07-24-enterprise-structure-and-data-architecture.md) | Folders + schema LOCKED |
| 2c | [2026-07-24-enterprise-maturity-scorecard-to-100.md](./2026-07-24-enterprise-maturity-scorecard-to-100.md) | Path to 100/100 (M0–M4) |
| 3 | [2026-07-24-external-services-catalog.md](./2026-07-24-external-services-catalog.md) | Vendors + Free-first |
| 3b | [2026-07-24-coding-gaps-pre-implementation.md](./2026-07-24-coding-gaps-pre-implementation.md) | Gaps → closed in design §15 |
| 3c | [2026-07-24-enterprise-upgrade-opportunities.md](./2026-07-24-enterprise-upgrade-opportunities.md) | What else to upgrade |
| 3d | [2026-07-24-implementation-work-breakdown.md](./2026-07-24-implementation-work-breakdown.md) | Phases / Waves Phase 1 trước plan |
| 3e | [2026-07-24-master-roadmap-commercial-complete.md](./2026-07-24-master-roadmap-commercial-complete.md) | Full path → CPC + E100 |
| — | [plans/2026-07-24-priority-execution-roadmap.md](../plans/2026-07-24-priority-execution-roadmap.md) | **Thứ tự ưu tiên tới CPC/E100** |
| — | [plans/2026-07-24-plan-a-platform-foundation.md](../plans/2026-07-24-plan-a-platform-foundation.md) | Plan A — DONE |
| — | [plans/2026-07-24-plan-b-meta-channels.md](../plans/2026-07-24-plan-b-meta-channels.md) | **Plan B — Meta (execute next)** |
| — | [plans/2026-07-24-plan-c-catalog-ai.md](../plans/2026-07-24-plan-c-catalog-ai.md) | Plan C — Catalog + AI |
| — | [plans/2026-07-24-plan-d-orders-web-hardening.md](../plans/2026-07-24-plan-d-orders-web-hardening.md) | Plan D — Orders + Web + Hardening |
| 4 | [2026-07-24-enterprise-grade-commercialization-analysis.md](./2026-07-24-enterprise-grade-commercialization-analysis.md) | Multi-year GTM |
| 5 | [2026-07-24-backend-python-vs-typescript-analysis.md](./2026-07-24-backend-python-vs-typescript-analysis.md) | ADR Option C (historical A/B) |
| — | [2026-07-24-spec-audit-pre-plan.md](./2026-07-24-spec-audit-pre-plan.md) | Audit record (findings fixed) |

## Locked snapshot (do not re-litigate)

```
Topology     C: web (Next/TS) + api (Nest/TS) + ai (FastAPI/Py) + Supabase
Web host     Render Free (Node) — Phase 1; CF Pages later optional
API/AI host  Render Free or Fly free (one vendor preferred)
Jobs         Inngest in apps/api only → HTTP to ai
LLM          Gemini Free → paid at M3
Tenancy      org_id + RLS + X-Org-Id + platform_admins
Reliability  outbox_events preferred + webhook_receipts + bot_epoch
Maturity     M0 done · M1 done · M2 in Plan A · M4 = only official 100/100
UI language  Tiếng Việt · Code English
Tooling      pnpm + Turborepo · uv · Node 20 · Python 3.12
```

## Conflict rule

**CANONICAL → design §§2/9/15 → structure → maturity → charter → external §0 → ADR/analysis.**

Older lines that still mention Cloudflare Pages as Phase-1 web host, Trigger/BullMQ as primary jobs, or “A→C later” are **obsolete**.

## Scaffold rule

First code PR must satisfy [structure §11](./2026-07-24-enterprise-structure-and-data-architecture.md) + [maturity M2 hooks](./2026-07-24-enterprise-maturity-scorecard-to-100.md) before feature UI.
