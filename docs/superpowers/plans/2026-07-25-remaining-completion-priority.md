# Kế hoạch chi tiết còn lại — từng bước theo thứ tự ưu tiên tới hoàn thiện

**Date:** 2026-07-25 (cập nhật 2026-07-26 — **local-first** / Wave L1)  
**Baseline:** `main` @ `51f5370`  
**SoT tổng:** [path-to-completion-priority](./2026-07-24-path-to-completion-priority.md) · [path-to-100](./2026-07-25-path-to-100-percent.md) · [cpc-checklist](./cpc-checklist.md) · [L1 plan](./2026-07-26-sdd-l1-local-first.md)

> Engineering path **A→I scaffolding** đã trên `main`. **NOW = Pha Local** (Docker / `dev:local`). Render + Meta staging chỉ khi **claim CPC thương mại**. Không làm Epoch 5 trước khi xong E100 (trừ khi chủ đích thay đổi).

---

## 0. Ba đích (trạng thái thật)

| # | Đích | Status hiện tại | Còn thiếu |
|---|------|-----------------|-----------|
| 1 | **Pilot Phase 1** | **DONE** | — |
| 2 | **CPC** (bán / vận hành thương mại) | **Engineering READY** · **Commercial AMBER** | Clear live-ops AMBER (Wave R0→R2) — **deferred tới CPC claim** |
| 3 | **E100** | **BLOCKED** | Clear Plan I I1–I8 live/compliance (Wave R3) |

```
DONE     Pilot A–D
DONE     F + G + H code  → CPC engineering
AMBER    E paid/live + P0 live + F/G/H live ambers
DONE     Wave L1 local-first eng (stack · stub · E0.4 notes · gate)
▶ NEXT   (optional) tiếp tục eng local  OR  (khi claim CPC) Wave R0 → R2
THEN     Wave R3        Plan I live/compliance → claim E100
OPTIONAL Epoch 5
```

**Quy tắc:** Local-first · Không claim CPC trước R0–R2 · Không claim E100 trước I1–I8 · Render payment **không** “tiếp theo ngay”.

---

## Wave L1 / E0 leftover — Local eng (**NOW**)

| Ưu tiên | Bước | Việc | Xong khi |
|--------:|------|------|----------|
| **E0.2** | Knowledge reindex | GEMINI → chunks > 0 **hoặc** stub embeddings khi key trống | `knowledge_chunks` > 0 local; non-prod stub marked |
| **E0.3** | Walkthrough local | Non-Meta §12.1 refresh | Meta rows BLOCKED OK |
| **E0.4** | Stub notes | Local-phase: `undecided` OK; Meta-only often intends `AMBER_OK` (no forged signature); **must** REQUIRED/AMBER_OK trước CPC | [cpc-checklist § Stub](./cpc-checklist.md#stub-decisions-owner) |

**Playbook:** [local-host.md](../../ops/local-host.md) · [L1 SDD](./2026-07-26-sdd-l1-local-first.md)

---

## Wave R0 — Nền staging + Meta (**khi claim CPC** — không “tiếp theo ngay”)

**Mục tiêu:** Staging chạy được end-to-end; App Review đi vào pipeline.  
**Owner chính:** Owner / ops · Eng hỗ trợ khi fail.

| Ưu tiên | Bước | Việc cụ thể | Xong khi | Evidence |
|--------:|------|-------------|----------|----------|
| **R0.1** | Apply migrations | Chạy mọi migration tới tip `main` trên **staging** theo `docs/ops/p0-staging-migrate.md` | `db push`/`migrate` xanh | Log ngày + project ref |
| **R0.2** | Deploy always-on staging | `web`+`api`+`ai` không sleep (có thể tạm paid staging) | Webhook Meta không miss vì cold start | URL health 200 ổn định |
| **R0.3** | §12.1 walkthrough | Checklist tay VI theo `docs/ops/p0-staging-walkthrough-12-1.md` | Mọi dòng checklist tick | File checklist đã điền |
| **R0.4** | Meta App Review submit | Terms/Privacy/webhook/permissions theo `docs/ops/p0-meta-app-review-submit.md` | App **Submitted** (hoặc Approved) | Screenshot / App ID state |
| **R0.5** | Smoke automation | Xác nhận `.github/workflows/scheduled-qa.yml` chạy xanh trên `main` | 1 run xanh (cron hoặc dispatch) | Link Actions |

**Gate R0:** Staging walkthrough xanh + migrate xanh + Review submitted.  
**Song song OK:** R0.4 ∥ R0.3 sau khi R0.1–R0.2 xong.

---

## Wave R1 — Plan E paid/live (bắt buộc trước CPC thương mại)

**Mục tiêu:** Hết Free cold-start / DR / on-call / LLM cap proven.  
**Playbook:** [plan-e-priority-execution](./2026-07-24-plan-e-priority-execution.md) · Evidence: [plan-e-dod-evidence](./plan-e-dod-evidence.md)

| Ưu tiên | Bước | Việc cụ thể | Xong khi | Evidence |
|--------:|------|-------------|----------|----------|
| **R1.0** | Supabase Pro + PITR | Upgrade prod; bật PITR; staging ≠ prod | Pro + PITR ON | Dashboard screenshot |
| **R1.1** | Restore drill | 1 lần theo `docs/runbooks/supabase-pro-pitr-restore-drill.md` | Restore thành công; ghi RPO/RTO | Biên bản trong runbook |
| **R1.2** | Always-on prod | Hosts `web`+`api`+`ai` theo `docs/runbooks/always-on-hosts.md` | Cold start = 0 trên critical path | Deploy URLs + config |
| **R1.3** | Uptime + on-call | Monitors 3 service; rota theo `docs/runbooks/on-call.md` | Alert test fire 1 lần | Screenshot alert + tên trực |
| **R1.4** | LLM paid + cap prove | Keys thật staging/prod; vượt daily/monthly cap | Cap chặn + failover doc còn đúng | Log 403/cap + `llm-failover-spend-cap.md` filled |
| **R1.5** | Billing live | Ops set plan org pilot; chứng minh vượt `max_pages` / `auto_confirm` bị gate | Shop bị chặn đúng | Ticket/ops log |
| **R1.6** | Đóng evidence E | Cập nhật `plan-e-dod-evidence.md` AMBER→GREEN từng dòng paid | E0–E3, E7 live GREEN | PR docs |

**Cấm:** Charge khách / gắn domain prod trước R1.0–R1.1.  
**Song song OK:** R1.2∥R1.0 · R1.4∥R1.2 · R1.3 sau R1.2.

**Gate R1:** Restore drill + always-on + uptime alert + spend cap proven + evidence E cập nhật.

---

## Wave R2 — Clear AMBER sản phẩm (F/G/H live) → **claim CPC**

**Mục tiêu:** Các lỗ hổng “code GREEN / live AMBER” đủ để bán vận hành.  
Làm **theo thứ tự** dưới; không nhảy e-invoice thật trước carrier nếu COD phụ thuộc vận đơn.

| Ưu tiên | Bước | Việc cụ thể | Owner | Xong khi |
|--------:|------|-------------|-------|----------|
| **R2.1** | Carrier E2E | 1 đơn staging → tạo vận đơn GHN (hoặc carrier đã chọn) thật; tracking cập nhật; fail → export Excel vẫn OK (`docs/runbooks/shipping-carrier-fallback.md`) | Eng+Owner | 1 shipment thật + biên bản |
| **R2.2** | COD live | Ship COD → ghi thu → reconcile → discrepancy 1 case | Eng+Owner | Báo cáo `/cod` khớp BIGINT |
| **R2.3** | Returns live | Hoàn 1 đơn shipped → `return_restock` + COD write-off đúng | Eng+Owner | Stock + COD đúng |
| **R2.4** | Zalo OA (nếu bán đa kênh) | OAuth/token thật + worker persist inbound (hiện stub outbox) | Eng | Inbox nhận tin Zalo |
| **R2.5** | E-invoice provider | Thay stub bằng 1 provider sandbox (VN) + tax review nội bộ | Eng+Legal | 1 job `sent` sandbox |
| **R2.6** | Advisor quality (tuỳ) | Bật LLM thật cho `/v1/advisor/suggest`; eval grounded tối thiểu | Eng | AMBER→GREEN hoặc chấp nhận AMBER có ghi chú |
| **R2.7** | CPC checklist | Điền [cpc-checklist](./cpc-checklist.md); cập nhật verdict | Owner | **CPC thương mại GREEN** |

**Có thể hoãn không chặn CPC (ghi rõ AMBER chấp nhận):** R2.4 nếu chỉ bán Meta; R2.5 nếu xuất hóa đơn ngoài hệ thống; R2.6 nếu advisor stub chấp nhận được.

**Gate R2 (tối thiểu để claim CPC):** R2.1 + R2.2 + R2.3 + R2.7 + Gate R0 + Gate R1.  
R2.4–R2.6: GREEN hoặc AMBER có quyết định owner ghi trong checklist.

---

## Wave R3 — Plan I live/compliance → **claim E100**

**Mục tiêu:** Enterprise 100/100.  
**Playbook:** [plan-i-priority-execution](./2026-07-24-plan-i-priority-execution.md) · Evidence: [plan-i-dod-evidence](./plan-i-dod-evidence.md)

Thứ tự ưu tiên (I1 trước khi bán Enterprise SSO; I2/I3 có lead time — **kick-off sớm**):

| Ưu tiên | Task | Việc cụ thể | Lead time gợi ý | Xong khi |
|--------:|------|-------------|-----------------|----------|
| **R3.0** | Kick-off song song | Chọn vendor SOC2 + pen-test; kick-off lịch | Ngay sau Gate R1 | PO/contract vendor |
| **R3.1** | **I1** SSO | Implement SAML/OIDC thật hoặc calendar ≤90 ngày đã ký với khách Enterprise | 2–8 tuần | `sso/status` available **hoặc** thư cam kết có ngày |
| **R3.2** | **I2** SOC2 | Evidence pack đầy đủ; Type I in progress | 3–12 tháng overlap | Auditor letter / control map dated |
| **R3.3** | **I3** Pen-test | Scan + report; fix critical/high | 2–6 tuần | Report đóng + ticket fix |
| **R3.4** | **I4** Status live | Nối `/status` hoặc status vendor (Better Stack/Statuspage) + quy trình incident | 1 tuần | Trang public phản ánh uptime thật |
| **R3.5** | **I5** Subprocessors process | Quy trình notify khách khi đổi list; legal approve | 1 tuần | Policy + lần publish đã ghi |
| **R3.6** | **I6** SLA ký | Legal approve `docs/legal/sla-template.md`; gắn support tier vào hợp đồng | 1–4 tuần | Template approved / dùng trong contract |
| **R3.7** | **I7** SBOM enforce | Bắt buộc artifact SBOM mỗi release tag | 2–5 ngày | CI fail nếu thiếu SBOM |
| **R3.8** | **I8** Access review | Chạy review `platform_admins` lần 1 theo runbook | 1 ngày | Biên bản quý |
| **R3.9** | Đóng E100 | Cập nhật `plan-i-dod-evidence.md` I1–I8 GREEN | — | **E100 claimed** |

**Song song OK:** R3.0∥R3.1 · I2∥I3∥I4–I8 sau kick-off.  
**Cấm:** Claim E100 khi còn bất kỳ I* AMBER “vendor chưa chạy”.

**Gate R3:** I1–I8 GREEN + evidence file đóng.

---

## Wave R4 — Epoch 5 (optional, sau E100 hoặc sau CPC nếu chủ đích)

Chỉ khi CPC/E100 ổn: Agency multi-org · Data residency · Vertical packs · Partner marketplace.  
**Không** nằm trên critical path hoàn thiện mặc định.

---

## Lịch làm việc gợi ý (1 owner + 1–2 eng)

| Tuần | Focus | Output |
|-----:|-------|--------|
| **Ngay** | Pha Local L1 (E0.2 / E0.4 / walkthrough) | Eng local advanced |
| Khi claim CPC | R0.1–R0.5 | Staging xanh, Review submitted |
| +1–2 | R1.0–R1.6 | Pro/PITR/drill, always-on, monitors, LLM cap |
| +2–3 | R2.1–R2.3 (+ quyết định R2.4–R2.6) | Carrier/COD/returns live |
| +3 | R2.7 | **CPC thương mại** |
| +3→ | R3.0 kick-off SOC2/pen-test | Vendor started |
| 4–12+ | R3.1–R3.9 | SSO, pen-test close, SLA, SBOM enforce, access review; SOC2 overlap |
| Khi I1–I8 xanh | — | **E100** |

---

## Checklist vận hành mỗi bước

1. Đọc runbook / playbook liên quan  
2. Làm việc → ghi evidence (screenshot, log, PR docs)  
3. Cập nhật dòng tương ứng trong `plan-*-dod-evidence.md` hoặc `cpc-checklist.md`  
4. Chỉ sang bước sau khi gate sóng hiện tại đạt (trừ bước đã đánh dấu song song)

---

## Trạng thái cập nhật (2026-07-26 — local-first)

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Code A→I scaffolding | **GREEN** | Trên `main` |
| Local full stack (Docker Supabase + api/web/ai) | **GREEN** | `docs/ops/local-host.md` · `pnpm run dev:local` — **default coding/SDD** |
| R0.1 migrate CI + remote staging | **GREEN** | Staging `tjsmpcgkeoglemptuymu` **29** migrations |
| R0.5 Scheduled QA | **GREEN** | Actions run 30139904845 |
| R0.2 Always-on staging (Render) | **BLOCKED / deferred** | Không “tiếp theo ngay”; mở khi claim CPC |
| R0.3 §12.1 walkthrough | **AMBER** | Local non-Meta; Meta BLOCKED OK; refresh trong L1 |
| R0.4 Meta App Review | **BLOCKED / deferred** | Khi claim CPC |
| E2–E5 eng | **CLOSED** | PR #22–#25; CPC/E100 vẫn không 100% |
| Wave L1 local-first | **CLOSED** | Tasks 1–5 DONE (`2026-07-26`); eng local advanced; CPC claim deferred — [L1 gate](../../ops/r0-r3-execution-evidence.md#wave-l1-sdd-gate-2026-07-26--local-first-eng-closed-cpc-claim-deferred) |
| R1–R2 live | **AMBER** | Billing / carrier / COD live — khi claim CPC |
| R3 E100 | **BLOCKED** | Sau CPC thương mại |

**Hai làn:**

| Làn | Mục đích | Khi nào |
|-----|----------|---------|
| **Local (default)** | Coding/SDD hàng ngày, E0.2/E0.4, walkthrough non-Meta | **NOW** |
| **Staging/Prod paid** | R0.2–R0.4, R1, R2 live, claim CPC | **Khi claim CPC only** |

---

## Tóm tắt một trang — làm gì **tiếp theo ngay**

Evidence live: [r0-r3-execution-evidence](../../ops/r0-r3-execution-evidence.md) · path-to-100: [2026-07-25-path-to-100-percent](./2026-07-25-path-to-100-percent.md) · **thực thi:** [completion-step-by-step](./2026-07-25-completion-step-by-step.md) · **L1:** [sdd-l1-local-first](./2026-07-26-sdd-l1-local-first.md) · **L1 gate:** [evidence § Wave L1](../../ops/r0-r3-execution-evidence.md#wave-l1-sdd-gate-2026-07-26--local-first-eng-closed-cpc-claim-deferred)

**~% thật:** eng ~96%+ · CPC ~38% · E100 ~22%+ · tổng ~55% — **không** claim CPC/E100/tổng 100%.

```
DONE    Wave L1 (SoT · stack · stub embeddings · E0.4 notes · gate)
▶ NOW   (optional) tiếp tục eng local trên Docker + dev:local
OR      (khi sẵn sàng claim CPC) Owner: R0.2 payment → Starter ×3
THEN    (khi claim CPC) Owner: R0.4 real META_* + App Review submit
THEN    R0.3b staging → Gate R0 → E0.4 decide → R1 → R2 → CPC → R3 → E100 → TỔNG 100%
```

Chi tiết Bước: [2026-07-25-completion-step-by-step.md](./2026-07-25-completion-step-by-step.md).

---

## Liên kết nhanh

| Tài liệu | Path |
|----------|------|
| SoT ưu tiên gốc | [path-to-completion-priority](./2026-07-24-path-to-completion-priority.md) |
| Wave L1 | [sdd-l1-local-first](./2026-07-26-sdd-l1-local-first.md) |
| CPC checklist | [cpc-checklist](./cpc-checklist.md) |
| Plan E evidence | [plan-e-dod-evidence](./plan-e-dod-evidence.md) |
| Plan I playbook | [plan-i-priority-execution](./2026-07-24-plan-i-priority-execution.md) |
| Staging walkthrough | `docs/ops/p0-staging-walkthrough-12-1.md` |
| Local host | `docs/ops/local-host.md` |
| PITR drill | `docs/runbooks/supabase-pro-pitr-restore-drill.md` |
