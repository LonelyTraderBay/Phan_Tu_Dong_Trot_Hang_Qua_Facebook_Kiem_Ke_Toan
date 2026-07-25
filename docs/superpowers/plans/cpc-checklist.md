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

| Item | Decision | Owner date | Notes |
|------|----------|------------|-------|
| R2.4 Zalo OA | undecided | | OAuth/token + inbound worker vs Meta-only |
| R2.5 E-invoice | undecided | | Real provider sandbox vs invoicing outside system |
| R2.6 Advisor | undecided | | Live LLM/eval vs stub acceptable |

Allowed values: `REQUIRED` · `AMBER_OK` · `undecided`

## Verdict

Plan H closes the **CPC engineering path**. Commercial launch should remain
**AMBER** until owner/live-provider tasks above are cleared. **E100 is not
claimed**; Plan I is next.
