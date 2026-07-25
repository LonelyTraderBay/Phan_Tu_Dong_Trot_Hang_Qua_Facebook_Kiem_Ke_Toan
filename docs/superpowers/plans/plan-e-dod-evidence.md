# Plan E (M3) — Definition of Done Evidence

**Date:** 2026-07-24  
**Branch tip (pre-merge):** `76dcef1` (+ docs commit)  
**Scope:** `docs/superpowers/plans/2026-07-24-plan-e-m3-commercial-ops.md`  
**Verdict:** **AMBER → GREEN for code/docs gates; AMBER for paid/live ops until owner runs drills**

---

## E0 — Supabase Pro + PITR + restore drill

| Item | Status | Evidence |
|------|--------|----------|
| Runbook | **GREEN** | `docs/runbooks/supabase-pro-pitr-restore-drill.md` |
| Pro upgrade | **AMBER** | Requires paid project — owner action |
| PITR enable | **AMBER** | Same |
| Restore drill executed | **AMBER** | Same — fill evidence table in runbook |

---

## E1 — Always-on hosts

| Item | Status | Evidence |
|------|--------|----------|
| Runbook | **GREEN** | `docs/runbooks/always-on-hosts.md` |
| Hosts live | **AMBER** | Requires paid Railway/Fly/etc. |
| Uptime monitors | **AMBER** | Same |

---

## E2 — LLM failover + spend cap

| Item | Status | Evidence |
|------|--------|----------|
| Daily/monthly USD cap | **GREEN** | `apps/ai/app/spend_cap.py`, wired in `rag.py` |
| Secondary OpenAI provider | **GREEN** | `LLM_SECONDARY_*` in `config.py` + `llm.py` |
| Env docs | **GREEN** | `apps/ai/.env.example` |
| Unit tests | **GREEN** | `apps/ai/tests/test_spend_cap.py` (pytest suite green) |
| Runbook | **GREEN** | `docs/runbooks/llm-failover-spend-cap.md` |
| Live staging prove | **AMBER** | Needs real OpenAI keys on staging |

---

## E3 — On-call

| Item | Status | Evidence |
|------|--------|----------|
| Runbook | **GREEN** | `docs/runbooks/on-call.md` |
| Live pager rota | **AMBER** | Owner assigns people + Better Stack |

---

## E4 — Billing / entitlements

| Item | Status | Evidence |
|------|--------|----------|
| ADR billing | **GREEN** | `docs/adr/0004-billing-invoice-plan-flags.md` — **invoice + plan flags** |
| Plan catalog | **GREEN** | `apps/api/src/modules/billing/plan-catalog.ts` |
| Ops PATCH plan | **GREEN** | `PATCH /ops/v1/orgs/:orgId/plan` |
| Enforce max_pages | **GREEN (eng)** | `ChannelsService.ensureWithinMaxPages` → **403** `max_pages_exceeded` |
| Enforce auto_confirm | **GREEN (eng)** | Entitlement/`past_due` soft-blocks auto-confirm → stays **draft** (not hard 403) |
| R1 eng gate harness | **GREEN** | `apps/api/src/modules/billing/entitlement-gate.proof.spec.ts` (SDD E2 Task 4) |
| Module wiring | **GREEN** | `BillingModule` + `AppModule` |
| API tests | **GREEN** | Plan/entitlement + R1 gate proof specs |
| Ops evidence split | **GREEN** | [`docs/ops/plan-e-dod-evidence.md`](../../ops/plan-e-dod-evidence.md) — eng vs owner-paid |

### R1 eng-proven vs owner-paid (2026-07-25)

| Bucket | Items | Status |
|--------|-------|--------|
| **Eng-proven** | `max_pages` 403 gate; `auto_confirm` blocked when plan/`past_due` disallows; free catalog limits; stub invoice+flags | **GREEN** — no Supabase Pro required |
| **Owner-paid / live** | Pro + PITR + restore drill; always-on hosts; uptime/on-call; live LLM keys+cap; live ops billing ticket; paid E0–E3 rows → GREEN | **AMBER / BLOCKED** — owner/vendor only |

---

## E5 — DPA / subprocessors

| Item | Status | Evidence |
|------|--------|----------|
| DPA template | **GREEN** | `docs/legal/dpa-template.md` |
| Subprocessors | **GREEN** | `docs/legal/subprocessors.md` |
| Signed customer DPA | **AMBER** | Legal/sales — out of eng |

---

## E6 — Scheduled QA

| Item | Status | Evidence |
|------|--------|----------|
| Workflow | **GREEN** | `.github/workflows/scheduled-qa.yml` |
| Manual dispatch | **GREEN** | `workflow_dispatch` enabled |
| First cron green on GitHub | **AMBER** | Verify after merge to `main` |

---

## E7 — This evidence file

| Item | Status | Evidence |
|------|--------|----------|
| `plan-e-dod-evidence.md` | **GREEN** | This file |
| Priority docs updated | **GREEN** | See `2026-07-24-path-to-completion-priority.md` |

---

## Automated gates (local)

| Gate | Result |
|------|--------|
| API unit tests | **PASS** — 113 |
| AI pytest | **PASS** — 23 |
| Typecheck / lint / build | Run on merge to main |

---

## Honest close for CPC path

Plan E **code + runbooks + legal templates** are done. **Paid infrastructure drills** (Pro, always-on, live Meta Review submit, live §12.1) remain **owner-gated AMBER** and do not block starting Plan F engineering — but **CPC (100 Phase 1)** still requires those ambers cleared per SoT.

**Next:** Plan F (Phase 2) JIT + implementation — see `2026-07-24-plans-f-i-post-phase1-index.md`.
