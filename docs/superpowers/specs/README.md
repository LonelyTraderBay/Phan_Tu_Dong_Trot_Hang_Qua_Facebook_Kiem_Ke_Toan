# Specs index — Omni-Commerce AI SaaS

**Last audited:** 2026-07-24 ([audit report](./2026-07-24-spec-audit-pre-plan.md))

## Reading order (canonical)

| Order | File | Role | Status |
|-------|------|------|--------|
| 1 | [2026-07-24-omni-commerce-ai-saas-design.md](./2026-07-24-omni-commerce-ai-saas-design.md) | **Product + architecture source of truth** | Locked decisions; awaiting final user OK for plan |
| 2 | [2026-07-24-enterprise-engineering-foundation-charter.md](./2026-07-24-enterprise-engineering-foundation-charter.md) | Engineering law from commit #1 | Locked |
| 3 | [2026-07-24-external-services-catalog.md](./2026-07-24-external-services-catalog.md) | Vendors + **Free-first** policy | Locked §0 |
| 3b | [2026-07-24-coding-gaps-pre-implementation.md](./2026-07-24-coding-gaps-pre-implementation.md) | Lỗ hổng khi code + blockers | 2026-07-24 |
| 4 | [2026-07-24-enterprise-grade-commercialization-analysis.md](./2026-07-24-enterprise-grade-commercialization-analysis.md) | Multi-year commercial strategy | Locked posture; roadmap advisory |
| 5 | [2026-07-24-backend-python-vs-typescript-analysis.md](./2026-07-24-backend-python-vs-typescript-analysis.md) | ADR: why Option C | Historical A/B; **C locked** |
| — | [2026-07-24-spec-audit-pre-plan.md](./2026-07-24-spec-audit-pre-plan.md) | Pre-plan consistency audit | 2026-07-24 |

## Locked topology (do not re-litigate in plan)

```
apps/web     Next.js + TS          → Render Free (Node) — Phase 1
apps/api     NestJS + TS           → Render/Fly Free → paid when customers
apps/ai      FastAPI + Python      → same vendor as api
Supabase     Auth + Postgres+RLS + Storage + pgvector  × staging + prod
Jobs         Inngest Free (functions in apps/api only; AI via HTTP)
LLM          Gemini Free (AI Studio) → paid when customers
```

## Conflict rule

If two docs disagree: **design (§ decisions) > charter > external-services §0 > analysis ADRs**.
