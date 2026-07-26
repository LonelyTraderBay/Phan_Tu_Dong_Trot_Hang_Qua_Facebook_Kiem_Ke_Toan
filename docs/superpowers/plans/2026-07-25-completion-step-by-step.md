# Kế hoạch thực thi từng bước — hoàn thiện tới 100%

**Date:** 2026-07-25 (cập nhật sau E3 + PR #22/#23 MERGED)  
**Baseline:** `main` @ `0221a4c` (E3 gate)  
**SoT liên quan:** [path-to-100](./2026-07-25-path-to-100-percent.md) · [remaining-priority](./2026-07-25-remaining-completion-priority.md) · [cpc-checklist](./cpc-checklist.md) · [evidence](../../ops/r0-r3-execution-evidence.md)

---

## 0. Định nghĩa “hoàn thiện 100%”

| Đích | = 100% khi | Hiện tại (~%) | Ai đóng |
|------|------------|---------------|---------|
| **Eng path** | A→H không stub chặn bán + regression xanh | ~**95%+** | Eng gần xong |
| **CPC thương mại** | Gate R0 + R1 + R2.1–2.3 + R2.7 GREEN | ~**38%** | Owner + Eng live |
| **E100** | Plan I I1–I8 live/compliance GREEN | ~**22%+** | Owner + Legal + Vendor |
| **Tổng** | CPC **và** E100 cùng GREEN | ~**55%** | = CPC + E100 |

```
TỔNG 100%  =  CPC thương mại GREEN  +  E100 GREEN
(không gồm Epoch 5 — optional sau E100)
```

**Quy tắc cứng**

1. Một critical path tại một thời điểm (trừ bước đã ghi “song song OK”).
2. Không claim CPC trước Gate R0–R2; không claim E100 trước I1–I8.
3. Keep-warm / Free tier ≠ always-on GREEN.
4. Mỗi bước xong → ghi evidence → mới sang bước sau.

---

## 1. Đã xong (không làm lại)

| # | Hạng mục | Evidence ngắn |
|---|----------|---------------|
| D1 | Pilot A–D + F/G/H scaffolding | Code trên `main` |
| D2 | Staging Supabase `tjsmpcgkeoglemptuymu` | Migrations **29/29** local=remote |
| D3 | Render staging Free live (api/ai/web) | Keep-warm 3/3 AMBER |
| D4 | R0.1 migrate + R0.5 Scheduled QA | GREEN |
| D5 | E0.1 warehouse fix + confirm local PASS | Migration `20260727210000` |
| D6 | E1 resume inbox / advisor Gemini-or-stub / Zalo persist | PR #22 → `main` |
| D7 | E2 http_sandbox e-invoice + billing entitlement gate proof | PR #22 |
| D8 | E3 R0.2/R0.4 attempt + SBOM enforce (I7 eng) | PR #23 → `main` `@0221a4c` |
| D9 | Local host playbook | `docs/ops/local-host.md` |

**Eng SDD đã STOP** — phần còn lại chủ yếu owner payment / Meta / vendor / live ops.

---

## 2. Bản đồ ưu tiên (thứ tự cứng)

```
▶ BƯỚC 1–2   Owner: R0.2 Render Starter ×3
▶ BƯỚC 3–4   Owner: R0.4 META_* + App Review submit
▶ BƯỚC 5     Cả hai: R0.3b walkthrough staging → ★ Gate R0
▶ BƯỚC 6–12  Owner(+Eng): R1.0–R1.6 paid/live → ★ Gate R1
             (song song sau R1.0: R3.0 kick-off SOC2/pen-test)
▶ BƯỚC 13–16 Cả hai: R2.1→R2.3 live + R2.7 checklist → ★ CPC 100%
▶ BƯỚC 17–25 Cả hai: R3 I1–I8 → ★ E100 100% → ★ TỔNG 100%

Song song (không thay critical path):
  · E0.2 GEMINI_API_KEY + Inngest knowledge reindex
  · E0.4 quyết định stub Zalo / e-invoice / advisor trong cpc-checklist
```

---

## 3. Checklist thực thi chi tiết

Mỗi bước: **Ai** · **Làm gì** · **Playbook** · **Xong khi** · **Ghi evidence**

### Pha A — Mở staging always-on + Meta (Gate R0)

#### Bước 1 — R0.2a: Thêm thanh toán Render

| | |
|--|--|
| **Ai** | Owner |
| **Làm** | https://dashboard.render.com/u/billing → **Add payment method** |
| **Xong khi** | Billing có phương thức thanh toán hợp lệ |
| **Evidence** | Screenshot billing (che số thẻ) → dán note vào `r0-r3-execution-evidence.md` R0.2 |

#### Bước 2 — R0.2b: Nâng Starter × 3 service staging

| | |
|--|--|
| **Ai** | Owner |
| **Làm** | Mỗi service: **Settings → Instance Type → Free → Starter → Save** |
| **Links** | api [srv-d9i2sjbeo5us7394purg](https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg) · ai [srv-d9i2skbrjlhs73e95lsg](https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg) · web [srv-d9i2sl3h2c0s73823lqg](https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg) |
| **Tuỳ chọn** | `render.yaml`: `plan: free` → `starter` rồi commit |
| **Playbook** | [deploy-staging-render.md § Upgrade](../../ops/deploy-staging-render.md#upgrade-to-always-on-owner) |
| **Xong khi** | Cả 3 = Starter; sau idle 15–30 phút vẫn `/health` nhanh (không trang cold-start 30–90s) |
| **Evidence** | Timestamp curl/GHA + đánh dấu R0.2 **GREEN** trong evidence (keep-warm 3/3 **không** đủ) |

#### Bước 3 — R0.4a: Cấu hình Meta credentials trên API staging

| | |
|--|--|
| **Ai** | Owner |
| **Làm** | Trên `omni-api-staging` env: set thật `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (không commit git) |
| **Cũng set** | `META_REDIRECT_URI=https://omni-web-staging.onrender.com/settings/channels/callback` (đã pin trong `render.yaml`) |
| **Xong khi** | Env Render có giá trị thật (không placeholder) |
| **Evidence** | Note “set on Render” (không paste secret) trong evidence R0.4 |

#### Bước 4 — R0.4b: Meta dashboard + submit App Review

| | |
|--|--|
| **Ai** | Owner |
| **Làm theo thứ tự** | 1) Privacy/Terms URLs · 2) Webhook `…/v1/webhooks/meta` + verify token + Page `messages` · 3) OAuth redirect khớp staging · 4) Screencast + test Page/IG · 5) **Submit** App Review (Advanced Access các scope Phase 1) · 6) **Không** bật Live trước khi approved |
| **Playbook** | [p0-meta-app-review-submit.md](../../ops/p0-meta-app-review-submit.md) · [meta-app-review-checklist.md](../../meta-app-review-checklist.md) |
| **Xong khi** | App Review state = **Submitted** (hoặc Approved) |
| **Evidence** | Screenshot App Review state + App ID (không secret) → R0.4 **GREEN** (submitted) |

#### Bước 5 — R0.3b: Walkthrough staging §12.1 → Gate R0

| | |
|--|--|
| **Ai** | Owner + Eng |
| **Làm** | Lặp checklist trên URL public (sau Bước 2+4): health, org, product, stock, draft→confirm, inbox resume, Meta OAuth/DM nếu Review cho phép tester |
| **Playbook** | [p0-staging-walkthrough-12-1.md](../../ops/p0-staging-walkthrough-12-1.md) |
| **Xong khi** | Mọi dòng bắt buộc tick; Meta rows không còn BLOCKED (hoặc ghi rõ chờ Meta approve) |
| **Evidence** | File walkthrough đã điền + cập nhật R0.3 **GREEN** |
| **★ Gate R0** | R0.1 + R0.2 + R0.3 + R0.4 submitted + R0.5 |

---

### Pha B — Plan E paid/live (Gate R1) — trước khi bán

**Cấm:** Charge khách / domain prod trước khi Bước 6–7 xong.

#### Bước 6 — R1.0: Supabase Pro + PITR (prod ≠ staging)

| | |
|--|--|
| **Ai** | Owner |
| **Làm** | Tạo/upgrade **prod** project; bật PITR; giữ staging riêng |
| **Xong khi** | Dashboard: Pro + PITR ON; staging ref ≠ prod ref |
| **Evidence** | Screenshot → `plan-e-dod-evidence.md` |

#### Bước 7 — R1.1: Restore drill 1 lần

| | |
|--|--|
| **Ai** | Owner (+ Eng hỗ trợ) |
| **Playbook** | [supabase-pro-pitr-restore-drill.md](../../runbooks/supabase-pro-pitr-restore-drill.md) |
| **Xong khi** | Restore thành công; ghi RPO/RTO |
| **Evidence** | Biên bản trong runbook |

#### Bước 8 — R1.2: Always-on **prod** (web+api+ai)

| | |
|--|--|
| **Ai** | Owner |
| **Playbook** | [always-on-hosts.md](../../runbooks/always-on-hosts.md) |
| **Xong khi** | Cold start = 0 trên critical path prod |
| **Evidence** | Deploy URLs + plan Starter/Pro |

#### Bước 9 — R1.3: Uptime monitor + on-call

| | |
|--|--|
| **Ai** | Owner |
| **Playbook** | [on-call.md](../../runbooks/on-call.md) |
| **Xong khi** | Monitor 3 service; alert test fire 1 lần; có tên trực |
| **Evidence** | Screenshot alert |

#### Bước 10 — R1.4: LLM paid + spend cap

| | |
|--|--|
| **Ai** | Owner + Eng |
| **Làm** | Set `GEMINI_API_KEY` (staging/prod); chứng minh vượt daily/monthly cap bị chặn |
| **Playbook** | `docs/runbooks/llm-failover-spend-cap.md` (nếu có) |
| **Xong khi** | Cap chặn + failover doc đúng |
| **Evidence** | Log 403/cap |

#### Bước 11 — R1.5: Billing gates live trên org pilot

| | |
|--|--|
| **Ai** | Owner (+ Eng) |
| **Làm** | Set plan org pilot; vượt `max_pages` → 403; `auto_confirm` bị block khi flag/past_due |
| **Note** | Eng đã có proof harness unit test (E2) — cần **ops live** ticket |
| **Xong khi** | Shop bị chặn đúng trên staging/prod |
| **Evidence** | Ticket/ops log |

#### Bước 12 — R1.6: Đóng evidence Plan E

| | |
|--|--|
| **Ai** | Eng |
| **Làm** | `plan-e-dod-evidence.md` + `docs/ops/plan-e-dod-evidence.md`: paid rows AMBER→GREEN |
| **★ Gate R1** | R1.0–R1.6 xanh |

#### Song song ngay sau Bước 6 — R3.0 kick-off vendor

| | |
|--|--|
| **Ai** | Owner / Legal |
| **Làm** | Chọn vendor SOC2 + pen-test; ký PO/lịch |
| **Xong khi** | Contract/kick-off date |
| **Lý do sớm** | Lead time 3–12 tháng — không để chặn E100 sau CPC |

---

### Pha C — Live vận hành → ★ CPC thương mại 100%

**Thứ tự bắt buộc:** carrier → COD → returns (COD phụ thuộc vận đơn).

#### Bước 13 — E0.4 (trước R2.7): Quyết định stub

| | |
|--|--|
| **Ai** | Owner |
| **Làm** | Trong [cpc-checklist.md](./cpc-checklist.md) set `REQUIRED` hoặc `AMBER_OK` cho R2.4 Zalo / R2.5 e-invoice / R2.6 advisor |
| **Xong khi** | Không còn `undecided` |

#### Bước 14 — R2.1: Carrier E2E thật

| | |
|--|--|
| **Ai** | Eng + Owner |
| **Làm** | 1 đơn staging/prod → tạo vận đơn GHN (hoặc carrier chọn); tracking cập nhật; fail → Excel fallback OK |
| **Playbook** | [shipping-carrier-fallback.md](../../runbooks/shipping-carrier-fallback.md) |
| **Xong khi** | 1 shipment thật + biên bản |
| **Evidence** | Tracking ID + screenshot |

#### Bước 15 — R2.2: COD live

| | |
|--|--|
| **Ai** | Eng + Owner |
| **Làm** | Ship COD → ghi thu → reconcile → 1 discrepancy |
| **Xong khi** | `/cod` khớp BIGINT |
| **Evidence** | Báo cáo COD |

#### Bước 16 — R2.3: Returns live

| | |
|--|--|
| **Ai** | Eng + Owner |
| **Làm** | Hoàn 1 đơn shipped → `return_restock` + COD write-off |
| **Xong khi** | Stock + COD đúng |
| **Evidence** | Stock before/after + COD write-off |

#### Bước 16b–d — R2.4 / R2.5 / R2.6 (theo E0.4)

| Bước | Việc | Nếu AMBER_OK |
|------|------|--------------|
| R2.4 Zalo | OAuth + inbound thật | Ghi AMBER trong checklist, không chặn CPC |
| R2.5 E-invoice | Provider sandbox VN + tax review (eng đã có `http_sandbox`) | Xuất HĐ ngoài hệ thống OK nếu AMBER_OK |
| R2.6 Advisor | LLM thật + eval tối thiểu | Stub chấp nhận nếu AMBER_OK |

#### Bước 17 — R2.7: Điền CPC checklist → ★ CPC 100%

| | |
|--|--|
| **Ai** | Owner |
| **Làm** | Điền [cpc-checklist.md](./cpc-checklist.md); verdict **CPC thương mại GREEN** |
| **Điều kiện** | Gate R0 + Gate R1 + R2.1 + R2.2 + R2.3 + R2.7 |
| **★ Claim** | Commercial CPC = **100%** |

---

### Pha D — Plan I → ★ E100 100% → ★ TỔNG 100%

| Bước | ID | Việc | Lead time | Xong khi |
|-----:|----|------|-----------|----------|
| 18 | R3.1 I1 | SSO SAML/OIDC thật **hoặc** thư cam kết ≤90 ngày đã ký | 2–8 tuần | `sso/status` available / thư |
| 19 | R3.2 I2 | SOC2 evidence pack; Type I in progress | 3–12 tháng | Auditor letter / control map |
| 20 | R3.3 I3 | Pen-test + fix critical/high | 2–6 tuần | Report đóng |
| 21 | R3.4 I4 | Status page live (Better Stack/Statuspage) | ~1 tuần | Public uptime thật |
| 22 | R3.5 I5 | Subprocessors notify process + legal | ~1 tuần | Policy published |
| 23 | R3.6 I6 | Legal approve SLA template | 1–4 tuần | Dùng trong contract |
| 24 | R3.7 I7 | Org luôn cắt release bằng tag `v*` (CI SBOM enforce **đã GREEN** eng) | 1–2 ngày process | Mỗi release có SBOM artifact |
| 25 | R3.8 I8 | Access review `platform_admins` quý 1 | 1 ngày | Biên bản |
| 26 | R3.9 | `plan-i-dod-evidence.md` I1–I8 GREEN | — | **★ E100 100%** → **★ TỔNG 100%** |

**Playbook:** [plan-i-priority-execution](./2026-07-24-plan-i-priority-execution.md) · Evidence: [plan-i-dod-evidence](./plan-i-dod-evidence.md)

**Song song OK:** I2 ∥ I3 ∥ I4–I8 sau kick-off R3.0.

---

### Pha E — Optional (ngoài 100% mặc định)

**R4 Epoch 5** chỉ khi CPC/E100 ổn: Agency multi-org · Data residency · Vertical packs · Partner marketplace.

---

## 4. Việc song song (không thay critical path)

| Ưu tiên | Việc | Ai | Xong khi |
|--------:|------|-----|----------|
| P1 | Set `GEMINI_API_KEY` local + staging AI | Owner | E0.2: `knowledge_chunks` > 0 sau create product + Inngest |
| P2 | E0.4 stub decisions | Owner | Bảng trong `cpc-checklist.md` không `undecided` |
| P3 | Local walkthrough refresh | Eng | Giữ R0.3a xanh khi code đổi |
| P4 | CI xanh trên `main` | Eng/GHA | Không merge đỏ |

---

## 5. Lịch gợi ý (1 owner + 1–2 eng)

| Tuần | Focus | Output / % |
|-----:|-------|------------|
| **Ngay (Tuần 0)** | Bước 1–2 Render Starter; bắt đầu Bước 3–4 Meta | Mở R0.2 / R0.4 |
| **1** | Bước 4 submit + Bước 5 walkthrough staging | **★ Gate R0** |
| **1–2** | Bước 6–12 R1 + R3.0 vendor kick-off | **★ Gate R1** |
| **2–3** | Bước 13–17 carrier/COD/returns + CPC checklist | **★ CPC 100%** |
| **3–12+** | Bước 18–26 Plan I (SOC2 overlap dài) | **★ E100 → TỔNG 100%** |

---

## 6. Ai làm gì — phân tách nhanh

| Owner-only (agent không thay được) | Eng / Agent có thể làm |
|------------------------------------|-------------------------|
| Render payment + Starter | Walkthrough hỗ trợ, evidence docs, CI |
| Meta App ID/Secret + App Review submit | Webhook verify sau khi có secret; debug |
| Supabase Pro / PITR / prod billing | Restore drill hỗ trợ, scripts |
| Uptime vendor / on-call rota | Wiring health checks |
| Carrier/COD tài khoản thật | E2E script, fallback Excel |
| SOC2 / pen-test / legal SLA / SSO contract | SBOM CI (đã enforce), SSO stub→real, status page wiring |
| Quyết định E0.4 REQUIRED vs AMBER_OK | Điền checklist theo quyết định |

---

## 7. Quy trình đóng mỗi bước (bắt buộc)

```
1. Đọc playbook của bước
2. Thực hiện
3. Ghi evidence (screenshot / log / PR docs) vào:
   - docs/ops/r0-r3-execution-evidence.md  (R0–R3)
   - docs/superpowers/plans/plan-e-dod-evidence.md  (R1)
   - docs/superpowers/plans/cpc-checklist.md  (R2.7)
   - docs/superpowers/plans/plan-i-dod-evidence.md  (R3)
4. Đổi status AMBER/BLOCKED → GREEN chỉ khi “Xong khi” đạt
5. Sang bước tiếp theo trong Pha (không nhảy cóc bước bắt buộc)
```

---

## 8. Việc **tiếp theo ngay** (copy vào TODO owner)

```
[ ] 1. Render Billing → Add payment method
[ ] 2. Free → Starter: omni-api-staging, omni-ai-staging, omni-web-staging
[ ] 3. Verify no cold-start → đánh dấu R0.2 GREEN trong evidence
[ ] 4. Set META_APP_ID / META_APP_SECRET / META_VERIFY_TOKEN trên omni-api-staging
[ ] 5. Meta: Privacy/Terms + webhook + OAuth redirect + screencast → Submit App Review
[ ] 6. Walkthrough staging §12.1 → Gate R0
[ ] 7. (Song song) GEMINI_API_KEY + E0.4 stub decisions trong cpc-checklist
```

Khi tick xong **1–3**, báo eng/agent để xác nhận R0.2 GREEN và hỗ trợ Bước 4–6.  
Khi tick xong **4–6**, mở Pha B (R1).

---

## 9. Liên kết nhanh

| Mục | Path |
|-----|------|
| % / wave overview | [2026-07-25-path-to-100-percent.md](./2026-07-25-path-to-100-percent.md) |
| Priority SoT | [2026-07-25-remaining-completion-priority.md](./2026-07-25-remaining-completion-priority.md) |
| Evidence live | [r0-r3-execution-evidence.md](../../ops/r0-r3-execution-evidence.md) |
| Render always-on | [deploy-staging-render.md](../../ops/deploy-staging-render.md) |
| Meta submit | [p0-meta-app-review-submit.md](../../ops/p0-meta-app-review-submit.md) |
| Walkthrough | [p0-staging-walkthrough-12-1.md](../../ops/p0-staging-walkthrough-12-1.md) |
| Plan E | [2026-07-24-plan-e-priority-execution.md](./2026-07-24-plan-e-priority-execution.md) |
| Plan I | [2026-07-24-plan-i-priority-execution.md](./2026-07-24-plan-i-priority-execution.md) |
| Local host | [local-host.md](../../ops/local-host.md) |
