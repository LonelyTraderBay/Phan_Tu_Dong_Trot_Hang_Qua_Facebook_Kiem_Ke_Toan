# Spec audit — 2026-07-24 (pre–implementation plan)

**Status:** **SUPERSEDED / FIXED** — findings below were addressed in the full sync of 2026-07-24.  
**Current SoT:** [CANONICAL-LOCKED-DECISIONS](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [README](./README.md)  
**Auditor:** Agent review of all files under `docs/superpowers/specs/`  
**Purpose:** Historical record of consistency check before implementation plan.

> **Implementers:** Ignore open “P0/P1” wording below as current truth. All C1–C5 and critical G* items were fixed. Residual opens only in CANONICAL §8.

## Files reviewed (original set + later)

1. `2026-07-24-omni-commerce-ai-saas-design.md`
2. `2026-07-24-enterprise-engineering-foundation-charter.md`
3. `2026-07-24-enterprise-grade-commercialization-analysis.md`
4. `2026-07-24-backend-python-vs-typescript-analysis.md`
5. `2026-07-24-external-services-catalog.md`
6. (+ later) structure, maturity, coding-gaps, upgrade-opportunities, CANONICAL

## Severity legend

| Sev | Meaning |
|-----|---------|
| **P0** | Contradiction that would mislead implementation plan |
| **P1** | Missing content that Phase 1 / charter already implies |
| **P2** | Clarity / hygiene / outdated narrative |

---

## Resolution (post-sync)

| ID | Original issue | Resolution |
|----|----------------|------------|
| C1 | Jobs listed as Inngest/Trigger/Redis | **Inngest only** — design §9/§15, external §7, CANONICAL |
| C2 | Backend A “đang khóa” / A→C | **Option C locked** — backend analysis header + design |
| C3 | External led with Vercel/Railway / CF Pages | **Render Free Node** for web — external §0/§3 |
| C4 | Commercialization “một stack” / tách AI năm 2–3 | Clarified: Topology C from day 1 (see commercialization §13) |
| C5 | `*.vercel.app` / `*.pages.dev` | **`*.onrender.com`** temporary subdomain |
| G1 | No doc index | **README** + CANONICAL |
| G7 | CF Pages × Next undocumented | Closed: **not** Phase 1 path; Render Free |

---

## Findings (historical — before fixes)

### P0 — contradictions (FIXED)

| ID | Issue | Where |
|----|--------|------|
| C1 | Jobs still listed as `Inngest / Trigger.dev / Redis` while Free-first locked **Inngest** | design §9 |
| C2 | Backend analysis still labels Phương án A as **“đang khóa”** and recommends **A→C** | backend analysis §4, §7 |
| C3 | External catalog still led with wrong hosts | external-services |
| C4 | Commercialization outdated stack narrative | commercialization |
| C5 | Free subdomain example outdated | external-services §0.1 |

### P1 — gaps (mostly FIXED via structure/maturity/CANONICAL)

See [structure](./2026-07-24-enterprise-structure-and-data-architecture.md), [maturity](./2026-07-24-enterprise-maturity-scorecard-to-100.md), [coding-gaps CLOSED](./2026-07-24-coding-gaps-pre-implementation.md).

---

## Verdict for coding

**Safe to write Plan A (platform scaffold)** after user OK. DoD = structure §11 + maturity M2. Do not re-open Free-first host or Inngest placement.
