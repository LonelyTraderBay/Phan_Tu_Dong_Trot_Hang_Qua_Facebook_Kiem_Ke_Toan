# Plan H — Kế hoạch thực thi theo thứ tự ưu tiên (Phase 4 ERP-lite)

**Status:** **IN PROGRESS** — Wave 4A Multi-warehouse starts first  
**Authority (tasks):** [plan-h-phase4-erp-lite](./2026-07-24-plan-h-phase4-erp-lite.md)  
**Roadmap:** [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md) · [path-to-completion](./2026-07-24-path-to-completion-priority.md)  
**Baseline:** Plan G DONE; CPC still waits for all Plan H waves plus owner-paid AMBER items.

---

## 1. Plan H trên đường hoàn thiện

```
DONE  Plan F  Phase 2 Operations
DONE  Plan G  Phase 3 Intelligence
▶ NOW Plan H  Phase 4 ERP-lite      → CPC when 4A–4F are done
THEN  Plan I  M4 Procurement        → E100
```

## 2. Wave order

| Priority | Wave | Deliverable | Exit gate |
|---------:|------|-------------|-----------|
| H0 | 4A Multi-warehouse | Warehouses, per-warehouse variant stock, transfer ledger, VI UI | Two warehouses per org can transfer stock safely |
| H1 | 4B Supplier & PO | Suppliers, purchase orders, receiving into warehouse | PO receipt updates stock with trace |
| H2 | 4C E-invoice | Provider hook and DLQ-ready invoice issue path | One sandbox provider path documented |
| H3 | 4D Staff mobile | Thin mobile/PWA flows for inbox + shipping | CSKH/kho can work on mobile |
| H4 | 4E Accounting export | Detailed accounting exports | Accountant can import ledger files |
| H5 | 4F CPC hardening | Regression, DR notes, CPC checklist, API freeze | CPC evidence can close |

## 3. Guardrails

- One Plan H wave at a time unless explicitly split later.
- Keep inventory mutations tenant-scoped and ledgered.
- No floating money math; no hard delete of business ledgers.
- New endpoints require OpenAPI, permissions, and focused tests.
- Do not claim CPC until 4A–4F evidence is GREEN/accepted AMBER and owner-paid AMBER items are cleared.

## 4. Current wave checklist

1. Create Plan H docs and evidence stub.
2. Implement Wave 4A DB/API/web only.
3. Run `pnpm --filter api test`.
4. Update 4A evidence with command output and endpoint list.
5. Commit and push `feat/plan-h-phase4`.
