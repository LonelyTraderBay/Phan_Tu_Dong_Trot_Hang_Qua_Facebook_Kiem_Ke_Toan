# Work Breakdown — khối lượng & phase trước khi lập plan

**Date:** 2026-07-24  
**Status:** Analysis for owner review — **not** an implementation plan yet  
**Authority:** [CANONICAL](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [design](./2026-07-24-omni-commerce-ai-saas-design.md) · [structure §11](./2026-07-24-enterprise-structure-and-data-architecture.md) · [maturity](./2026-07-24-enterprise-maturity-scorecard-to-100.md) · [charter §10](./2026-07-24-enterprise-engineering-foundation-charter.md)  
**Canvas:** `khoi-luong-phase-enterprise.canvas.tsx`  
**Full commercial path (CPC/E100):** [master-roadmap-commercial-complete](./2026-07-24-master-roadmap-commercial-complete.md)

> **Lưu ý:** File này chi tiết **Phase 1 (A–I)**. Đích “sản phẩm thương mại hóa hoàn thiện” = **CPC** trong master roadmap (Phase 1–4 + M3), không dừng ở Wave I.

---

## 0. Trả lời ngắn

| Câu hỏi | Trả lời |
|---------|---------|
| Tổng cộng bao nhiêu **product phase** dài hạn? | **4** (Phase 1 Sellable Core → 2 Ops → 3 Intelligence → 4 ERP-lite) |
| Trong Phase 1 chia nhỏ để code an toàn? | **9 Engineering Waves (A–I)** |
| Khi viết plan sẽ gói thành? | **4 plan files** (A Platform · B Meta · C Catalog+AI · D Orders+Web+Hardening) |
| Cổng Enterprise đo điểm? | **M0–M4** (M1 docs done; M2 trong mọi wave; **chỉ M4 = 100/100**) |
| Bắt đầu code từ đâu? | **Wave A** (không UI feature trước A–C) |

---

## 1. Ba lớp phase (đọc đúng — không đếm trùng)

```
Product Phase 1 ─── 2 ─── 3 ─── 4          ← phạm vi tính năng
                 │
                 └── Wave A…I               ← chia nhỏ Phase 1 để chất lượng
                 │
Maturity   M0 M1 M2 (trong code)  M3 M4   ← cổng enterprise (overlay)
```

1. **Product Phase** — *làm gì cho shop* (roadmap design §11).  
2. **Engineering Wave** — *làm theo thứ tự nào cho đúng Enterprise* (charter §10 + structure §11).  
3. **Maturity Gate** — *chứng minh được bao nhiêu điểm* (scorecard).

---

## 2. Product Phase dài hạn (4)

| Phase | Tên | Scope | Không làm |
|-------|-----|-------|-----------|
| **1** | Sellable Core | Page+IG, RAG, draft/confirm, export file, dashboard VI, multi-tenant, M2 | Carrier API, payment gateway, Zalo/Shopee, ERP |
| **2** | Operations Depth | Inventory sâu, GHN/GHTK, COD đối soát, returns, P&L | — |
| **3** | Intelligence & Expansion | Ads sync, attribution, advisor AI, content calendar | Auto-post mặc định |
| **4** | ERP-lite | PO, branches, e-invoice hooks, staff mobile | — |

**Hiện tại chỉ lập plan và code Phase 1.** Phase 2–4 additive sau (structure §12).

---

## 3. Phase 1 — 9 Engineering Waves (chi tiết)

### Quy tắc chất lượng chung (mọi wave)

- Merge `main` chỉ khi CI: lint + typecheck + unit (+ isolation nếu đụng tenant) xanh  
- Mọi bảng tenant: `org_id` + RLS  
- Shop API: JWT + **`X-Org-Id`**  
- Side effects: **outbox same-TX** (preferred) hoặc enqueue-after-commit + DLQ  
- Không LLM / Meta send nặng trong HTTP request sync  
- Không secret trong browser bundle  
- PR checklist charter §7  

---

### Wave A — Scaffold + M2 hooks

**Mục tiêu:** Repo trông như SaaS enterprise từ commit #1 — chưa cần feature bán hàng.

| Bước | Việc |
|------|------|
| A1 | pnpm + Turborepo monorepo: `apps/web`, `apps/api`, `apps/ai`, `packages/*` |
| A2 | uv + Python 3.12 + FastAPI `/health` |
| A3 | NestJS `/health` + `/ready` + zod env |
| A4 | Next.js shell VI placeholder (auth-ready layout) |
| A5 | Supabase local + migration stub `outbox_events`, flags |
| A6 | CI: lint/typecheck/test matrix; gitleaks |
| A7 | `.env.example`, README run-all-three |
| A8 | `CODEOWNERS`, `docs/adr/`, `docs/runbooks/` stubs |
| A9 | Redacting logger + trace middleware stubs + kill-switch seed |

**DoD:** Structure §11 (11 mục) + maturity M2 *hooks* (skeleton OK).  
**Cấm:** Catalog UI, Meta OAuth thật, LLM call production-path.

---

### Wave B — Identity & tenancy

| Bước | Việc |
|------|------|
| B1 | Tables: `organizations`, `memberships`, `platform_admins`, invites |
| B2 | RLS policies + Core membership check |
| B3 | Auth (Supabase) → Core validates JWT |
| B4 | Enforce **`X-Org-Id`** on `/v1/*` |
| B5 | Roles `owner` \| `cskh` \| `kho` + permission matrix |
| B6 | `/ops/v1/*` suspend org, list orgs (platform_admins only) |
| B7 | Isolation tests in CI (cross-tenant must fail) |

**DoD:** Isolation xanh; owner không gọi được `/ops`; ops không đụng shop data qua `/v1` thiếu quyền.  
**Cấm:** Business modules orders/catalog chưa cần đầy đủ.

---

### Wave C — Jobs & platform spine

| Bước | Việc |
|------|------|
| C1 | Inngest app; functions **chỉ trong `apps/api`** |
| C2 | Outbox publisher (poll `outbox_events` → Inngest) |
| C3 | m2m stub `api → ai` (`X-Service-Key` / JWT) |
| C4 | Entitlements + feature flags (`kill_ai_*`, `auto_confirm`) |
| C5 | Audit log writer helper |
| C6 | Sentry per service; structured log `request_id`/`org_id` |
| C7 | Chọn **Render hoặc Fly** single vendor; deploy staging skeleton |

**DoD:** Job sample end-to-end (no-op) qua outbox; AI health gọi được từ api.  
**Blocking:** Charter — steps 1–5 chặn Meta traffic khách.

---

### Wave D — Meta channels

| Bước | Việc |
|------|------|
| D1 | Meta App + OAuth connect Page + IG |
| D2 | `channel_connections` + AES-256-GCM token at rest |
| D3 | Webhook: verify → `webhook_receipts` → outbox/enqueue → **200** |
| D4 | Persist `contacts`, `conversations`, `messages` |
| D5 | Idempotency + Meta retry safe |
| D6 | Runbook: Meta down / DLQ |
| D7 | Local tunnel (Cloudflare Tunnel / ngrok) documented |

**DoD:** Test Page gửi DM → row message trong DB staging; token không lộ client.  
**Cấm:** Gọi LLM trong webhook handler.

---

### Wave E — Catalog & knowledge index

| Bước | Việc |
|------|------|
| E1 | `products`, `product_variants` CRUD (api) |
| E2 | Money BIGINT VND; stock fields |
| E3 | On change → outbox `knowledge.reindex` |
| E4 | AI embed → `knowledge_chunks` via org-forced RPC hoặc Core ingest |
| E5 | Delete/reindex stale chunks by source |

**DoD:** Đổi giá sản phẩm → chunk cập nhật; không cross-org retrieval.  

---

### Wave F — AI conversation loop

| Bước | Việc |
|------|------|
| F1 | Inngest step: load message → HTTP `apps/ai` process |
| F2 | RAG retrieve org-scoped; refuse/escalate nếu thiếu evidence |
| F3 | Tools → Core only (`getProduct`, `createDraftOrder`, …) |
| F4 | Core writes **`ai_runs`** (`prompt_version`, model allowlist) |
| F5 | `bot_epoch` takeover race |
| F6 | 24h messaging window handling |
| F7 | Golden eval VI + ≥10 adversarial cases |
| F8 | Quota entitlements before LLM |

**DoD:** DM hỏi giá → trả lời grounded hoặc escalate; eval CI/scheduled xanh.  
**Cấm:** AI ghi order trực tiếp DB; AI gửi Meta bypass Core.

---

### Wave G — Orders & export

| Bước | Việc |
|------|------|
| G1 | Order states: draft → confirmed → shipped → done / cancelled / returned |
| G2 | Default draft; optional `auto_confirm` + audit |
| G3 | Stock decrement on **`confirmed`**; restore nếu cancel trước shipped |
| G4 | Payment tag COD / bank_transfer / other only |
| G5 | Idempotency-Key trên create |
| G6 | Export Excel/CSV/PDF |
| G7 | Phone E.164; TZ `organizations.timezone` |

**DoD:** Confirm trừ kho đúng; export file mở được; audit approve/cancel.  

---

### Wave H — Web VI product surfaces

| Bước | Việc |
|------|------|
| H1 | Org switcher + invite members |
| H2 | Inbox UI (poll 3–5s) + takeover |
| H3 | Catalog UI |
| H4 | Orders list + confirm + export download |
| H5 | Owner dashboard (đơn mới, low stock, needs-attention) |
| H6 | Channel connect UI |
| H7 | Settings: auto_confirm, AI on/off (respect kill-switch) |

**DoD:** Design §12.1 product checklist thủ công xanh trên staging.  
**Cấm:** Service-role / Meta token / LLM key trên web.

---

### Wave I — Hardening & go-live prep

| Bước | Việc |
|------|------|
| I1 | Terms + Privacy (VI) published |
| I2 | PDPA: export org + delete/anonymize runbook + action |
| I3 | Rate limits auth/webhook/tools |
| I4 | Meta App Review package |
| I5 | Staging restore drill (doc); Pro upgrade checklist = M3 trigger |
| I6 | Operator runbooks hoàn chỉnh |
| I7 | Success criteria design §12.2 sign-off |

**DoD:** Sẵn sàng pilot có kiểm soát (chưa = M4/100).  

---

## 4. Gói thành 4 Implementation Plans (khi bạn OK)

| Plan | Waves | Blocking | Kết quả ship |
|------|-------|----------|--------------|
| **A — Platform** | A+B+C | Chặn Meta khách | Scaffold + tenancy + jobs + M2 |
| **B — Meta** | D | Trước AI thật | OAuth + webhook + inbox DB |
| **C — Catalog + AI** | E+F | Sau D (hoặc song song nhẹ) | RAG + tools + eval |
| **D — Orders + Web + Hardening** | G+H+I | Cuối Phase 1 | Export + UI + legal + App Review |

**Không** viết một plan 200 task gộp 9 wave.

---

## 5. Maturity overlay

| Gate | Trạng thái | Điểm mục tiêu |
|------|------------|---------------|
| M0 Foundation | **Done** (docs) | ~70 |
| M1 Spec Tier A | **Done** (scorecard) | ~76 |
| M2 Build Tier B | **Trong Wave A–I** (DoD mọi plan) | ~83 |
| M3 Pilot paid path | Khi khách thật đầu | ~95 |
| **M4** | SSO/SOC2-or-evidence/pen-test/DPA/SLA | **100 only here** |

---

## 6. Effort tham chiếu (không phải cam kết)

| Khối | % Phase 1 (ước lượng) | Ghi chú |
|------|------------------------|---------|
| Waves A–C | ~28% | Nền — đắt nhất nếu bỏ qua sẽ rewrite |
| Wave D | ~16% | Meta Review / OAuth edge cases |
| Waves E–F | ~26% | AI + eval + grounding |
| Wave G | ~12% | Orders/stock/export |
| Wave H | ~12% | UI VI |
| Wave I | ~6% | Legal / review / drills |

Team 2–4 eng full-time: **~4–8 tháng** tới pilot có kiểm soát (commercialization). Free-first chấp nhận cold start đến trước M3.

---

## 7. Thứ tự bắt tay code (blocking graph)

```
A → B → C → D → E → F → G → H → I
              └─ E có thể chuẩn bị schema song song sau B
```

**Cấm nhảy:** H trước A–C; F trước D (thiếu message SoT); G trước F tools contract (nếu AI tạo draft).

---

## 8. Khuyến nghị bước tiếp

1. Owner **duyệt** work breakdown này (số wave / 4 plan).  
2. Nếu OK → viết **Plan A** (`docs/superpowers/plans/…`) task nhỏ + M2 DoD.  
3. Sau Plan A ship → Plan B → C → D.  
4. Không tuyên bố Enterprise 100/100 trước M4.

---

## 9. Approval

- [ ] Owner OK với **4 Product Phase** dài hạn  
- [ ] Owner OK với **9 Waves** trong Phase 1  
- [ ] Owner OK gói **4 plan files** A–D  
- [ ] Owner OK bắt đầu bằng **Plan A (Waves A+B+C)**  

Sau khi tick → invoke writing-plans cho Plan A.
