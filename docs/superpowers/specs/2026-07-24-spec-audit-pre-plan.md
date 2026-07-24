# Spec audit — 2026-07-24 (pre–implementation plan)

**Auditor:** Agent review of all files under `docs/superpowers/specs/`  
**Purpose:** Line-level consistency check before writing the implementation plan.

## Files reviewed

1. `2026-07-24-omni-commerce-ai-saas-design.md` (canonical product design)
2. `2026-07-24-enterprise-engineering-foundation-charter.md` (engineering law)
3. `2026-07-24-enterprise-grade-commercialization-analysis.md` (strategy)
4. `2026-07-24-backend-python-vs-typescript-analysis.md` (stack decision record)
5. `2026-07-24-external-services-catalog.md` (vendors / free-first)

## Severity legend

| Sev | Meaning |
|-----|---------|
| **P0** | Contradiction that would mislead implementation plan |
| **P1** | Missing content that Phase 1 / charter already implies |
| **P2** | Clarity / hygiene / outdated narrative |

---

## Findings (before fixes)

### P0 — contradictions

| ID | Issue | Where |
|----|--------|------|
| C1 | Jobs still listed as `Inngest / Trigger.dev / Redis` while Free-first locked **Inngest** | design §9 |
| C2 | Backend analysis still labels Phương án A as **“đang khóa”** and recommends **A→C** | backend analysis §4, §7 |
| C3 | External catalog §3 / §17 / checklist still lead with **Vercel + Railway** while Free-first locked **Cloudflare Pages + Render/Fly** | external-services |
| C4 | Commercialization says “TypeScript / Next.js **một stack xuyên suốt**” and “Năm 2–3 **tách AI service**” — AI already separate (Option C) | commercialization §3.1, §6 |
| C5 | Free subdomain example still `*.vercel.app` under Free-first Cloudflare Pages policy | external-services §0.1 |

### P1 — gaps to add

| ID | Gap | Why it matters |
|----|-----|----------------|
| G1 | No **doc index** linking the five specs + reading order | Plan/agents open wrong file |
| G2 | Design §7 data model missing: `entitlements`, `feature_flags`, `usage_events`, `job_dead_letters` / idempotency keys | Charter requires them |
| G3 | Module ownership **api vs ai** for Knowledge/RAG not explicit in design §5 | Prevents wrong PR boundaries |
| G4 | Free-first not in design **Decisions locked** table (only §13) | Easy to miss |
| G5 | Charter missing Free-first + default Gemini + deploy targets | Scaffold env wrong |
| G6 | **PDPA minimum**: export/delete org data path not in Phase 1 success criteria | Commercialization lists compliance |
| G7 | **Next.js on Cloudflare Pages** constraint (adapter/OpenNext) not documented | Hosting choice has build implications |
| G8 | RAG **read path** ambiguous: AI direct pgvector vs Core retrieval API | Security boundary |
| G9 | Rate limiting / abuse on public Auth + webhook not specified | Enterprise baseline |
| G10 | Commercialization §13 still asks to “duyệt Foundations-first / cập nhật design” — already done | Stale gate |

### P2 — optimize / narrative

| ID | Issue |
|----|--------|
| O1 | Backend analysis §7 decision matrix still written as if choosing A/B/C |
| O2 | Design Status still “Draft for user review” while many items locked |
| O3 | Product working name only English — optional VI name |
| O4 | Duplicate “Later phases…” sentences in design §1 |

---

## Fixes applied in this pass

See git-less edits in the five specs + new `README.md` index. Summary:

- Locked Jobs = **Inngest** in design §9 and decisions table  
- Free-first + vendor row added to design decisions; status clarified  
- Data model + module ownership + RAG read rule + rate limit + PDPA minimum + CF Pages note  
- Charter: Free-first, Gemini default, Inngest, deploy targets, RAG read via Core-or-RPC rule  
- Backend analysis: mark A/B historical; C locked; remove “A đang khóa”  
- Commercialization: polyglot wording; remove “tách AI later”; close §13 gates; link Free-first  
- External catalog: align §3/§17/checklist with §0 Free-first; fix subdomain example  
- Added `docs/superpowers/specs/README.md` reading order  

## Remaining open (OK to defer to implementation plan)

| Item | Notes |
|------|--------|
| Exact NestJS module folder names inside `apps/api` | Plan task |
| Exact Gemini model IDs for chat vs embed | Plan + env |
| Render vs Fly as default always-free host | Both allowed; plan picks one for scripts |
| Formal VI product brand name | Marketing, not blocking |
| ICP shop lẻ vs agency | Affects Year-1 sales, not scaffold |
| Cloudflare Pages + Next.js adapter choice (OpenNext / `@opennextjs/cloudflare`) | First hosting task must spike |

## Verdict

**Specs are ready for implementation planning after this fix pass**, provided the user accepts the remaining deferrals above. No further product-scope brainstorm required for Phase 1 Sellable Core + Option C + Free-first.
