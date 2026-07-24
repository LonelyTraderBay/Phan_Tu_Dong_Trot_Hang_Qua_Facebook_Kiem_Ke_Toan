# Priority Execution Roadmap — tới CPC / E100

**Date:** 2026-07-24  
**Status:** Active backlog after Plan A merge to `main` (`397601f`)  
**Authority:** [CANONICAL](../specs/2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [master roadmap](../specs/2026-07-24-master-roadmap-commercial-complete.md) · [WBS](../specs/2026-07-24-implementation-work-breakdown.md)

---

## 0. Đích hoàn thiện (nhắc lại)

| Thứ tự đích | Ký hiệu | Khi nào đạt |
|-------------|---------|-------------|
| 1 | **Pilot Phase 1** | Xong Plans **B → D** (Waves D–I) |
| 2 | **CPC** (sản phẩm thương mại hoàn thiện) | + Plan **E (M3)** + Plans **F–H** (Phase 2–4) |
| 3 | **E100** (Enterprise 100/100) | + Plan **I (M4)** |
| — | Epoch 5 Platform | Optional sau CPC |

**Không** nhảy Phase 2 trước khi đóng Phase 1 (Plan D DoD).

---

## 1. Trạng thái hiện tại

| Plan | Scope | Status |
|------|-------|--------|
| **A** | Waves A+B+C — Platform | **DONE** (merged + pushed `main`) |
| **B** | Wave D — Meta channels | **NEXT — B0→B9** → [playbook ưu tiên](./2026-07-24-plan-b-priority-execution.md) · [chi tiết task](./2026-07-24-plan-b-meta-channels.md) |
| **C** | Waves E+F — Catalog + AI | Queued → [plan file](./2026-07-24-plan-c-catalog-ai.md) |
| **D** | Waves G+H+I — Orders + Web + Hardening | Queued → [plan file](./2026-07-24-plan-d-orders-web-hardening.md) |
| **E** | Gate M3 — Commercial ops | Queued → [outline](./2026-07-24-plan-e-m3-commercial-ops.md) |
| **F** | Phase 2 Operations (2A–2H) | After E / pilot |
| **G** | Phase 3 Intelligence (3A–3F) | After F |
| **H** | Phase 4 ERP-lite (4A–4F) → **CPC** | After G |
| **I** | M4 Procurement → **E100** | Overlap from late F |

---

## 2. Thứ tự ưu tiên bắt buộc (P0 → P4)

```
P0  Plan B  Meta          ← ĐANG TỚI
P1  Plan C  Catalog + AI
P2  Plan D  Orders + Web VI + Hardening / App Review   → Pilot Phase 1
P3  Plan E  M3 (Pro DB, always-on, billing, DR)        → khi có / sắp có khách
P4a Plan F  Phase 2 Operations
P4b Plan G  Phase 3 Intelligence
P4c Plan H  Phase 4 ERP-lite                           → CPC
P5  Plan I  M4                                          → E100
P6  Epoch 5 (optional)
```

### Quy tắc ưu tiên

1. Một plan **mở** tại một thời điểm cho critical path (trừ M4 có thể song song docs/ops).  
2. DoD plan trước đỏ → **không** start plan sau.  
3. Free-first đến Plan E; không đốt Pro/always-on sớm nếu chưa có khách (trừ webhook staging cần luôn-on tạm).  
4. Mọi plan kế thừa Global Constraints + M2 hooks từ Plan A.  
5. Execute bằng **Subagent-Driven** (khuyến nghị) hoặc Inline.

---

## 3. Checklist hoàn thiện ngắn

### Sau Plan D = Pilot sẵn sàng
- [ ] Page+IG connect + inbox DB  
- [ ] AI grounded + draft order tools  
- [ ] Confirm + export  
- [ ] Web VI đủ dùng  
- [ ] Terms/Privacy + PDPA path + App Review package  

### Sau Plan E = bán pilot an toàn
- [ ] Supabase Pro + PITR + restore drill  
- [ ] Always-on hosts  
- [ ] LLM paid + cap  
- [ ] Billing/entitlements enforce  

### Sau Plan H = **CPC**
- [ ] Carrier + COD + returns + P&L  
- [ ] Ads/attribution/advisor/calendar/public API  
- [ ] Multi-warehouse + PO + e-invoice + mobile  

### Sau Plan I = **E100**
- [ ] SSO path · SOC2/evidence · pen-test · SLA · status page · SBOM  

---

## 4. Effort ước lượng (team 2–4)

| Plan | Effort Phase 1–CPC | Ghi chú |
|------|--------------------|---------|
| B | ~2–4 tuần | Meta OAuth/webhook edge cases |
| C | ~4–8 tuần | RAG + eval |
| D | ~4–8 tuần | UI + orders + legal |
| E | ~2–6 tuần | ops/billing |
| F | ~4–8 tháng | Operations |
| G | ~4–8 tháng | Intelligence |
| H | ~4–8 tháng | ERP-lite → CPC |
| I | 6–18 tháng overlap | Compliance |

---

## 5. Hành động ngay

1. Đọc + duyệt [Plan B](./2026-07-24-plan-b-meta-channels.md)  
2. Execute Plan B (Subagent-Driven khuyến nghị)  
3. Sau DoD B → mở Plan C  

**Không** viết/code Phase 2 trong lúc làm B.
