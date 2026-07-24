# Priority Execution Roadmap — tới CPC / E100

**Date:** 2026-07-25  
**Status:** Active backlog — Plans A–D DONE; **Pilot Phase 1 ready**; Plan E **code+docs DONE** (`plan-e-dod-evidence.md`, paid AMBER); Plan F **DONE**; Plan G **DONE**; **Plan H NEXT**

**Authority:** [CANONICAL](../specs/2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [master roadmap](../specs/2026-07-24-master-roadmap-commercial-complete.md) · [WBS](../specs/2026-07-24-implementation-work-breakdown.md)  
**Kế hoạch chi tiết từng bước (SoT ưu tiên còn lại):** [path-to-completion-priority](./2026-07-24-path-to-completion-priority.md)

---

## 0. Đích hoàn thiện (nhắc lại)

| Thứ tự đích | Ký hiệu | Khi nào đạt |
|-------------|---------|-------------|
| 1 | **Pilot Phase 1** | Xong Plans **B → D** — **ĐÃ ĐẠT** |
| 2 | **CPC** (sản phẩm thương mại hoàn thiện) | + Plan **E (M3)** + Plans **F–H** (Phase 2–4) |
| 3 | **E100** (Enterprise 100/100) | + Plan **I (M4)** |
| — | Epoch 5 Platform | Optional sau CPC |

Paid/live Plan E drills có thể AMBER song song với code Plan F; **không** claim CPC trước khi clear AMBER + xong H.

---

## 1. Trạng thái hiện tại

| Plan | Scope | Status |
|------|-------|--------|
| **A** | Waves A+B+C — Platform | **DONE** (merged `main`) |
| **B** | Wave D — Meta channels | **DONE** → [DoD](./plan-b-dod-evidence.md) |
| **C** | Waves E+F — Catalog + AI | **DONE** → [DoD](./plan-c-dod-evidence.md) |
| **D** | Waves G+H+I — Orders + Web + Hardening | **DONE** → [DoD](./plan-d-dod-evidence.md) |
| **E** | Gate M3 — Commercial ops | **CODE+DOCS DONE** (paid AMBER) → [DoD](./plan-e-dod-evidence.md) · [playbook](./2026-07-24-plan-e-priority-execution.md) |
| **F** | Phase 2 Operations (2A–2H) | **DONE** → [DoD](./plan-f-dod-evidence.md) · [playbook](./2026-07-24-plan-f-priority-execution.md) |
| **G** | Phase 3 Intelligence (3A–3F) | **DONE** → [DoD](./plan-g-dod-evidence.md) |
| **H** | Phase 4 ERP-lite (4A–4F) → **CPC** | **NEXT** |
| **I** | M4 Procurement → **E100** | Overlap from late F |

---

## 2. Thứ tự ưu tiên bắt buộc (P0 → P5)

```
DONE  Plan B  Meta
DONE  Plan C  Catalog + AI
DONE  Plan D  Orders + Web + Hardening     → Pilot Phase 1 READY
AMBER Plan E  M3 code+docs GREEN · paid drills AMBER
DONE  Plan F  Phase 2 Operations
DONE  Plan G  Phase 3 Intelligence
P4c   Plan H  Phase 4 ERP-lite                   → CPC ← NEXT eng
P5    Plan I  M4                                  → E100
P6    Epoch 5 (optional)
```

### Quy tắc ưu tiên

1. Một plan **mở** tại một thời điểm cho critical path (trừ M4 docs có thể song song).  
2. DoD plan trước đỏ → **không** start plan sau.  
3. Free-first đến Plan E; không đốt Pro/always-on sớm nếu chưa có khách (trừ webhook staging tạm).  
4. F–I viết full plan **just-in-time** trước khi code.  
5. Execute bằng **Subagent-Driven** (code) + ops thủ công có evidence (Plan E).

---

## 3. Checklist hoàn thiện ngắn

### Sau Plan D = Pilot sẵn sàng — DONE
- [x] Page+IG connect + inbox DB  
- [x] AI grounded + draft order tools  
- [x] Confirm + export  
- [x] Web VI đủ dùng  
- [x] Terms/Privacy + PDPA path + App Review package  

### Sau Plan E = bán pilot an toàn
- [x] LLM spend cap + secondary provider (code)  
- [x] Billing/entitlements (invoice+flags)  
- [x] DPA template + subprocessors + scheduled QA workflow  
- [ ] Supabase Pro + PITR + restore drill (**owner / paid**)  
- [ ] Always-on hosts + live uptime (**owner / paid**)  

### Sau Plan H = **CPC**
- [x] Carrier + COD + returns + P&L
- [x] Ads/attribution/advisor/calendar/public API
- [ ] Multi-warehouse + PO + e-invoice + mobile  

### Sau Plan I = **E100**
- [ ] SSO path · SOC2/evidence · pen-test · SLA · status page · SBOM  

---

## 4. Effort ước lượng (team 2–4)

| Plan | Effort | Ghi chú |
|------|--------|---------|
| E | ~2–6 tuần | ops/billing khi có khách |
| F | ~4–8 tháng | Operations |
| G | ~4–8 tháng | Intelligence |
| H | ~4–8 tháng | ERP-lite → CPC |
| I | 6–18 tháng overlap | Compliance |

---

## 5. Hành động ngay

1. ~~Plans A–D~~ — **DONE** · Pilot Phase 1 ready  
2. ~~P0 docs + Plan E code/docs~~ — [DoD E](./plan-e-dod-evidence.md) (paid AMBER)  
3. ~~Plan F 2A→2H~~ — **DONE** → [DoD F](./plan-f-dod-evidence.md)
4. ~~Plan G 3A→3F~~ — **DONE** → [DoD G](./plan-g-dod-evidence.md)
5. **NEXT:** Write Plan H JIT plan, then execute 4A→4F
6. Owner parallel: live §12.1 · Meta Review · Pro+PITR · always-on
7. Sau H: **CPC**; rồi I → **E100**

**Không** claim CPC/E100.
