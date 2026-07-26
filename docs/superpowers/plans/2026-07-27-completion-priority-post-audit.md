# Kế hoạch hoàn thiện — sau audit code ↔ tài liệu (2026-07-27)

**Baseline `main`:** `d77c197` (port lock #29 + PS1 encoding #30)  
**Chính sách:** Code/local trước → thương mại (CPC) → Enterprise (E100)  
**SoT trước đó:** [code-first 2026-07-26](./2026-07-26-completion-priority-code-first.md) · [cpc-checklist](./cpc-checklist.md) · [plan-i-dod-evidence](./plan-i-dod-evidence.md) · [evidence](../../ops/r0-r3-execution-evidence.md)

---

## 0. Verdict audit (đừng lẫn 3 đích)

| # | Đích | = 100% khi | Hiện tại (sau audit) | Trạng thái |
|---|------|------------|----------------------|------------|
| **A** | Code / eng local | Gate A + không P0 local | ~**98%**→**Gate P0 YES** | **READY** — Wave P0 CLOSED 2026-07-27; A6 AMBER_OK; A7 deferred B5 |
| **B** | CPC thương mại | R0+R1+R2.1–2.3+R2.7 GREEN | ~**38%** | **BLOCKED owner** — Render/Meta/paid/live |
| **C** | E100 | Plan I I1–I8 live/compliance | ~**22%+** | **BLOCKED vendor/legal** — scaffold có, live chưa |

```
TỔNG intended 100%  =  B (CPC)  +  C (E100)
Thứ tự làm việc:     A polish (ngắn)  →  B  →  C
Không claim CPC/E100 khi còn undecided / BLOCKED owner.
```

**Stack local đã verify (2026-07-27):** Web `:4700` / API `:4701` / AI `:4702` / Inngest `:4788` / Supabase `:54721` — HTTP 200.

---

## 1. Bản đồ đối chiếu code ↔ docs (tóm tắt)

### 1.1 Khớp / DONE (không làm lại)

| Hạng mục | Code evidence | Doc |
|----------|---------------|-----|
| Topology C web/api/ai | `apps/*`, `dev-local.ps1` | Charter |
| Port lock Omni | `config/local-ports.json` | `docs/ops/local-ports.md` |
| Invite create/list/accept | `identity.controller/service` | L2 |
| E2E smoke local | `scripts/local-e2e-smoke.mjs` | Gate A A2 |
| Isolation RLS 0 skip | `tests/isolation/*`, CI | Gate A A4 |
| Lint/typecheck honesty | turbo → tsc packages | Gate A A3 |
| api-client deprecated | `packages/api-client/README` | Gate A A5 |
| Embeddings stub local | `apps/ai/.../stub.py` | L1 |
| Advisor aggregates Core | `advisor.service.ts` | L2 |
| Inngest trong `dev:local` | `dev-local.ps1` + jobs | L2 |
| Meta OAuth/webhook **code** | `channels/*`, signature, enqueue | Plan B |
| COD / returns / shipping **code** | `cod/`, `orders/`, `shipping/` | Plan F |
| Public API keys + webhook mgmt | `public-api/*` | Plan G |
| SBOM enforce trên `v*` | `.github/workflows/sbom.yml` | I7 eng |
| E-invoice stub + http_sandbox | `einvoice/*` | Plan H |

### 1.2 PARTIAL / STUB (code có, chưa “live” hoặc chưa đủ)

| Hạng mục | Thực tế code | Gap để xanh thương mại/E100 |
|----------|--------------|------------------------------|
| Meta channel | OAuth + webhook đầy đủ | `META_*` thật, staging always-on, App Review |
| Render | `render.yaml` Free | Starter ×3, no cold-start proof |
| Billing | Invoice/entitlement flags | Không Stripe/PayOS; R1 paid ops |
| Shipping GHN | Sandbox + `GHN-MOCK-*` nếu thiếu URL | Live E2E carrier |
| E-invoice | Default stub; sandbox URL optional | Provider VN thật **hoặc** AMBER_OK |
| Advisor AI | Fallback `advisor-stub` khi không Gemini | Key + eval **hoặc** AMBER_OK |
| Zalo | Token-paste + inbound worker | OAuth đầy đủ **hoặc** AMBER_OK |
| SSO | `available: false, etaDays: 90` | IdP thật hoặc cam kết khách |
| Status page | Static `/status` | Vendor uptime + history |
| Public webhooks | create/test/sign | Dispatch `order.*` events đầy đủ (nếu DoD yêu cầu) |
| Offline `/m` | `sw.js` network-only | A6 optional |

### 1.3 Doc drift cần dọn (P0 polish, không chặn chạy app)

| Vấn đề | File | Việc |
|--------|------|------|
| Evidence còn nhắc cổng cũ 3000/54321 | `r0-r3-execution-evidence.md`, một số hàng `local-host.md` | Ghi chú “legacy evidence” + trỏ `local-ports.json` |
| Baseline code-first còn tip L2 | `2026-07-26-completion-priority-code-first.md` | Trỏ SoT mới = file này |
| CPC R2.4–R2.6 vẫn `undecided` | `cpc-checklist.md` | Owner ký REQUIRED \| AMBER_OK trước claim CPC |
| OpenAPI description còn “stub” | `packages/contracts/openapi.yaml` | Optional: sửa wording khi codegen |

### 1.4 BLOCKED ngoài eng (không giải bằng code alone)

| Blocker | Ai | Chặn gate |
|---------|-----|-----------|
| Render payment / Starter | Owner | R0 / always-on |
| Meta App Review + secrets | Owner | R0 Meta criteria |
| Supabase Pro / PITR drill | Owner | R1 |
| Carrier/COD tài khoản live | Owner | R2.1–2.3 |
| Quyết định R2.4–R2.6 | Owner | CPC claim |
| SOC2 / pen-test vendor | Owner + vendor | I2 / I3 |
| SLA legal approve | Legal/Owner | I6 |
| SSO IdP / cam kết ≤90 ngày | Owner + Eng | I1 GREEN |

---

## 2. Bản đồ ưu tiên cứng (wave)

```
★ WAVE P0 — Ổn định Gate A + dọn drift (1–2 ngày eng)
    P0.1  Regression xanh mới (ghi evidence)
    P0.2  Doc ports/evidence drift
    P0.3  (tuỳ) A6 offline SW  |  A7 quyết định Zalo sớm
    ── Gate A vẫn READY; sẵn sàng mở Pha B khi owner muốn ──

★ WAVE P1 — Pha B CPC (CHỈ khi owner muốn bán)
    B1 → B2 → B3 (Gate R0) → B4 (Gate R1) → B5 quyết định stub → B6 live ops → ★ CPC

★ WAVE P2 — Pha C E100 (sau / song song vendor từ B4)
    C1 kick-off vendor → I1…I8 → ★ E100 → ★ TỔNG 100%
```

---

## 3. WAVE P0 — Chi tiết từng bước (làm ngay trên PC)

Mỗi bước: **Ưu tiên** · **Ai** · **Làm** · **Xong khi** · **Evidence** · **Lệnh**

### P0.1 — Regression Gate A tươi (P0 · Eng · bắt buộc trước khi tin tưởng “READY”)

| | |
|--|--|
| **Làm** | Chạy lại toàn bộ gate local trên stack cổng khóa |
| **Xong khi** | Tất cả lệnh dưới **GREEN**; ghi ngày + SHA vào evidence |
| **Lệnh** | xem khối lệnh bên dưới |
| **Evidence** | `docs/ops/r0-r3-execution-evidence.md` mục “Gate A re-verify 2026-07-27” |

```powershell
pnpm run ports:sync
pnpm run dev:local:stop
pnpm run dev:local
# riêng terminal:
pnpm --filter @omni/api test
pnpm --filter @omni/web exec tsc --noEmit
cd apps/ai; uv run pytest; cd ../..
pnpm test:isolation
pnpm test:e2e:local
pnpm lint
pnpm typecheck
```

**Phụ thuộc:** Docker + Supabase local `:54721` đang chạy.

### P0.2 — Dọn drift tài liệu ports / baseline (P0 · Eng · 0.5 ngày)

| | |
|--|--|
| **Làm** | (1) Thêm banner ở đầu evidence/local-host: SoT ports = `config/local-ports.json` (4700…). (2) Cập nhật “tiếp theo ngay” trong code-first → trỏ file này. (3) Không xóa lịch sử cũ — đánh dấu *legacy*. |
| **Xong khi** | Người mới không mở nhầm `:3000` khi đọc SoT |
| **Evidence** | PR docs |

### P0.3a — A6 Offline SW (P2 · Eng · optional) — **AMBER_OK 2026-07-27**

| | |
|--|--|
| **Làm** | Cache shell `/m` tối thiểu trong `apps/web/public/sw.js` **hoặc** ghi AMBER_OK “không cần offline local” |
| **Xong khi** | Offline reload `/m` cơ bản **hoặc** quyết định AMBER trong checklist H |
| **Không chặn** | Gate A / CPC nếu AMBER_OK |
| **Kết quả Wave P0** | **AMBER_OK** — keep network-only `sw.js`; offline `/m` not required for Gate P0 |

### P0.3b — A7 Zalo decision sớm (P2 · Owner · optional) — **deferred → B5**

| | |
|--|--|
| **Làm** | Chọn ngay: `REQUIRED` (OAuth đầy đủ) **hoặc** `AMBER_OK` (Meta-only) trong `cpc-checklist.md` R2.4 |
| **Xong khi** | R2.4 ≠ `undecided` |
| **Gợi ý** | Nếu chưa có OA live → `AMBER_OK` để khỏi chặn CPC sau này |
| **Kết quả Wave P0** | R2.4 stays **`undecided`** — owner decides at Pha B **B5** before CPC claim (no forged signature) |

### P0.4 — Gate P0 đóng — **YES 2026-07-27**

| Checklist | Bắt buộc? | Status |
|-----------|-----------|--------|
| P0.1 regression GREEN | Có | **GREEN** |
| P0.2 docs ports SoT | Có | **GREEN** |
| P0.3a / P0.3b | Không (optional) | A6 **AMBER_OK** · A7 deferred B5 |
| Stack `:4700` health | Có | **YES** (locked ports) |

**★ Sau P0:** eng local “sạch để mở thương mại”. Vẫn **không** claim CPC (~38% / E100 ~22%+ / tổng ~55% — **NOT 100%**). Next = Pha B **BLOCKED owner** until sell intent.

---

## 4. WAVE P1 — Pha B CPC (chi tiết, thứ tự cứng)

> Chỉ bắt đầu khi owner xác nhận muốn bán. Click-path dài: [completion-step-by-step](./2026-07-25-completion-step-by-step.md).

### B1 — Render Starter ×3 (P0 · Owner)

| | |
|--|--|
| **Làm** | Nâng `api` / `ai` / `web` staging lên Starter; tắt cold-start |
| **Xong khi** | 3 service always-on; health URL ổn định 24h sample |
| **Evidence** | Screenshot billing + URL trong `r0-r3-execution-evidence.md` |
| **Unblocks** | B2 webhook Meta (cần URL công khai ổn định) |

### B2 — META_* + App Review (P0 · Owner + Eng)

| | |
|--|--|
| **Làm** | Điền secrets staging; verify webhook GET/POST; OAuth callback staging; **Submit** App Review |
| **Xong khi** | App Review = Submitted (hoặc Live); webhook 200 với chữ ký thật |
| **Evidence** | Screenshot Meta + log webhook |
| **Unblocks** | B3 Gate R0 |

### B3 — Staging walkthrough §12.1 → Gate R0 (P0 · Eng + Owner)

| | |
|--|--|
| **Làm** | Chạy [p0-staging-walkthrough-12-1](../../ops/p0-staging-walkthrough-12-1.md) trên staging (có Meta) |
| **Xong khi** | Criteria R0 GREEN (kể cả Meta 2/4 nếu Review cho phép) |
| **Evidence** | Walkthrough dated + Gate R0 tick |
| **Unblocks** | B4 |

### B4 — R1 paid ops (P0 · Owner / Ops)

| ID | Việc | Xong khi |
|----|------|----------|
| R1.0–1.1 | Supabase Pro + PITR restore drill | Drill pass + note |
| R1.2 | Always-on prod path | Không Free cold-start prod |
| R1.3 | Uptime / on-call tối thiểu | Provider hoặc runbook sống |
| R1.4–1.6 | LLM paid + spend cap + billing evidence | Invoice/flag + cap |

**★ Gate R1** → được phép kick-off vendor E100 (C1) song song.

### B5 — E0.4 quyết định stub (P0 · Owner · **bắt buộc trước CPC claim**)

| Row | Câu hỏi | Giá trị cho phép |
|-----|---------|------------------|
| R2.4 Zalo | OAuth đầy đủ hay Meta-only? | `REQUIRED` \| `AMBER_OK` |
| R2.5 E-invoice | Provider VN thật hay ngoài hệ thống? | `REQUIRED` \| `AMBER_OK` |
| R2.6 Advisor | Live LLM+eval hay stub chấp nhận? | `REQUIRED` \| `AMBER_OK` |

**Cấm:** Claim CPC khi còn `undecided`.

### B6 — Live ops R2.1→R2.7 → ★ CPC 100% (P0 · Eng + Owner)

Thứ tự phụ thuộc B5:

```
B6.1  R2.1 Carrier live/sandbox thật (GHN) — shipment ID không phải GHN-MOCK-*
B6.2  R2.2 COD collect + reconcile
B6.3  R2.3 Returns restock / write-off
B6.4  Nếu R2.4 REQUIRED → Zalo OAuth + inbound live
B6.5  Nếu R2.5 REQUIRED → e-invoice provider sandbox + tax note
B6.6  Nếu R2.6 REQUIRED → GEMINI key + advisor eval xanh
B6.7  R2.7 tick cpc-checklist → ★ CPC 100%
```

**Cấm:** Charge khách / domain prod trước khi R1 (B4) xong.

---

## 5. WAVE P2 — Pha C E100 (sau CPC; vendor từ B4)

| Bước | ID | Việc | Lead time | Ai |
|-----:|----|------|-----------|-----|
| C1 | R3.0 | Kick-off SOC2 + pen-test vendor | Ngay sau B4 | Owner |
| C2 | I1 | SSO thật **hoặc** cam kết ≤90 ngày đã ký | 2–8 tuần | Eng + Owner |
| C3 | I2 | SOC2 evidence pack auditor | 3–12 tháng | Vendor |
| C4 | I3 | Pen-test + fix critical/high | 2–6 tuần | Vendor + Eng |
| C5 | I4 | Status page → vendor uptime | ~1 tuần | Eng |
| C6 | I5 | Subprocessors: legal approve + notify | ~1 tuần | Legal |
| C7 | I6 | SLA legal approve | 1–4 tuần | Legal |
| C8 | I7 | Mọi release gắn tag `v*` (SBOM CI) | process | Eng |
| C9 | I8 | Access review quý đã ký (`platform_admins`) | 1 ngày | Owner |
| C10 | — | `plan-i-dod-evidence` I1–I8 GREEN | **★ E100 → TỔNG 100%** | — |

**Eng bổ sung có thể làm sớm (không thay vendor):**

- I4: wire `/status` tới Better Stack / Checkly (sau khi có provider).
- Public webhook: nếu DoD 3E yêu cầu `order.created|updated|…` — implement dispatch + idempotency + retry (sau khi OpenAPI cập nhật).
- I1: thiết kế bảng `org_sso_settings` + OIDC adapter khi có IdP.

---

## 6. Việc **tiếp theo ngay** (copy TODO)

### Ngay (không cần thẻ / Meta)

```
[x] P0.1  Regression Gate A tươi + ghi evidence (SHA d77c197+)
[x] P0.2  Dọn doc ports/evidence drift → SoT local-ports.json
[x] P0.3a (tuỳ) A6 offline SW → AMBER_OK (network-only sw.js; offline /m not required for Gate P0)
[x] P0.3b (tuỳ) A7 Zalo — deferred to Pha B B5 (R2.4 stays undecided; no forged AMBER_OK)
[x] Gate P0 eng local sạch = YES (CPC ~38% / E100 ~22%+ / tổng ~55% — NOT 100%)
```

### Khi owner muốn bán

```
[x] B1 eng kickoff  Runbook VI + SDD + re-probe R0.2 (2026-07-27) — R0.2 GREEN vẫn BLOCKED owner
[ ] B1 R0.2 GREEN   Owner: payment + Starter ×3 + no-cold-start — xem docs/ops/b1-render-starter-owner.md
[ ] B2  META_* + App Review submit
[ ] B3  Staging walkthrough → Gate R0
[ ] B4  R1 paid ops (+ kick-off C1 vendor)
[ ] B5  R2.4–R2.6 hết undecided   ← R2.4 Zalo must be REQUIRED|AMBER_OK before CPC
[ ] B6  Carrier/COD/returns (+ stub REQUIRED) → ★ CPC
```

### Sau / song song CPC

```
[ ] C1–C10  Plan I → ★ E100 → ★ TỔNG 100%
```

---

## 7. Lịch gợi ý

| Tuần | Focus | Output |
|-----:|-------|--------|
| **0 (nay)** | P0.1 + P0.2 | Evidence tươi; docs không lệch cổng |
| **0–1** | P0.3 optional | A6/A7 sạch hoặc AMBER |
| **Khi bán** | B1–B3 | **★ Gate R0** |
| **+1–2 tuần** | B4–B5 | **★ Gate R1** + stub decided |
| **+2–4 tuần** | B6 | **★ CPC 100%** |
| **Song song từ B4** | C1–C10 | **★ E100** (lead time dài) |

---

## 8. Ai làm gì

| Eng / Agent | Owner |
|-------------|-------|
| P0 regression, docs drift, A6, webhook dispatch, SSO adapter | Render payment, Meta Review |
| Live carrier/COD code paths + evidence | Pro/PITR, carrier accounts |
| Status vendor wire, SBOM tag process | E0.4 R2.4–R2.6 ký |
| Fix pen-test findings | SOC2/pen-test/SLA/legal |

---

## 9. Quy trình đóng mỗi bước

```
1. Đọc playbook / hàng checklist của bước
2. Làm + chạy test liên quan (local hoặc staging)
3. Ghi evidence (ngày, SHA, URL, screenshot nếu owner)
4. Chỉ GREEN khi “Xong khi” đạt — không claim sớm
5. Sang bước phụ thuộc tiếp theo (không nhảy R2 trước R0)
```

---

## 10. Ước lượng % (trung thực)

| Metric | % | Ghi chú |
|--------|--:|---------|
| Eng / Gate A local | **Gate P0 YES** | A6 AMBER_OK; A7 deferred B5; commercial deferred |
| CPC thương mại | **~38%** | Code path sẵn; live/owner BLOCKED |
| E100 | **~22%+** | Scaffold; compliance BLOCKED |
| **Tổng intended** | **~55%** | = f(CPC, E100) — **NOT 100%** |

---

## 11. Liên kết nhanh

| Mục | Path |
|-----|------|
| Ports SoT | [local-ports.md](../../ops/local-ports.md) · `config/local-ports.json` |
| Local host | [local-host.md](../../ops/local-host.md) |
| Walkthrough | [p0-staging-walkthrough-12-1.md](../../ops/p0-staging-walkthrough-12-1.md) |
| CPC checklist | [cpc-checklist.md](./cpc-checklist.md) |
| CPC click-path | [completion-step-by-step](./2026-07-25-completion-step-by-step.md) |
| Plan I evidence | [plan-i-dod-evidence](./plan-i-dod-evidence.md) |
| Code-first (Gate A lịch sử) | [2026-07-26-completion-priority-code-first](./2026-07-26-completion-priority-code-first.md) |
| Evidence ledger | [r0-r3-execution-evidence.md](../../ops/r0-r3-execution-evidence.md) |
