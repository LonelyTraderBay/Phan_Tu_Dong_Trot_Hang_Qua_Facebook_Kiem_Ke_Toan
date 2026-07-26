# Kế hoạch chi tiết — từng bước tới **100%** hoàn thiện

**Date:** 2026-07-25 (cập nhật 2026-07-26 — **L2 CLOSED**; code-complete local advanced; CPC deferred)  
**SoT song song:** [remaining-completion-priority](./2026-07-25-remaining-completion-priority.md) · [cpc-checklist](./cpc-checklist.md) · [L1 plan](./2026-07-26-sdd-l1-local-first.md) · [L2 plan](./2026-07-26-sdd-l2-code-complete.md) · [L2 gate](../../ops/r0-r3-execution-evidence.md#wave-l2-sdd-gate-2026-07-26--code-complete-local-closed-commercial-deferred)  
**Checklist thực thi từng bước (owner+eng):** [completion-step-by-step](./2026-07-25-completion-step-by-step.md)

## Định nghĩa 100%

| Đích | = 100% khi | Hiện tại |
|------|------------|----------|
| **Eng path** | A→H không stub chặn bán + regression xanh | ~**96%**+ (L1: E0.2 stub + E0.4 notes DONE; live R2 polish còn) |
| **CPC thương mại** | Gate R0+R1+R2.1–2.3+R2.7 GREEN; `cpc-checklist` verdict GREEN | ~**38%** — **không** 100% |
| **E100** | Plan I I1–I8 live/compliance GREEN | ~**22%** — **không** 100% |
| **Tổng intended scope** | CPC thương mại **và** E100 | ~**55%** — **không** 100% |

```
100% tổng = CPC thương mại GREEN + E100 GREEN
(không gồm Epoch 5 — optional sau E100)
```

**Quy tắc claim:** Không ghi 100% CPC trước Gate R0–R2 · Không ghi E100 trước I1–I8 · Một critical path tại một thời điểm.

**Owner policy (2026-07-26):** **local-first** trên PC. Render billing / Meta staging **không** “tiếp theo ngay” — chỉ khi claim CPC thương mại.

---

## Bản đồ % → Wave (thứ tự ưu tiên)

| # | Wave | Đẩy % nào | Owner | Điều kiện bắt đầu |
|--:|------|-----------|-------|-------------------|
| 0 | **L1 / E0 leftover** | Eng local ↑ | Eng | **NOW** — Docker + `dev:local` |
| 1 | **R0** Staging + Meta | CPC live | Owner+Eng | **Khi claim CPC** (sau Pha Local) |
| 2 | **R1** Plan E paid/live | CPC live | Owner | Sau R0.2 (always-on) tối thiểu |
| 3 | **R2** F/G/H live → **CPC 100%** | CPC → **100%** | Eng+Owner | Sau Gate R0+R1 |
| 4 | **R3** Plan I → **E100 100%** | E100 → **100%** | Eng+Legal+Vendor | Sau CPC (kick-off vendor sớm từ R1) |
| 5 | **R4** Epoch 5 | Ngoài 100% mặc định | — | Optional |

```
NOW ~55% tổng (CPC ~38% · E100 ~22% · eng ~96%+)
  │
  ├─ ▶ Pha Local (L1): E0.2 · E0.4 notes · walkthrough — **CLOSED**
  ├─ E0+E1+E2 eng ── DONE (scaffolding)
  ├─ R0 (R0.2–R0.4) ── deferred tới CPC claim ──► Meta + staging E2E
  ├─ R1 paid/live ──────────────────► DR / always-on / LLM / billing
  ├─ R2.1–2.3 + R2.7 ───────────────► ★ CPC thương mại 100%
  └─ R3 I1–I8 ──────────────────────► ★ E100 100%  ⇒ ★ TỔNG 100%
```

---

## Wave E0 / L1 — Đóng eng leftover (**NOW** local-first)

**Mục tiêu:** Hết bug/stub chặn walkthrough local; không cần Render payment.

| Ưu tiên | Bước | Việc | Xong khi |
|--------:|------|------|----------|
| **E0.1** | Merge warehouse fix | PR → `main`; migration local | Confirm order không còn 500 — **DONE** |
| **E0.2** | Local Inngest + embed | GEMINI → chunks > 0 **hoặc** stub embeddings khi key trống (non-prod) | Criterion reindex PASS local; **không** claim live LLM quality |
| **E0.3** | §12.1 local đầy đủ | Walkthrough không-Meta PASS; Meta rows **BLOCKED** OK local | File walkthrough cập nhật |
| **E0.4** | Stub notes local-phase | Local: R2.4–R2.6 **may** stay `undecided`; recommend Meta-only `AMBER_OK` intent (no forged signature); **must** be `REQUIRED`/`AMBER_OK` trước CPC claim | [cpc-checklist § Stub decisions](./cpc-checklist.md#stub-decisions-owner) |

**Gate L1 (local):** Stack health + E0.2 local path + walkthrough non-Meta refresh + E0.4 notes.  
**Không** = Gate R0 / CPC.

---

## Wave R0 — Staging + Meta → mở đường live (**khi claim CPC**)

| Ưu tiên | Bước | Việc cụ thể | Status | Xong khi |
|--------:|------|-------------|--------|----------|
| **R0.1** | Migrations | Staging + CI | **DONE** | — |
| **R0.5** | Scheduled QA | Actions xanh | **DONE** | — |
| **R0.2** | Always-on staging | Render payment → Starter × `omni-api/ai/web-staging` | **BLOCKED** (deferred) | Health ổn định, không sleep; **không** dùng keep-warm làm GREEN |
| **R0.3a** | Walkthrough local | `p0-staging-walkthrough-12-1.md` | AMBER/partial | Criteria không-Meta PASS |
| **R0.3b** | Walkthrough staging | Lặp trên URL public sau R0.2 | AMBER | Full §12.1 (sau Meta) |
| **R0.4** | Meta App Review | `META_*` thật; Terms/Privacy; webhook; submit | **BLOCKED** (deferred) | **Submitted** (hoặc Approved) |

**Gate R0:** R0.1 + R0.3 (staging đủ) + R0.4 submitted + R0.5.  
**Playbook:** `docs/ops/p0-staging-walkthrough-12-1.md` · `docs/ops/p0-meta-app-review-submit.md` · `docs/ops/deploy-staging-render.md`  
**Lịch:** chỉ khi owner mở Pha CPC claim — **không** “tiếp theo ngay”.

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
| **R3.7** | I7 SBOM | CI fail nếu thiếu SBOM mỗi release | 2–5 ngày | **Eng enforce GREEN** (E3 T4); org `v*` tag process AMBER |
| **R3.8** | I8 Access review | Review `platform_admins` quý 1 | 1 ngày | Biên bản |
| **R3.9** | Đóng E100 | `plan-i-dod-evidence.md` I1–I8 GREEN | — | **E100 claimed** |

**Gate E100 100%:** I1–I8 GREEN.
→ Metric tổng intended scope = **100%**.

---

## Lịch gợi ý (1 owner + 1–2 eng) → 100%

| Tuần | Focus | % đích gần |
|-----:|-------|------------|
| **Ngay** | **Post-L2:** tiếp tục local hardening **hoặc** (owner) CPC claim | eng↑ local / Gate R0 |
| **Khi claim CPC** | R0.2 Render Starter · R0.4 META_* · R0.3b staging | Gate R0 |
| **+1–2** | R1.0–R1.6 + R3.0 kick-off vendor | Gate R1 |
| **+2–3** | R2.1–R2.3 → R2.7 | **★ CPC 100%** |
| **+3–12+** | R3.1–R3.9 (SOC2 overlap dài) | **★ E100 100%** → **★ Tổng 100%** |

---

## Checklist vận hành mỗi bước

1. Đọc runbook / playbook liên quan
2. Làm → ghi evidence (screenshot, log, PR)
3. Cập nhật `r0-r3-execution-evidence.md` + `plan-*-dod-evidence.md` / `cpc-checklist.md`
4. Chỉ sang bước sau khi gate sóng đạt (trừ bước đã đánh dấu song song)
5. Không claim % đích khi còn AMBER bắt buộc

---

## Việc **tiếp theo ngay** (thứ tự cứng)

**Post-L3 (2026-07-26):** Wave **L3 CLOSED** — **Gate A Code local READY = YES** ([gate](../../ops/r0-r3-execution-evidence.md#wave-l3-gate-a-2026-07-26--code-local-ready--yes-commercial-deferred)). **Chính sách:** code local xong → thương mại chỉ khi owner muốn bán. ~% thật: eng Gate A READY · CPC ~38% · E100 ~22%+ · tổng ~55% — **không** claim CPC/E100/tổng 100%.

**NOW = post–Gate A + post-audit** — P0 re-verify/docs **hoặc** Pha B khi owner muốn commercial. Checklist: [2026-07-27-completion-priority-post-audit.md](./2026-07-27-completion-priority-post-audit.md).

```
DONE    L1 + L2 + L3 ★ Gate A Code local READY
▶ NOW   (optional) A6/A7 polish  OR  idle
THEN    (chỉ khi owner muốn bán) Pha B: Render → Meta → R0 → R1 → R2 → CPC
THEN    Pha C: Plan I → E100 → TỔNG 100%
```

CPC/E100 vẫn cần owner R0.2+R0.4 **khi** claim thương mại — Gate A **không** thay Gate R0. L3 gate: [evidence § Wave L3 Gate A](../../ops/r0-r3-execution-evidence.md#wave-l3-gate-a-2026-07-26--code-local-ready--yes-commercial-deferred).

---

## Liên kết nhanh

| Tài liệu | Path |
|----------|------|
| **Checklist ưu tiên sau audit (SoT)** | [2026-07-27-completion-priority-post-audit.md](./2026-07-27-completion-priority-post-audit.md) |
| Checklist code-first (Gate A lịch sử) | [2026-07-26-completion-priority-code-first.md](./2026-07-26-completion-priority-code-first.md) |
| Checklist CPC claim (Render/Meta…) | [2026-07-25-completion-step-by-step.md](./2026-07-25-completion-step-by-step.md) |
| Wave L1 local-first | [2026-07-26-sdd-l1-local-first.md](./2026-07-26-sdd-l1-local-first.md) |
| Wave L2 code-complete local | [2026-07-26-sdd-l2-code-complete.md](./2026-07-26-sdd-l2-code-complete.md) |
| Wave L3 Gate A (code local READY) | [2026-07-26-sdd-l3-gate-a.md](./2026-07-26-sdd-l3-gate-a.md) |
| SoT R0–R3 chi tiết | [2026-07-25-remaining-completion-priority.md](./2026-07-25-remaining-completion-priority.md) |
| CPC checklist | [cpc-checklist.md](./cpc-checklist.md) |
| Evidence live | `docs/ops/r0-r3-execution-evidence.md` |
| Walkthrough §12.1 | `docs/ops/p0-staging-walkthrough-12-1.md` |
| Meta App Review | `docs/ops/p0-meta-app-review-submit.md` |
| Plan E / I playbooks | `2026-07-24-plan-e-priority-execution.md` · `2026-07-24-plan-i-priority-execution.md` |
| Local host | `docs/ops/local-host.md` |
