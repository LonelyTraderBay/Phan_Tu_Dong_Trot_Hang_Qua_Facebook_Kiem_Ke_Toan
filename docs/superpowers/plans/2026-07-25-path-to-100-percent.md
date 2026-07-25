# Kế hoạch chi tiết — từng bước tới **100%** hoàn thiện

**Date:** 2026-07-25  
**SoT song song:** [remaining-completion-priority](./2026-07-25-remaining-completion-priority.md) · [cpc-checklist](./cpc-checklist.md)

## Định nghĩa 100%

| Đích | = 100% khi | Hiện tại |
|------|------------|----------|
| **Eng path** | A→H không stub chặn bán + regression xanh | ~**88%** |
| **CPC thương mại** | Gate R0+R1+R2.1–2.3+R2.7 GREEN; `cpc-checklist` verdict GREEN | ~**38%** |
| **E100** | Plan I I1–I8 live/compliance GREEN | ~**22%** |
| **Tổng intended scope** | CPC thương mại **và** E100 | ~**55%** |

```
100% tổng = CPC thương mại GREEN + E100 GREEN
(không gồm Epoch 5 — optional sau E100)
```

**Quy tắc claim:** Không ghi 100% CPC trước Gate R0–R2 · Không ghi E100 trước I1–I8 · Một critical path tại một thời điểm.

---

## Bản đồ % → Wave (thứ tự ưu tiên)

| # | Wave | Đẩy % nào | Owner | Điều kiện bắt đầu |
|--:|------|-----------|-------|-------------------|
| 0 | **E0** Eng leftover | 88% → ~95% eng | Eng | Ngay (song song R0) |
| 1 | **R0** Staging + Meta | CPC live | Owner+Eng | Đang làm (R0.1/R0.5 DONE) |
| 2 | **R1** Plan E paid/live | CPC live | Owner | Sau R0.2 (always-on) tối thiểu |
| 3 | **R2** F/G/H live → **CPC 100%** | CPC → **100%** | Eng+Owner | Sau Gate R0+R1 |
| 4 | **R3** Plan I → **E100 100%** | E100 → **100%** | Eng+Legal+Vendor | Sau CPC (kick-off vendor sớm từ R1) |
| 5 | **R4** Epoch 5 | Ngoài 100% mặc định | — | Optional |

```
NOW ~55% tổng
  │
  ├─ E0 eng leftovers ──────────────► eng ~95%
  ├─ R0 (còn R0.2–R0.4) ────────────► mở Meta + staging E2E
  ├─ R1 paid/live ──────────────────► DR / always-on / LLM / billing
  ├─ R2.1–2.3 + R2.7 ───────────────► ★ CPC thương mại 100%
  └─ R3 I1–I8 ──────────────────────► ★ E100 100%  ⇒ ★ TỔNG 100%
```

---

## Wave E0 — Đóng eng leftover (song song R0)

**Mục tiêu:** Hết bug/stub chặn walkthrough và bán tối thiểu.

| Ưu tiên | Bước | Việc | Xong khi |
|--------:|------|------|----------|
| **E0.1** | Merge warehouse fix | PR `fix/default-warehouse-on-org-create` → `main`; push migration staging | Confirm order không còn 500 `orders_failed` |
| **E0.2** | Local Inngest | `npx inngest-cli dev -u http://127.0.0.1:3001/api/inngest` trong `local-host.md` đã ghi; verify `knowledge_chunks` > 0 sau create product | Criterion 3 reindex PASS local |
| **E0.3** | §12.1 local đầy đủ | Walkthrough không-Meta PASS; Meta rows vẫn BLOCKED đến R0.4 | File walkthrough cập nhật |
| **E0.4** | Quyết định stub CPC | Owner ghi rõ: Zalo / e-invoice / advisor = GREEN bắt buộc hay AMBER chấp nhận khi claim CPC | Ghi trong `cpc-checklist.md` |

**Gate E0:** E0.1 merged + confirm E2E xanh (local hoặc staging).

---

## Wave R0 — Staging + Meta → mở đường live

| Ưu tiên | Bước | Việc cụ thể | Status | Xong khi |
|--------:|------|-------------|--------|----------|
| **R0.1** | Migrations | Staging + CI | **DONE** | — |
| **R0.5** | Scheduled QA | Actions xanh | **DONE** | — |
| **R0.2** | Always-on staging | Render payment → Starter × `omni-api/ai/web-staging` | AMBER | Health ổn định, không sleep; **không** dùng keep-warm làm GREEN |
| **R0.3a** | Walkthrough local | `p0-staging-walkthrough-12-1.md` | AMBER/partial | Criteria không-Meta PASS |
| **R0.3b** | Walkthrough staging | Lặp trên URL public sau R0.2 | AMBER | Full §12.1 (sau Meta) |
| **R0.4** | Meta App Review | `META_*` thật; Terms/Privacy; webhook; submit | AMBER | **Submitted** (hoặc Approved) |

**Gate R0:** R0.1 + R0.3 (staging đủ) + R0.4 submitted + R0.5.  
**Playbook:** `docs/ops/p0-staging-walkthrough-12-1.md` · `docs/ops/p0-meta-app-review-submit.md` · `docs/ops/deploy-staging-render.md`

---

## Wave R1 — Plan E paid/live (bắt buộc trước bán)

| Ưu tiên | Bước | Việc | Xong khi |
|--------:|------|------|----------|
| **R1.0** | Supabase Pro + PITR | Prod ≠ staging; PITR ON | Screenshot dashboard |
| **R1.1** | Restore drill | 1 lần theo runbook | Biên bản RPO/RTO |
| **R1.2** | Always-on **prod** | web+api+ai | Cold start = 0 |
| **R1.3** | Uptime + on-call | Monitor 3 service; alert test 1 lần | Screenshot + tên trực |
| **R1.4** | LLM paid + spend cap | Keys thật; vượt cap | Cap chặn được |
| **R1.5** | Billing gates | `max_pages` / `auto_confirm` | Shop bị chặn đúng |
| **R1.6** | Evidence E | `plan-e-dod-evidence.md` paid → GREEN | PR docs |

**Cấm:** Charge khách / domain prod trước R1.0–R1.1.  
**Gate R1:** R1.0–R1.6 xanh.  
**Song song:** Kick-off vendor SOC2/pen-test (**R3.0**) ngay sau R1.0 để lead time không chặn E100 sau này.

---

## Wave R2 — Clear live AMBER → **CPC thương mại = 100%**

Thứ tự bắt buộc (COD phụ thuộc vận đơn):

| Ưu tiên | Bước | Việc | Bắt buộc CPC? | Xong khi |
|--------:|------|------|---------------|----------|
| **R2.1** | Carrier E2E | 1 đơn → GHN (hoặc carrier chọn) thật + fallback Excel | **Có** | Biên bản shipment |
| **R2.2** | COD live | Ship → thu → reconcile → 1 discrepancy | **Có** | `/cod` khớp BIGINT |
| **R2.3** | Returns live | Hoàn shipped → restock + COD write-off | **Có** | Stock + COD đúng |
| **R2.4** | Zalo OA | OAuth + worker persist (nếu đa kênh) | Tuỳ E0.4 | Inbox Zalo |
| **R2.5** | E-invoice | Provider sandbox VN + tax review | Tuỳ E0.4 | Job `sent` |
| **R2.6** | Advisor LLM | Bật LLM thật + eval tối thiểu | Tuỳ E0.4 | GREEN hoặc AMBER ghi chú |
| **R2.7** | CPC checklist | Điền `cpc-checklist.md` | **Có** | Verdict **CPC thương mại GREEN** |

**Gate CPC 100%:** Gate R0 + Gate R1 + R2.1 + R2.2 + R2.3 + R2.7.  
→ Metric “Commercial CPC” = **100%**. Eng path ≈ **95–100%** tùy E0.4.

---

## Wave R3 — Plan I → **E100 = 100%** → **Tổng = 100%**

| Ưu tiên | Bước | Việc | Lead time | Xong khi |
|--------:|------|------|-----------|----------|
| **R3.0** | Kick-off | Vendor SOC2 + pen-test | Ngay sau R1 | PO/contract |
| **R3.1** | I1 SSO | SAML/OIDC thật **hoặc** cam kết ≤90 ngày đã ký | 2–8 tuần | `sso/status` available hoặc thư cam kết |
| **R3.2** | I2 SOC2 | Evidence pack; Type I in progress | 3–12 tháng | Auditor letter / control map |
| **R3.3** | I3 Pen-test | Scan + fix critical/high | 2–6 tuần | Report đóng |
| **R3.4** | I4 Status | Statuspage/Better Stack live | 1 tuần | Trang public thật |
| **R3.5** | I5 Subprocessors | Notify process + legal | 1 tuần | Policy published |
| **R3.6** | I6 SLA | Legal approve template | 1–4 tuần | Dùng trong contract |
| **R3.7** | I7 SBOM | CI fail nếu thiếu SBOM mỗi release | 2–5 ngày | Enforce xanh |
| **R3.8** | I8 Access review | Review `platform_admins` quý 1 | 1 ngày | Biên bản |
| **R3.9** | Đóng E100 | `plan-i-dod-evidence.md` I1–I8 GREEN | — | **E100 claimed** |

**Gate E100 100%:** I1–I8 GREEN.  
→ Metric tổng intended scope = **100%**.

---

## Lịch gợi ý (1 owner + 1–2 eng) → 100%

| Tuần | Focus | % đích gần |
|-----:|-------|------------|
| **Ngay** | E0.1 merge warehouse · E0.3 local walkthrough · Owner: Render payment + META_* | eng↑ · mở R0 |
| **1** | R0.2 → R0.3b → R0.4 submitted | Gate R0 |
| **1–2** | R1.0–R1.6 + R3.0 kick-off vendor | Gate R1 |
| **2–3** | R2.1–R2.3 → R2.7 | **★ CPC 100%** |
| **3–12+** | R3.1–R3.9 (SOC2 overlap dài) | **★ E100 100%** → **★ Tổng 100%** |

---

## Checklist vận hành mỗi bước

1. Đọc runbook / playbook liên quan  
2. Làm → ghi evidence (screenshot, log, PR)  
3. Cập nhật `r0-r3-execution-evidence.md` + `plan-*-dod-evidence.md` / `cpc-checklist.md`  
4. Chỉ sang bước sau khi gate sóng đạt (trừ bước đã đánh dấu song song)  
5. Không claim % đích khi còn AMBER bắt buộc

---

## Việc **tiếp theo ngay** (thứ tự cứng)

```
1. Eng:   merge fix warehouse (E0.1) + db push staging
2. Eng:   R0.3a walkthrough local (Inngest nếu cần chunks)
3. Owner: Render Starter ×3 (R0.2)
4. Owner: META_* + App Review submit (R0.4)
5. Cả hai: R0.3b staging full §12.1
6. Owner: R1 Pro/PITR/always-on/LLM/billing
7. Cả hai: R2.1→R2.3→R2.7  →  CPC 100%
8. Cả hai: R3 I1–I8         →  E100 100%  →  TỔNG 100%
```

---

## Liên kết nhanh

| Tài liệu | Path |
|----------|------|
| SoT R0–R3 chi tiết | [2026-07-25-remaining-completion-priority.md](./2026-07-25-remaining-completion-priority.md) |
| CPC checklist | [cpc-checklist.md](./cpc-checklist.md) |
| Evidence live | `docs/ops/r0-r3-execution-evidence.md` |
| Walkthrough §12.1 | `docs/ops/p0-staging-walkthrough-12-1.md` |
| Meta App Review | `docs/ops/p0-meta-app-review-submit.md` |
| Plan E / I playbooks | `2026-07-24-plan-e-priority-execution.md` · `2026-07-24-plan-i-priority-execution.md` |
