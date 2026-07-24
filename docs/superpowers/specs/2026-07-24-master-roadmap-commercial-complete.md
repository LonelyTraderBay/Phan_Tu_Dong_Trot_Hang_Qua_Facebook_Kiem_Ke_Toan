# Master Roadmap — tới sản phẩm thương mại hóa hoàn thiện

**Date:** 2026-07-24  
**Status:** Owner analysis — full path to commercial-complete product  
**Authority:** [CANONICAL](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [design §11–12](./2026-07-24-omni-commerce-ai-saas-design.md) · [WBS Phase 1](./2026-07-24-implementation-work-breakdown.md) · [maturity](./2026-07-24-enterprise-maturity-scorecard-to-100.md) · [commercialization](./2026-07-24-enterprise-grade-commercialization-analysis.md)  
**Canvas:** `roadmap-thuong-mai-hoa-100.canvas.tsx`

---

## 0. “Hoàn thiện 100%” nghĩa là gì? (khóa định nghĩa)

Có **hai đích** — không lẫn:

| Đích | Ký hiệu | Đạt khi | Ý kinh doanh |
|------|---------|---------|---------------|
| **Sản phẩm thương mại hóa hoàn thiện** | **CPC** (Commercial Product Complete) | Xong **Epoch 0→4** + cổng **M3** | Đủ bộ tính năng design Phase 1–4; bán được lâu dài; vận hành paid |
| **Enterprise procurement 100/100** | **E100** | CPC + cổng **M4** | Chuỗi/enterprise lớn ký được (SSO, SOC2/pen, DPA, SLA) |

- Xong Wave **I** ≠ CPC, ≠ E100 (chỉ = pilot Phase 1).  
- CPC ≠ phải làm Kafka/microservices/multi-region.  
- **E100** mới được market “100/100 Enterprise-Grade”.

---

## 1. Bản đồ tổng (đếm phase)

| # | Epoch / Phase | Waves | Kết quả |
|---|---------------|-------|---------|
| 0 | Spec & foundation docs | — | **DONE** (M0+M1) |
| 1 | **Product Phase 1** Sellable Core | **A → I** (9) | Pilot / bán hẹp |
| 1.5 | **Gate M3** Commercial Ops | **M3.1 → M3.7** | Paid path ổn định |
| 2 | **Product Phase 2** Operations | **2A → 2H** (8) | Vận hành kho + ship + COD + P&L |
| 3 | **Product Phase 3** Intelligence | **3A → 3F** (6) | Ads, advisor, calendar, API khách |
| 4 | **Product Phase 4** ERP-lite | **4A → 4F** (6) | PO, chi nhánh, e-invoice, mobile |
| 5 | **Platform** (năm 3+ · khuyến nghị sau CPC) | **5A → 5D** (4) | Agency, residency, vertical packs |
| M4 | **Procurement E100** (song song từ cuối P2) | **M4.1 → M4.8** | Official 100/100 |

**Tổng wave kỹ thuật tới CPC:** 9 + 7 (M3) + 8 + 6 + 6 = **36 wave-groups** (mỗi wave có nhiều bước nhỏ bên dưới).  
**Tới E100:** + 8 bước M4 (+ optional Epoch 5 nếu muốn “platform company”).

**Thứ tự bắt buộc:** `0 → 1(A…I) → 1.5(M3) → 2 → 3 → 4` → (M4 có thể overlap 2–4) → (5 optional).

---

## 2. Quy tắc chất lượng Enterprise (mọi epoch)

Áp dụng **mọi** bước dưới đây:

1. Merge `main` chỉ khi CI xanh (lint, typecheck, unit; isolation nếu đụng tenant; eval nếu đụng AI).  
2. Mọi bảng tenant: `org_id` + RLS.  
3. Shop API: JWT + `X-Org-Id`.  
4. Side effects: `outbox_events` same-TX (preferred) → Inngest **chỉ trong `apps/api`**.  
5. AI mutations / Meta send: **Core only**; `ai_runs` do Core ghi.  
6. Money: BIGINT VND; phone: E.164; TZ: `organizations.timezone`.  
7. Không secret trong web bundle.  
8. Feature mới = **additive** (structure §12) — không đập skeleton.  
9. Mỗi wave có **DoD** riêng; wave sau không start nếu DoD trước đỏ (trừ stub đã thỏa).  
10. PR checklist charter §7.

---

# EPOCH 0 — Spec (DONE)

- CANONICAL, design, charter, structure, maturity, external-services, WBS Phase 1.  
- **DoD:** Spec CLEAN; M0+M1 xanh trên giấy.

---

# EPOCH 1 — Product Phase 1 · Sellable Core (Waves A–I)

> Chi tiết từng bước A1…I7: xem [implementation-work-breakdown](./2026-07-24-implementation-work-breakdown.md). Tóm tắt dưới đây để có master map đủ.

| Wave | Tên | DoD ngắn |
|------|-----|----------|
| **A** | Scaffold + M2 hooks | Structure §11; kill-switch; redacting logger; outbox table; CI |
| **B** | Identity & tenancy | Orgs, RBAC, `X-Org-Id`, `/ops/v1`, isolation CI |
| **C** | Jobs & spine | Inngest in api; outbox publisher; Sentry; entitlements; staging host |
| **D** | Meta channels | OAuth Page+IG; AES-GCM tokens; webhook→receipt→200; inbox DB |
| **E** | Catalog & knowledge | Products; reindex; `knowledge_chunks` org-scoped |
| **F** | AI loop | RAG grounded; tools→Core; `ai_runs`; eval + jailbreak; `bot_epoch` |
| **G** | Orders & export | Draft/confirm; stock on confirmed; Excel/CSV/PDF; audit |
| **H** | Web VI | Inbox poll; catalog; orders; dashboard; invite; settings |
| **I** | Hardening go-live | Terms/Privacy; PDPA export/delete; rate limits; Meta App Review; §12 sign-off |

**Kết thúc Epoch 1:** Shop pilot được; điểm ~M2 (~83). **Chưa** CPC.

**Gói plan code:** Plan A (A+B+C) → B (D) → C (E+F) → D (G+H+I).

---

# EPOCH 1.5 — Gate M3 · Commercial Ops (bắt buộc trước scale trả phí)

Làm **ngay khi có / sắp có khách thật** (có thể song song cuối Wave I).

| Bước | Việc | DoD |
|------|------|-----|
| **M3.1** | Supabase **Pro** production + PITR bật; staging giữ riêng | Backup/PITR documented + restore drill **đã chạy 1 lần** |
| **M3.2** | Host **always-on** (Render/Fly paid) web+api+ai | Cold start = 0 trên critical path; webhook không miss vì sleep |
| **M3.3** | LLM **billing** + spend cap + secondary vendor config được (`LlmProvider`) | Cap chặn vượt; failover doc |
| **M3.4** | Uptime monitoring + on-call tối thiểu (pager/email) | Alert webhook/api/ai down |
| **M3.5** | Billing SaaS: plan + entitlements enforce; **Stripe hoặc PayOS** (hoặc invoice + cờ plan nếu chưa auto-charge) | Shop vượt quota bị gate đúng |
| **M3.6** | DPA mẫu dùng thật + subprocessors list nội bộ | File pháp lý sẵn cho ký pilot |
| **M3.7** | Isolation + eval chạy **định kỳ** trên staging | Schedule CI/cron xanh |

**Kết thúc M3:** ~95 điểm; bán pilot có kiểm soát an toàn. Vẫn **chưa** đủ bộ Phase 2–4 → chưa CPC.

---

# EPOCH 2 — Product Phase 2 · Operations Depth

**Mục tiêu kinh doanh:** Shop vận hành giao hàng & đối soát trong sản phẩm (không chỉ export Excel).

### Wave 2A — Inventory depth

| Bước | Việc |
|------|------|
| 2A.1 | Stock movements ledger (`stock_movements`) — không chỉ `stock_qty` |
| 2A.2 | Adjust / inbound / outbound / reserve trên `confirmed` |
| 2A.3 | Low-stock alerts + dashboard |
| 2A.4 | Isolation + audit mọi điều chỉnh kho |

**DoD:** Mọi thay đổi kho truy vết được; race confirm vẫn đúng.

### Wave 2B — Carrier API (GHN / GHTK · connector pattern)

| Bước | Việc |
|------|------|
| 2B.1 | Interface `ShippingProvider` + config per org |
| 2B.2 | Tạo vận đơn từ `confirmed`/`shipped` |
| 2B.3 | Webhook/tracking sync status |
| 2B.4 | Mapping phí ship → order (BIGINT) |
| 2B.5 | Feature flag per carrier; secrets encrypted |

**DoD:** 1 carrier E2E staging; thất bại → DLQ + runbook; export file **vẫn** hoạt động (fallback).

### Wave 2C — COD reconciliation

| Bước | Việc |
|------|------|
| 2C.1 | COD expected vs collected |
| 2C.2 | Đối soát file/API carrier |
| 2C.3 | Discrepancy queue cho owner/kho |
| 2C.4 | Audit money events |

**DoD:** Báo cáo đối soát theo kỳ; không dùng float.

### Wave 2D — Returns / hoàn

| Bước | Việc |
|------|------|
| 2D.1 | Status `returned` flow + lý do |
| 2D.2 | Restock rules |
| 2D.3 | Link vận đơn hoàn (nếu có) |
| 2D.4 | UI + audit |

**DoD:** Hoàn 1 đơn → stock + tiền/COD state đúng.

### Wave 2E — Simple P&L

| Bước | Việc |
|------|------|
| 2E.1 | Cost fields (COGS) trên variant/org |
| 2E.2 | Revenue − COGS − ship − ads(stub) theo khoảng ngày |
| 2E.3 | Dashboard P&L VI |
| 2E.4 | Export báo cáo |

**DoD:** Owner xem lãi gộp theo ngày/SKU (độ chính xác Phase 2 — không full kế toán).

### Wave 2F — Channel expansion #1 (Zalo OA **hoặc** 1 sàn)

| Bước | Việc |
|------|------|
| 2F.1 | Connector interface (giống Meta pattern) |
| 2F.2 | OAuth/kết nối + webhook idempotent |
| 2F.3 | Map vào `conversations`/`messages` chung |
| 2F.4 | Entitlement gate kênh |

**DoD:** Inbox đa kênh một UI; tenant isolation giữ nguyên.

### Wave 2G — Billing & commercial packaging

| Bước | Việc |
|------|------|
| 2G.1 | Plans: free_dev / starter / growth / enterprise flags |
| 2G.2 | Usage meters (pages, tokens, orders) |
| 2G.3 | Customer portal / hóa đơn |
| 2G.4 | Dunning / suspend khi quá hạn (ops + auto) |

**DoD:** Thu tiền subscription tự động hoặc quy trình invoice chặt; entitlement khớp gói.

### Wave 2H — Phase 2 hardening

| Bước | Việc |
|------|------|
| 2H.1 | Load test webhook+ship staging |
| 2H.2 | Runbooks carrier/COD |
| 2H.3 | Eval hồi quy + isolation |
| 2H.4 | CHANGELOG + migration safety |

**DoD:** Phase 2 success checklist nội bộ xanh.

**Kết thúc Epoch 2:** Vận hành sâu; vẫn chưa advisor/ERP → chưa CPC.

---

# EPOCH 3 — Product Phase 3 · Intelligence & Expansion

### Wave 3A — Ads spend sync

| Bước | Việc |
|------|------|
| 3A.1 | Kết nối Meta Ads (hoặc CSV import Phase 3a) |
| 3A.2 | `ad_spend` per org/campaign/day |
| 3A.3 | Gắn vào P&L |
| 3A.4 | Secrets + rate limit |

**DoD:** Chi phí ads vào báo cáo lãi.

### Wave 3B — Attribution

| Bước | Việc |
|------|------|
| 3B.1 | UTM / click ids trên contact/order |
| 3B.2 | Model first/last touch đơn giản |
| 3B.3 | Báo cáo nguồn đơn |
| 3B.4 | Privacy: không lưu PII thừa |

**DoD:** Owner biết đơn đến từ đâu (độ chính xác MVP attribution).

### Wave 3C — Owner Advisor AI (advise-only)

| Bước | Việc |
|------|------|
| 3C.1 | Skill advisor riêng trong `apps/ai` (không gửi Meta khách) |
| 3C.2 | RAG trên catalog + sales aggregates |
| 3C.3 | **Không** auto-post / auto-mua ads |
| 3C.4 | `ai_runs` + eval riêng advisor |
| 3C.5 | Entitlement gói |

**DoD:** Gợi ý “nên bán gì / khi nào đăng” — người duyệt; grounded.

### Wave 3D — Content calendar

| Bước | Việc |
|------|------|
| 3D.1 | Lịch bài / ý tưởng nội dung |
| 3D.2 | Gợi ý từ advisor (optional) |
| 3D.3 | **Default: không auto-post** Meta |
| 3D.4 | Nếu bật post sau: flag + audit + kill-switch |

**DoD:** Calendar dùng được; auto-post off mặc định.

### Wave 3E — Public API & customer webhooks

| Bước | Việc |
|------|------|
| 3E.1 | API keys per org; scopes |
| 3E.2 | `/v1` ổn định + versioning policy |
| 3E.3 | Outbound webhooks `orders.*` / `messages.*` |
| 3E.4 | Signature + retry; docs VI/EN tối thiểu |

**DoD:** Khách enterprise kéo order qua API; webhook ký đúng.

### Wave 3F — Phase 3 hardening + thêm connector (optional)

| Bước | Việc |
|------|------|
| 3F.1 | Marketplace connector #2 (nếu ICP đòi) |
| 3F.2 | Scale AI replicas / queue lag SLOs |
| 3F.3 | Eval + load + runbooks |

**DoD:** Phase 3 checklist xanh.

**Kết thúc Epoch 3:** Intelligence layer xong; còn ERP-lite → chưa CPC.

---

# EPOCH 4 — Product Phase 4 · ERP-lite

### Wave 4A — Multi-branch / multi-warehouse

| Bước | Việc |
|------|------|
| 4A.1 | `branches` / `warehouses` + stock per location |
| 4A.2 | Order gán kho xuất |
| 4A.3 | Transfer giữa kho |
| 4A.4 | RLS theo org (không nhầm chi nhánh) |

**DoD:** 2 kho cùng org hoạt động đúng.

### Wave 4B — Supplier & PO

| Bước | Việc |
|------|------|
| 4B.1 | Suppliers CRUD |
| 4B.2 | Purchase orders + nhận hàng → stock ledger |
| 4B.3 | Audit + tiền BIGINT |
| 4B.4 | UI kho/owner |

**DoD:** PO → nhập kho → tồn tăng có truy vết.

### Wave 4C — E-invoice hooks

| Bước | Việc |
|------|------|
| 4C.1 | Interface `EInvoiceProvider` |
| 4C.2 | Phát hành / hủy hóa đơn từ order `done` |
| 4C.3 | Lưu mã hóa đơn; retry/DLQ |
| 4C.4 | Flag theo gói / quốc gia |

**DoD:** 1 provider staging E2E hoặc sandbox.

### Wave 4D — Staff mobile

| Bước | Việc |
|------|------|
| 4D.1 | PWA hoặc app mỏng: inbox + cập nhật ship + quét mã (tùy) |
| 4D.2 | Cùng API `/v1`; auth mobile-safe |
| 4D.3 | Offline-tolerant tối thiểu cho kho (optional) |

**DoD:** CSKH/kho dùng mobile cho việc chính hàng ngày.

### Wave 4E — Accounting export depth

| Bước | Việc |
|------|------|
| 4E.1 | Export sổ chi tiết (orders, COD, PO, returns) |
| 4E.2 | Mapping tài khoản đơn giản (optional) |
| 4E.3 | Không thay thế phần mềm kế toán đầy đủ — **hooks** |

**DoD:** Kế toán shop nhập được file vào phần mềm họ đang dùng.

### Wave 4F — Phase 4 / CPC hardening

| Bước | Việc |
|------|------|
| 4F.1 | Full regression: isolation, eval, carriers, billing |
| 4F.2 | DR drill + capacity review |
| 4F.3 | Product CPC checklist (mục §7 dưới) sign-off |
| 4F.4 | Freeze breaking API; version bumps only |

**DoD:** **CPC đạt** — sản phẩm thương mại hóa hoàn thiện theo vision Phase 1–4.

---

# EPOCH 5 — Platform company (OPTIONAL · sau CPC)

Chỉ khi muốn mô hình agency / multi-brand / đa thị trường.

| Wave | Việc | DoD |
|------|------|-----|
| **5A** | Partner/agency multi-org tree | Agency xem nhiều shop theo grant |
| **5B** | Data residency options | Chọn region; doc pháp lý |
| **5C** | Vertical packs (template ngành) | Pack = config+prompt+catalog seed — không fork code |
| **5D** | Marketplace / partner program | Revenue share; sandbox |

**Không bắt buộc cho CPC.**

---

# EPOCH M4 — Enterprise Procurement E100 (song song từ cuối Phase 2)

| Bước | Việc | DoD |
|------|------|-----|
| **M4.1** | SSO/SAML path (implement **hoặc** cam kết ≤90 ngày gói Enterprise) | Khách chuỗi onboard SSO được / có calendar |
| **M4.2** | SOC 2 Type I in progress **hoặc** evidence pack tương đương | Controls mapped; evidence folder |
| **M4.3** | Pen-test bên 3 + fix critical | Report + remediations đóng |
| **M4.4** | Status page + incident comms | Trang public + template thông báo |
| **M4.5** | Subprocessors list **công khai** | URL published |
| **M4.6** | SLA hợp đồng (vd 99.5%+) + support tier | Trong contract template |
| **M4.7** | SBOM trên mỗi release | Artifact CI |
| **M4.8** | Access review định kỳ `platform_admins` | Checklist quý |

**DoD:** **E100** — chỉ lúc này market “100/100 Enterprise-Grade”.

---

## 3. Checklist CPC (sản phẩm hoàn thiện thương mại hóa)

Shop / nền tảng phải:

- [ ] Phase 1: bán trên Page+IG + AI grounded + đơn + export + dashboard  
- [ ] M3: Pro DB, always-on, LLM paid, billing, DR drill  
- [ ] Phase 2: kho sâu, ≥1 carrier API, COD, returns, P&L, billing packaging, (+ kênh phụ nếu ICP)  
- [ ] Phase 3: ads/attribution, advisor advise-only, calendar, public API/webhooks  
- [ ] Phase 4: multi-warehouse, PO, e-invoice hook, mobile staff, accounting export  
- [ ] Mọi cổng chất lượng §2 xanh; không rewrite khung  

**CPC = tích hết.** E100 = CPC + M4.

---

## 4. Gói Implementation Plans (gợi ý khi viết `docs/superpowers/plans/`)

| Plan | Scope |
|------|--------|
| **A** | Epoch 1 Waves A+B+C |
| **B** | Wave D |
| **C** | Waves E+F |
| **D** | Waves G+H+I |
| **E** | Gate M3 |
| **F** | Phase 2 (2A–2H) — có thể tách 2–3 plan |
| **G** | Phase 3 (3A–3F) |
| **H** | Phase 4 (4A–4F) → **CPC** |
| **I** | M4 → **E100** |
| **J** | Epoch 5 optional |

---

## 5. Thời gian định hướng (team 2–4 eng)

| Mốc | Thời gian gợi ý |
|-----|-----------------|
| Epoch 1 (A–I) | 4–8 tháng |
| M3 | 2–6 tuần khi có khách |
| Epoch 2 | 4–8 tháng |
| Epoch 3 | 4–8 tháng |
| Epoch 4 → **CPC** | 4–8 tháng |
| M4 → **E100** | 6–18 tháng (overlap) |
| Epoch 5 | Sau CPC, theo thị trường |

Tổng **CPC:** thường **~2–3.5 năm** calendar với team nhỏ (song song M4). Không phải cam kết cứng — phụ thuộc hiring/ngân sách.

---

## 6. Bắt đầu code hôm nay

1. Không nhảy Phase 2.  
2. Viết **Plan A** (Waves A+B+C) với task nhỏ + M2 DoD.  
3. Mỗi wave đóng DoD rồi mới mở wave sau.  
4. Nhớ: **I ≠ 100% sản phẩm**; **CPC** mới là hoàn thiện thương mại hóa; **E100** mới là 100/100 Enterprise.

---

## 7. Approval

- [x] Owner OK định nghĩa **CPC** vs **E100**  
- [x] Owner OK toàn bộ Epoch 0→4 (+ M3) là đích sản phẩm hoàn thiện  
- [x] Owner OK Epoch 5 optional  
- [x] Owner OK bắt đầu bằng Plan A (không làm Phase 2 trước)  

**Plan A written:** [../plans/2026-07-24-plan-a-platform-foundation.md](../plans/2026-07-24-plan-a-platform-foundation.md)  
Sau khi Plan A DoD xanh → Plan B (Wave D Meta).
