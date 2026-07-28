# CPC Checklist — Commercial Product Complete

**Status:** CPC engineering path READY after Plan H, with live-ops AMBERs.  
**Do not claim E100:** Plan I remains next.

## Engineering checklist

| Area | Status | Evidence |
|------|--------|----------|
| Pilot core A-D | GREEN | Existing Pilot Phase 1 evidence |
| Plan E M3 code/docs | GREEN/AMBER | Code/docs done; paid/live drills AMBER |
| Plan F operations | GREEN/AMBER | Inventory, shipping, COD, returns, P&L, Zalo skeleton; live carrier/Zalo OAuth AMBER |
| Plan G intelligence | GREEN/AMBER | Ads spend, attribution, advisor, calendar, public API; advisor quality breadth AMBER |
| Plan H ERP-lite | GREEN/AMBER | Multi-warehouse, supplier/PO, stub e-invoice, mobile, accounting export; live e-invoice/provider ops AMBER |
| Tenant isolation | GREEN | New tables include `org_id`, RLS select policies, service-role writes |
| Money safety | GREEN | VND stored/exported as integer strings/BIGINT |
| API contract | GREEN | OpenAPI updated for Plan H public Core endpoints |
| Regression | GREEN | `pnpm --filter api test` — 47 files, 160 tests passed |

## Live-ops AMBERs before claiming full commercial readiness

- Plan E paid production items: Supabase Pro/PITR drill, always-on hosts,
  paid LLM keys/spend cap proof, uptime alerts.
- Live carrier E2E beyond manual/stub paths.
- Zalo OA worker/OAuth production completion.
- E-invoice real provider sandbox/live credentials and tax-compliance review.
- Meta App Review submission/approval and staging walkthrough remain owner-run.
- Public incident/status/SLA and security procurement work remain Plan I, not CPC
  engineering.

## Stub decisions (owner)

R2.4–R2.6 may be **REQUIRED** (must go GREEN) or **AMBER_OK** (defer with explicit
owner acceptance). Fill **Owner date** when decided.

### Local-first phase (Wave L1 / E0.4) — eng notes

During **local eng** (Docker / `dev:local`), R2.4 / R2.5 / R2.6 **may remain
`undecided`**. That is OK for coding and SDD on PC.

**Before claiming CPC thương mại**, every row **must** be `REQUIRED` or
`AMBER_OK` (owner-signed Decision + Owner date). Do **not** invent an owner
signature or force Decision values without owner choice — leave cells
`undecided` until the owner decides.

**Recommended intent (not a decision):** Meta-only shops often intend
`AMBER_OK` for R2.4 (Zalo) and may also intend `AMBER_OK` for R2.5 / R2.6 if
invoicing/advisor stay outside or stubbed. Document intent in Notes only;
Decision stays `undecided` until owner fills it.

Cross-link: [completion-step-by-step § Pha Local / E0.4](./2026-07-25-completion-step-by-step.md) ·
[path-to-100 § E0.4](./2026-07-25-path-to-100-percent.md) ·
[L1 plan Task 4](./2026-07-26-sdd-l1-local-first.md).

| Item | Decision | Owner date | Notes |
|------|----------|------------|-------|
| R2.4 Zalo OA | **AMBER_OK** | 2026-07-28 | OAuth/token + inbound worker vs Meta-only · Wave P0 left undecided (A7 deferred to Pha B **B5**); **decided 2026-07-28** — Meta is the primary channel, Zalo keeps the existing manual token-paste + inbound worker. Revisit if Zalo volume grows enough to justify building full OAuth. |
| R2.5 E-invoice | **AMBER_OK** | 2026-07-28 | Real provider sandbox vs invoicing outside system · **decided 2026-07-28** — merchants issue invoices through their own accounting/provider for now; Omni only tracks order state. Owner acknowledged this may carry tax/legal implications depending on actual revenue scale and should be revisited with an accountant before scaling, not treated as a permanent eng-only call. |
| R2.6 Advisor | **AMBER_OK** | 2026-07-28 | Live LLM/eval vs stub acceptable · **decided 2026-07-28** — ship with `advisor-stub` fallback; enable a real Gemini key once there's paying-customer revenue to justify the LLM spend. |

Allowed values: `REQUIRED` · `AMBER_OK` · `undecided`

All three rows resolved 2026-07-28 — no more `undecided` cells. This does **not** unblock CPC by itself: Render Starter, Meta App Review, Supabase Pro/PITR, and live carrier/COD accounts (all owner-run, see `2026-07-27-completion-priority-post-audit.md` §1.4) are unrelated blockers that remain open.

## Verdict

Plan H closes the **CPC engineering path**. Commercial launch should remain
**AMBER** until owner/live-provider tasks above are cleared. **E100 is not
claimed**; Plan I is next.
