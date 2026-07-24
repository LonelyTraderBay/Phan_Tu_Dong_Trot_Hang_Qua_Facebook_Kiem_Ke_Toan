# Kế hoạch chi tiết — từng bước theo thứ tự ưu tiên tới hoàn thiện

**Date:** 2026-07-25  
**Baseline:** `main` @ `af8413a` — Plans **A–D DONE** · **Pilot Phase 1 READY**  
**Authority:** [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md) · [master-roadmap](../specs/2026-07-24-master-roadmap-commercial-complete.md) · [CANONICAL](../specs/2026-07-24-CANONICAL-LOCKED-DECISIONS.md)

> Đây là **SoT thứ tự ưu tiên còn lại**. Plan E có playbook riêng; F–I viết full task JIT trước khi code.

---

## 0. Ba đích hoàn thiện (không nhầm)

| # | Đích | Ký hiệu | Điều kiện | Status |
|---|------|---------|-----------|--------|
| 1 | Pilot có kiểm soát | **Pilot Phase 1** | Plans B→D | **DONE** |
| 2 | Sản phẩm thương mại hoàn thiện | **CPC** | Pilot + **E (M3)** + **F+G+H** | Chưa |
| 3 | Enterprise 100/100 | **E100** | CPC path + **I (M4)** | Chưa |

```
DONE  A→D  Pilot
DONE  P0   docs/legal/ADR (live staging/Review = owner AMBER)
AMBER P3  E    M3 code+docs GREEN · paid drills AMBER  → [plan-e-dod-evidence]
DONE  P4a F    Phase 2 Operations
DONE  P4b G    Phase 3 Intelligence
▶ P4c H    Phase 4 ERP-lite IN PROGRESS → CPC
  P5  I    M4                   → E100
  P6  Epoch 5 (optional)
```

**Quy tắc:** Một plan critical path mở tại một thời điểm · DoD trước đỏ không start sau · Free-first đến khi activate E · Không claim CPC trước H · Không claim E100 trước I.

---

## P0 — Việc sớm — DOCS GREEN / LIVE AMBER

| Bước | Việc | Status |
|------|------|--------|
| P0.1 | Staging walkthrough Design §12.1 | Checklist: `docs/ops/p0-staging-walkthrough-12-1.md` — **live = owner** |
| P0.2 | Meta App Review submit pack | `docs/ops/p0-meta-app-review-submit.md` — **submit = owner** |
| P0.3 | DPA + subprocessors | **DONE** `docs/legal/*` |
| P0.4 | Billing ADR | **DONE** `docs/adr/0004-billing-invoice-plan-flags.md` → invoice+flags |
| P0.5 | Staging migrate notes | `docs/ops/p0-staging-migrate.md` — **apply = owner** |

---

## P3 — Plan E · Gate M3 (E0→E7) — CODE+DOCS DONE (paid AMBER)

**Playbook đầy đủ:** [plan-e-priority-execution](./2026-07-24-plan-e-priority-execution.md) · [plan file](./2026-07-24-plan-e-m3-commercial-ops.md)

### Thứ tự bắt buộc

| Ưu tiên | Bước chi tiết | Gate ra |
|--------:|---------------|---------|
| **E0** | (1) Upgrade Supabase **Pro** prod (2) Bật PITR (3) Staging project riêng (4) **Restore drill 1 lần** + log | Biên bản restore |
| **E1** | (1) Always-on `web`+`api`+`ai` (2) Verify webhook không miss vì sleep (3) Cập nhật ADR/README deploy | Cold start = 0 critical path |
| **E2** | (1) Paid LLM keys (2) Spend cap enforce (3) Secondary `LlmProvider` + failover doc (4) Test vượt cap | Cap proven |
| **E3** | (1) Uptime monitors web/api/ai (2) `docs/runbooks/on-call.md` (3) Test alert fire | On-call sẵn |
| **E4** | (1) Implement path billing đã chọn (2) Entitlements end-to-end (3) Gate vượt quota | Shop bị chặn đúng |
| **E5** | (1) DPA template (2) Subprocessors nội bộ (có thể bắt đầu từ P0.3) | Contract pack |
| **E6** | (1) CI/cron staging: `test:isolation` + `test:eval` (2) Lịch định kỳ | Schedule xanh |
| **E7** | (1) `plan-e-dod-evidence.md` (2) Roadmap Plan E DONE | **M3 đóng** |

**Song song OK:** E0∥E1 · E2∥E0–E1 · E5∥E3–E4 · E6∥E4–E5.  
**Cấm:** E4 charge khách trước E0 PITR trên prod.  
**Eng tiếp:** Sau E7 evidence (kể cả paid AMBER) được mở Plan F; CPC vẫn cần clear AMBER E0/E1.

### DoD Plan E
Restore drill · always-on webhook · spend cap · billing/entitlements · uptime/on-call · DPA · scheduled isolation/eval · evidence.

---

## P4a — Plan F · Phase 2 Operations → **DONE**

Evidence E: [plan-e-dod-evidence](./plan-e-dod-evidence.md). Paid drills AMBER không chặn bắt đầu code F; CPC vẫn cần clear AMBER.  
**Evidence F:** [plan-f-dod-evidence](./plan-f-dod-evidence.md) — code path DONE; live carrier E2E / Zalo full OAuth AMBER.
**Playbook:** [plan-f-priority-execution](./2026-07-24-plan-f-priority-execution.md) · [plan](./2026-07-24-plan-f-phase2-operations.md)

**Viết full plan JIT** trước khi code. Wave order (không đảo trong F):

| Ưu tiên | Wave | Bước (master) | DoD wave |
|--------:|------|---------------|----------|
| **F0** | 2A Inventory depth | 2A.1–2A.4 stock ledger, adjust, low-stock, audit | Mọi đổi kho truy vết; race confirm đúng |
| **F1** | 2B Carrier API | 2B.1–2B.5 `ShippingProvider`, tạo vận đơn, tracking, phí BIGINT, secrets enc | 1 carrier E2E staging; export fallback |
| **F2** | 2C COD reconciliation | 2C.1–2C.4 expected vs collected, discrepancy queue | Báo cáo đối soát; no float |
| **F3** | 2D Returns | 2D.1–2D.4 returned flow, restock, UI | Hoàn 1 đơn → stock/COD đúng |
| **F4** | 2E Simple P&L | 2E.1–2E.4 COGS, revenue−cost, dashboard, export | Lãi gộp ngày/SKU |
| **F5** | 2F Channel #2 | 2F.1–2F.4 Zalo OA **hoặc** 1 sàn; connector như Meta | Inbox đa kênh |
| **F6** | 2G Billing packaging | 2G.1–2G.4 plans, meters, portal, dunning | Subscription/invoice chặt |
| **F7** | 2H Hardening | 2H.1–2H.4 load test, runbooks, eval, CHANGELOG | Phase 2 checklist xanh |

**Phụ thuộc gợi ý:** F0 trước F1–F3 (kho); F1 trước F2 (carrier/COD); F4 sau có đủ money events; F5 có thể sau F0; F6 nâng cấp E4; F7 cuối F.

---

## P4b — Plan G · Phase 3 Intelligence → **DONE**

**Playbook:** [plan-g-priority-execution](./2026-07-24-plan-g-priority-execution.md) · [plan](./2026-07-24-plan-g-phase3-intelligence.md) · [evidence](./plan-g-dod-evidence.md)

| Ưu tiên | Wave | Bước | DoD wave |
|--------:|------|------|----------|
| **G0** | 3A Ads spend | 3A.1–3A.4 Meta Ads/CSV, `ad_spend`, P&L | Ads vào lãi |
| **G1** | 3B Attribution | 3B.1–3B.4 UTM/click, first/last touch | Nguồn đơn MVP |
| **G2** | 3C Owner Advisor | 3C.1–3C.5 advise-only, RAG, no auto-post, eval | Gợi ý grounded; người duyệt |
| **G3** | 3D Content calendar | 3D.1–3D.4 lịch bài; auto-post **off** mặc định | Calendar dùng được |
| **G4** | 3E Public API | 3E.1–3E.4 API keys, webhooks ký, docs | Enterprise kéo order |
| **G5** | 3F Hardening | 3F.1–3F.3 connector #2 optional, SLOs, eval | Phase 3 checklist |

**Evidence G:** [plan-g-dod-evidence](./plan-g-dod-evidence.md) — code path DONE; advisor quality and public API breadth AMBER by design. CPC vẫn chưa claim.

---

## P4c — Plan H · Phase 4 ERP-lite → **CPC** — **IN PROGRESS**

**Playbook:** [plan-h-priority-execution](./2026-07-24-plan-h-priority-execution.md) · [plan](./2026-07-24-plan-h-phase4-erp-lite.md) · [evidence](./plan-h-dod-evidence.md)

| Ưu tiên | Wave | Bước | DoD wave |
|--------:|------|------|----------|
| **H0** | 4A Multi-warehouse | 4A.1–4A.4 branches/warehouses, transfer, RLS | 2 kho / org đúng — IN PROGRESS |
| **H1** | 4B Supplier & PO | 4B.1–4B.4 suppliers, PO → nhập kho | PO → tồn có truy vết |
| **H2** | 4C E-invoice | 4C.1–4C.4 provider hooks, DLQ | 1 provider sandbox |
| **H3** | 4D Staff mobile | 4D.1–4D.3 PWA/app mỏng inbox+ship | CSKH/kho dùng mobile |
| **H4** | 4E Accounting export | 4E.1–4E.3 export sổ chi tiết | Kế toán import được |
| **H5** | 4F CPC hardening | 4F.1–4F.4 regression, DR, CPC checklist, API freeze | **CPC ĐẠT** |

---

## P5 — Plan I · M4 → **E100** (overlap từ cuối F)

| Ưu tiên | Bước | DoD |
|--------:|------|-----|
| **I1** | M4.1 SSO/SAML path hoặc cam kết ≤90 ngày Enterprise | Onboard SSO / calendar |
| **I2** | M4.2 SOC 2 Type I in progress / evidence pack | Controls mapped |
| **I3** | M4.3 Pen-test + fix critical | Report đóng |
| **I4** | M4.4 Status page + incident comms | Trang public |
| **I5** | M4.5 Subprocessors **công khai** | URL published |
| **I6** | M4.6 SLA hợp đồng + support tier | Trong contract |
| **I7** | M4.7 SBOM mỗi release | Artifact CI |
| **I8** | M4.8 Access review `platform_admins` | Checklist quý |

**E100** chỉ khi I1–I8 DoD xanh.

---

## P6 — Epoch 5 (optional, sau CPC)

5A Agency multi-org · 5B Data residency · 5C Vertical packs · 5D Partner marketplace — **không bắt buộc CPC**.

---

## Checklist vận hành từng plan (lặp lại)

Với mỗi plan E→I:

1. Đọc playbook / viết full plan JIT (F–I)  
2. Branch `feat/plan-X-…` + worktree  
3. Execute theo thứ tự ưu tiên (Subagent-Driven cho code; ops có evidence)  
4. DoD evidence file  
5. Merge `main` + push  
6. Mới mở plan sau  

---

## Tóm tắt một trang — làm gì **tiếp theo**

```
DONE P0 docs + P3 Plan E code/docs (paid/live AMBER = owner parallel)
DONE Plan F 2A→2H
DONE Plan G 3A→3F
▶ NOW eng: Execute Plan H → CPC
THEN Plan I → E100
OWNER parallel: §12.1 · Meta Review submit · Pro+PITR drill · always-on
```

---

## Liên kết nhanh

| Tài liệu | Path |
|----------|------|
| Roadmap tổng | [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md) |
| Plan E playbook | [plan-e-priority-execution](./2026-07-24-plan-e-priority-execution.md) |
| Plan E DoD | [plan-e-dod-evidence](./plan-e-dod-evidence.md) |
| Plan F playbook | [plan-f-priority-execution](./2026-07-24-plan-f-priority-execution.md) |
| Plan H playbook | [plan-h-priority-execution](./2026-07-24-plan-h-priority-execution.md) |
| F–I index | [plans-f-i-post-phase1-index](./2026-07-24-plans-f-i-post-phase1-index.md) |
| Wave chi tiết gốc | [master-roadmap](../specs/2026-07-24-master-roadmap-commercial-complete.md) |
| Pilot DoD | [plan-d-dod-evidence](./plan-d-dod-evidence.md) |
