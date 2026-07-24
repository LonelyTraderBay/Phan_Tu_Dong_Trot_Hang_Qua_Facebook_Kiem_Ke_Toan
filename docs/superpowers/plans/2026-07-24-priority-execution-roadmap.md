# Priority Execution Roadmap — tới CPC / E100

**Date:** 2026-07-25  
**Status:** Active backlog — Plans A–D DONE on `main` (`af8413a`); **Pilot Phase 1 ready**; Plan E NEXT when customer imminent  
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

**Không** nhảy Phase 2 trước Plan E DoD (trừ docs chuẩn bị).

---

## 1. Trạng thái hiện tại

| Plan | Scope | Status |
|------|-------|--------|
| **A** | Waves A+B+C — Platform | **DONE** (merged `main`) |
| **B** | Wave D — Meta channels | **DONE** → [DoD](./plan-b-dod-evidence.md) |
| **C** | Waves E+F — Catalog + AI | **DONE** → [DoD](./plan-c-dod-evidence.md) |
| **D** | Waves G+H+I — Orders + Web + Hardening | **DONE** (merged `main` @ `af8413a`) → [DoD](./plan-d-dod-evidence.md) · [playbook](./2026-07-24-plan-d-priority-execution.md) |
| **E** | Gate M3 — Commercial ops | **NEXT** when customer imminent → [playbook ưu tiên](./2026-07-24-plan-e-priority-execution.md) · [plan](./2026-07-24-plan-e-m3-commercial-ops.md) |
| **F** | Phase 2 Operations (2A–2H) | After E → [F–I index](./2026-07-24-plans-f-i-post-phase1-index.md) |
| **G** | Phase 3 Intelligence (3A–3F) | After F |
| **H** | Phase 4 ERP-lite (4A–4F) → **CPC** | After G |
| **I** | M4 Procurement → **E100** | Overlap from late F |

---

## 2. Thứ tự ưu tiên bắt buộc (P0 → P5)

```
DONE  Plan B  Meta
DONE  Plan C  Catalog + AI
DONE  Plan D  Orders + Web + Hardening     → Pilot Phase 1 READY
P3    Plan E  M3 (Pro, always-on, billing, DR)  ← NEXT khi có / sắp có khách
P4a   Plan F  Phase 2 Operations
P4b   Plan G  Phase 3 Intelligence
P4c   Plan H  Phase 4 ERP-lite                   → CPC
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

| Plan | Effort | Ghi chú |
|------|--------|---------|
| E | ~2–6 tuần | ops/billing khi có khách |
| F | ~4–8 tháng | Operations |
| G | ~4–8 tháng | Intelligence |
| H | ~4–8 tháng | ERP-lite → CPC |
| I | 6–18 tháng overlap | Compliance |

---

## 5. Hành động ngay

1. ~~Plans A–D~~ — **DONE** · Pilot Phase 1 ready ([DoD D](./plan-d-dod-evidence.md))  
2. Làm theo [path-to-completion-priority](./2026-07-24-path-to-completion-priority.md):  
   - **P0** sớm (chưa Pro): §12.1 · Meta Review · DPA · chọn billing · migrate staging  
   - **P3 Plan E** E0→E7 khi có / sắp có khách → [playbook E](./2026-07-24-plan-e-priority-execution.md)  
   - **P4a–c** F→H (JIT full plan) → **CPC**  
   - **P5** I (M4) → **E100**  

**Không** claim CPC/E100; **không** code Phase 2 trước E DoD.
