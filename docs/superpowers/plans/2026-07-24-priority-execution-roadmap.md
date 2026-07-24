# Priority Execution Roadmap — tới CPC / E100

**Date:** 2026-07-24  
**Status:** Active backlog — Plan D DONE on `feat/plan-d-orders-web-hardening` (`b8dcbfb`); **Pilot Phase 1 ready**; Plan E NEXT when customer imminent  

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
| **B** | Wave D — Meta channels | **DONE** (merged `main` @ `2176559`) → [DoD evidence](./plan-b-dod-evidence.md) · [chi tiết](./2026-07-24-plan-b-meta-channels.md) |
| **C** | Waves E+F — Catalog + AI | **DONE** (merged `main` @ `127624e`) → [DoD evidence](./plan-c-dod-evidence.md) · [playbook](./2026-07-24-plan-c-priority-execution.md) · [chi tiết](./2026-07-24-plan-c-catalog-ai.md) |
| **D** | Waves G+H+I — Orders + Web + Hardening | **DONE** (`feat/plan-d-orders-web-hardening` @ `b8dcbfb`) → [DoD evidence](./plan-d-dod-evidence.md) · [playbook](./2026-07-24-plan-d-priority-execution.md) · [chi tiết](./2026-07-24-plan-d-orders-web-hardening.md) |
| **E** | Gate M3 — Commercial ops | **NEXT** when customer imminent → [outline](./2026-07-24-plan-e-m3-commercial-ops.md) |
| **F** | Phase 2 Operations (2A–2H) | After E / pilot |
| **G** | Phase 3 Intelligence (3A–3F) | After F |
| **H** | Phase 4 ERP-lite (4A–4F) → **CPC** | After G |
| **I** | M4 Procurement → **E100** | Overlap from late F |

---

## 2. Thứ tự ưu tiên bắt buộc (P0 → P4)

```
P0  Plan B  Meta          ← DONE (DoD evidence recorded)
P1  Plan C  Catalog + AI  ← DONE (DoD evidence recorded)
P2  Plan D  Orders + Web VI + Hardening / App Review   ← DONE → Pilot Phase 1 READY
P3  Plan E  M3 (Pro DB, always-on, billing, DR)        ← NEXT khi có / sắp có khách
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
- [x] Page+IG connect + inbox DB  
- [x] AI grounded + draft order tools  
- [x] Confirm + export  
- [x] Web VI đủ dùng  
- [x] Terms/Privacy + PDPA path + App Review package  

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

1. ~~Execute Plan B~~ — **DONE** ([DoD evidence](./plan-b-dod-evidence.md))  
2. ~~Execute Plan C~~ — **DONE** (merged `main` @ `127624e`) ([DoD evidence](./plan-c-dod-evidence.md))  
3. ~~Execute Plan D D0→D10~~ — **DONE** ([DoD evidence](./plan-d-dod-evidence.md)) → **Pilot Phase 1 ready**  
4. Plan E (M3) khi sắp có / có khách trả tiền — [outline Plan E](./2026-07-24-plan-e-m3-commercial-ops.md)  

**Không** nhảy Phase 2 trước pilot staging walkthrough + Meta submit khi host sẵn sàng.
