# Kế hoạch chi tiết — hoàn thiện theo thứ tự ưu tiên (code trước, thương mại sau)

**Date:** 2026-07-26  
**Baseline:** `main` @ `e2105a6` (Wave L2 MERGED — PR #27)  
**Chính sách owner:** Hoàn thiện & kiểm tra code trên PC trước; triển khai thương mại sâu chỉ khi code ổn.

**SoT liên quan:** [path-to-100](./2026-07-25-path-to-100-percent.md) · [completion-step-by-step](./2026-07-25-completion-step-by-step.md) · [cpc-checklist](./cpc-checklist.md) · [local-host](../../ops/local-host.md) · [evidence](../../ops/r0-r3-execution-evidence.md)

---

## 0. Ba đích hoàn thiện (đừng lẫn)

| # | Đích | = 100% khi | Hiện tại | Khi làm |
|---|------|------------|----------|---------|
| A | **Code / eng local** | A→H không stub chặn dùng local; regression xanh; walkthrough non-Meta PASS | ~**97%+** | **▶ NGAY** |
| B | **CPC thương mại** | Gate R0+R1+R2.1–2.3+R2.7 GREEN | ~**38%** | Sau khi A ổn |
| C | **E100** | Plan I I1–I8 live/compliance | ~**22%+** | Sau B (vendor sớm từ R1) |

```
TỔNG intended 100%  =  B (CPC)  +  C (E100)
Nhưng thứ tự làm việc:  A → rồi mới B → rồi C
```

**Quy tắc**

1. Không nhảy sang Render/Meta/billing khi còn lỗ hổng code local.
2. Không claim CPC/E100 trước gate tương ứng.
3. Mỗi bước: làm → test → ghi evidence → bước sau.
4. Meta trên localhost vẫn BLOCKED (cần tunnel/staging) — không chặn đích A.

---

## 1. Đã xong (không làm lại)

| ID | Hạng mục | Evidence |
|----|----------|----------|
| ✓ | Pilot A–H scaffolding + warehouse confirm fix | `main` |
| ✓ | Staging migr 29/29 + CI migrate/QA | GREEN |
| ✓ | L1 local-first: stub embeddings, SoT Render deferred | PR #26 |
| ✓ | L2 invite list+accept | PR #27 |
| ✓ | L2 Inngest trong `dev:local` + chunks smoke (stub) | PR #27 |
| ✓ | L2 advisor aggregates thật (catalog/sales) | PR #27 |
| ✓ | L2 Zalo runbook (worker shipped) | PR #27 |
| ✓ | L2 CI Node 22 | PR #27 |
| ✓ | Regression baseline | API 185 · AI 37 · isolation 6 pass |

---

## 2. Bản đồ ưu tiên (thứ tự cứng)

```
▶ PHA A — Code hoàn thiện trên PC (L3…)     ← LÀM NGAY
    A1  Smoke tay §12.1 non-Meta sau L2
    A2  Playwright/e2e smoke tối thiểu (signup→invite→catalog→confirm→export)
    A3  ESLint thật (hoặc bỏ dep rỗng) + typecheck packages đều
    A4  Isolation RLS: bỏ skip hoặc thay proof thật
    A5  OpenAPI/codegen api-client (hoặc xóa package claim)
    A6  Offline SW /m (nếu muốn H mobile local “đủ”)
    A7  Zalo OAuth code path (tuỳ — hoặc AMBER_OK Meta-only)
    A8  Gate A: “Code local READY” checklist xanh

── PHA B — Thương mại (CHỈ KHI A xong & owner muốn) ──
    B1  Render Starter ×3 staging
    B2  META_* + App Review submit
    B3  Walkthrough staging → Gate R0
    B4  R1 paid (Pro/PITR/always-on/LLM/billing)
    B5  E0.4: REQUIRED | AMBER_OK (hết undecided)
    B6  R2.1→2.3 carrier/COD/returns live → R2.7 → ★ CPC 100%

── PHA C — E100 (sau CPC; kick-off vendor từ B4) ──
    C1–C9  I1–I8 + đóng evidence → ★ E100 → ★ TỔNG 100%
```

---

## 3. Pha A — Code hoàn thiện trên PC (chi tiết từng bước)

Mỗi bước: **Ưu tiên** · **Ai** · **Làm gì** · **Xong khi** · **Evidence** · **Playbook**

### A1 — Smoke tay sau L2 (P0 · ngay)

| | |
|--|--|
| **Ai** | Eng / Owner |
| **Làm** | `pnpm run dev:local` → walkthrough non-Meta: health · org · invite create+accept · product · stock · draft→confirm · export · inbox resume · advisor suggest · knowledge_chunks > 0 |
| **Playbook** | [local-host.md](../../ops/local-host.md) · [p0-staging-walkthrough-12-1.md](../../ops/p0-staging-walkthrough-12-1.md) |
| **Xong khi** | Criteria 1,3,5 (và non-Meta khác) **PASS** (không còn “partial” vì invite) |
| **Evidence** | Cập nhật walkthrough + ngày trong `r0-r3-execution-evidence.md` |
| **Meta 2/4** | Giữ **BLOCKED** (localhost) — OK |

### A2 — E2E smoke tự động tối thiểu (P0)

| | |
|--|--|
| **Ai** | Eng |
| **Làm** | Thêm Playwright (hoặc script API) local: signup/login → invite accept → catalog → confirm → export CSV |
| **Xong khi** | 1 lệnh CI/local xanh trên Docker stack |
| **Evidence** | Workflow hoặc `pnpm test:e2e:local` + README |

### A3 — Tooling lint/typecheck đồng bộ (P1)

| | |
|--|--|
| **Ai** | Eng |
| **Làm** | (a) ESLint flat config thật cho api/web **hoặc** gỡ `eslint` unused; (b) `lint`/`typecheck` cho `packages/*`; (c) căn Vitest/TS versions nếu lệch |
| **Xong khi** | `pnpm lint` + `pnpm typecheck` xanh toàn monorepo |
| **Evidence** | CI job hoặc log PR |

### A4 — Isolation RLS không skip vĩnh viễn (P1)

| | |
|--|--|
| **Ai** | Eng |
| **Làm** | Implement `it.skip` trong `tests/isolation` với Docker Supabase **hoặc** thay bằng proof migration-level + xóa skip |
| **Xong khi** | Isolation **0 skip** (hoặc skip có lý do tạm thời + ticket) |
| **Evidence** | `pnpm test:isolation` |

### A5 — API client / OpenAPI drift (P1)

| | |
|--|--|
| **Ai** | Eng |
| **Làm** | Codegen từ `packages/contracts/openapi.yaml` **hoặc** đánh dấu package `api-client` deprecated và dùng `apps/web` client làm SoT |
| **Xong khi** | Không còn README “codegen deferred” mâu thuẫn |
| **Evidence** | PR docs/code |

### A6 — Mobile offline `/m` (P2 · tuỳ)

| | |
|--|--|
| **Ai** | Eng |
| **Làm** | Nâng `sw.js` cache shell tối thiểu nếu DoD H yêu cầu offline local |
| **Xong khi** | Offline reload `/m` cơ bản hoạt động **hoặc** ghi AMBER_OK “không cần offline” |
| **Evidence** | Checklist H |

### A7 — Zalo OAuth vs AMBER_OK (P2 · quyết định)

| | |
|--|--|
| **Ai** | Owner quyết định · Eng implement nếu REQUIRED |
| **Làm** | Chọn: (1) OAuth Zalo đầy đủ local/staging **hoặc** (2) `AMBER_OK` Meta-only trong `cpc-checklist.md` |
| **Xong khi** | Không còn “undecided” nếu muốn đóng eng F; hoặc giữ undecided đến Pha B bước B5 |
| **Evidence** | `cpc-checklist.md` |

### A8 — Gate A “Code local READY”

| Checklist Gate A | Status mục tiêu |
|------------------|-----------------|
| `pnpm --filter api test` xanh | Bắt buộc |
| `uv run pytest` (apps/ai) xanh | Bắt buộc |
| `pnpm test:isolation` xanh (0 skip lý tưởng) | Bắt buộc / AMBER có lý do |
| Walkthrough non-Meta A1 PASS | Bắt buộc |
| A2 e2e smoke xanh | Bắt buộc trước khi mở Pha B |
| A3 lint/typecheck xanh | Bắt buộc |
| Không P0 bug mở (invite/confirm/knowledge) | Bắt buộc |
| Meta/Zalo/e-invoice live | **Không** bắt buộc Gate A |

**★ Gate A đạt** → được phép bắt đầu Pha B (thương mại).  
**Chưa Gate A** → không Render billing, không App Review.

---

## 4. Pha B — Thương mại (chỉ sau Gate A)

> Chi tiết click-path giữ nguyên trong [completion-step-by-step](./2026-07-25-completion-step-by-step.md) Pha CPC claim. Tóm tắt thứ tự:

| Bước | Việc | Xong khi |
|-----:|------|----------|
| **B1** | Render payment → Starter × api/ai/web-staging | Không cold-start |
| **B2** | `META_*` thật + App Review **Submitted** | Screenshot state |
| **B3** | Walkthrough staging §12.1 | Gate **R0** |
| **B4** | R1.0–R1.6 Pro/PITR/always-on/uptime/LLM/billing | Gate **R1** |
| **B5** | E0.4: R2.4–R2.6 = `REQUIRED` \| `AMBER_OK` | Không `undecided` |
| **B6** | R2.1 carrier → R2.2 COD → R2.3 returns → R2.7 checklist | **★ CPC 100%** |

**Song song sau B4:** kick-off vendor SOC2/pen-test (R3.0) để không trễ E100.

**Cấm:** Charge khách / domain prod trước B4 (R1.0–R1.1).

---

## 5. Pha C — E100 → Tổng 100%

| Bước | ID | Việc | Lead time |
|-----:|----|------|-----------|
| C1 | R3.0 | Kick-off SOC2 + pen-test | Ngay sau B4 |
| C2 | I1 | SSO thật hoặc cam kết ≤90 ngày | 2–8 tuần |
| C3 | I2 | SOC2 evidence | 3–12 tháng |
| C4 | I3 | Pen-test + fix critical/high | 2–6 tuần |
| C5 | I4 | Status page live | ~1 tuần |
| C6 | I5 | Subprocessors notify (legal approve) | ~1 tuần |
| C7 | I6 | SLA legal approve | 1–4 tuần |
| C8 | I7 | Org luôn tag `v*` (CI SBOM đã enforce) | process |
| C9 | I8 | Access review quý đã ký | 1 ngày |
| C10 | — | `plan-i-dod-evidence` I1–I8 GREEN | **★ E100 → TỔNG 100%** |

---

## 6. Việc **tiếp theo ngay** (copy TODO)

### Pha A — làm ngay (không cần thẻ / Meta)

```
[x] A1  pnpm run dev:local → smoke walkthrough non-Meta (invite accept + confirm + chunks)
[x] A2  Thêm e2e smoke local (Playwright hoặc API script)
[ ] A3  ESLint/typecheck monorepo xanh
[ ] A4  Isolation: hết skip hoặc proof thay thế
[ ] A5  OpenAPI/api-client drift đóng
[ ] A6  (tuỳ) offline SW
[ ] A7  (tuỳ) Zalo OAuth hoặc ghi AMBER_OK sớm
[ ] A8  Tick Gate A “Code local READY”
```

### Pha B — chỉ khi Gate A xong & muốn bán

```
[ ] B1  Render Starter ×3
[ ] B2  META_* + App Review submit
[ ] B3  Staging walkthrough → Gate R0
[ ] B4  R1 paid
[ ] B5  E0.4 quyết định stub
[ ] B6  Carrier/COD/returns → CPC checklist → CPC 100%
```

### Pha C — sau CPC

```
[ ] C1–C10  Plan I → E100 → TỔNG 100%
```

---

## 7. Lịch gợi ý

| Tuần | Focus | Output |
|-----:|-------|--------|
| **0 (nay)** | A1 smoke + bắt đầu A2/A3 | Bug list sạch / e2e skeleton |
| **1** | A2–A5 | Gate A gần đạt |
| **1–2** | A6–A8 | **★ Gate A Code local READY** |
| **Khi sẵn sàng bán** | B1–B6 | **★ CPC 100%** |
| **Sau CPC** | C1–C10 | **★ E100 → TỔNG 100%** |

---

## 8. Ai làm gì

| Eng / Agent (Pha A) | Owner (Pha B+) |
|---------------------|----------------|
| Smoke, e2e, lint, RLS, OpenAPI, SW | Render payment, Meta App Review |
| Fix bug local, CI xanh | Supabase Pro, carrier/COD tài khoản |
| Cập nhật evidence/walkthrough | E0.4 quyết định, legal/SLA/SOC2 |

---

## 9. Quy trình đóng mỗi bước

```
1. Đọc playbook của bước
2. Làm + chạy test liên quan
3. Ghi evidence (walkthrough / PR / r0-r3-execution-evidence)
4. Chỉ GREEN khi “Xong khi” đạt — không claim sớm
5. Sang bước ưu tiên tiếp theo (A trước B)
```

---

## 10. Liên kết nhanh

| Mục | Path |
|-----|------|
| Local host | [local-host.md](../../ops/local-host.md) |
| Walkthrough §12.1 | [p0-staging-walkthrough-12-1.md](../../ops/p0-staging-walkthrough-12-1.md) |
| L1 / L2 / L3 SDD | [L1](./2026-07-26-sdd-l1-local-first.md) · [L2](./2026-07-26-sdd-l2-code-complete.md) · [L3 Gate A](./2026-07-26-sdd-l3-gate-a.md) |
| CPC checklist | [cpc-checklist.md](./cpc-checklist.md) |
| CPC claim chi tiết (Render/Meta…) | [completion-step-by-step](./2026-07-25-completion-step-by-step.md) § Pha CPC |
| Plan E / I | [plan-e](./2026-07-24-plan-e-priority-execution.md) · [plan-i](./2026-07-24-plan-i-priority-execution.md) |
| Evidence | [r0-r3-execution-evidence.md](../../ops/r0-r3-execution-evidence.md) |
