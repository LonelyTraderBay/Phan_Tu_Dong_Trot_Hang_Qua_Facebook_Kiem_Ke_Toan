# Plan F — Kế hoạch thực thi theo thứ tự ưu tiên (Phase 2 Operations)

**Status:** **IN PROGRESS** — start after Plan E code/docs DoD  
**Authority (tasks):** [plan-f-phase2-operations](./2026-07-24-plan-f-phase2-operations.md)  
**Roadmap:** [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md) · [path-to-completion](./2026-07-24-path-to-completion-priority.md)  
**Baseline:** Plan E evidence `plan-e-dod-evidence.md` (paid drills may remain AMBER)

---

## 1. Plan F trên đường hoàn thiện

```
DONE   A–D  Pilot Phase 1
AMBER  E    M3 (code+docs GREEN)
▶ NOW  F    Phase 2 Operations   ← tài liệu này
THEN   G → H → CPC
THEN   I → E100
```

---

## 2. Mục tiêu một câu

Kho có ledger + carrier API + đối soát COD + returns + P&L đơn giản + kênh #2 + billing packaging + harden — sẵn sàng Phase 3.

---

## 3. Thứ tự ưu tiên trong F (không đảo)

| Ưu tiên | Wave | Gate ra |
|--------:|------|---------|
| **F0** | 2A Inventory depth | Mọi đổi kho có `stock_movements`; adjust API; low-stock; race confirm vẫn đúng |
| **F1** | 2B Carrier API | 1 carrier E2E staging; export fallback |
| **F2** | 2C COD reconciliation | Báo cáo expected vs collected; BIGINT |
| **F3** | 2D Returns | Hoàn 1 đơn → stock/COD đúng |
| **F4** | 2E Simple P&L | Lãi gộp ngày/SKU |
| **F5** | 2F Channel #2 | Zalo OA **hoặc** 1 sàn |
| **F6** | 2G Billing packaging | Plans/meters/portal trên nền ADR 0004 |
| **F7** | 2H Hardening | Load/runbooks/eval → `plan-f-dod-evidence.md` |

**Phụ thuộc:** F0 trước F1–F3 · F1 trước F2 · F4 sau money events đủ · F7 cuối.

---

## 4. Checklist vận hành

1. Branch `feat/plan-f-phase2`  
2. Execute F0→F7 (Subagent-Driven cho code)  
3. `plan-f-dod-evidence.md`  
4. Merge `main` + push  
5. Mở Plan G JIT  

**Không** claim CPC sau F.
