# Phân tích: Thương mại hóa Enterprise-Grade (không làm demo)

**Date:** 2026-07-24 · **Sync:** [CANONICAL](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md)  
**Liên quan:** [design](./2026-07-24-omni-commerce-ai-saas-design.md) · [maturity M0–M4](./2026-07-24-enterprise-maturity-scorecard-to-100.md) · [structure](./2026-07-24-enterprise-structure-and-data-architecture.md) · [README](./README.md)  
**Mục đích:** Định nghĩa “Enterprise-Grade” cho sản phẩm Omnichannel + AI này, chỉ ra khoảng cách với Phase 1 hiện tại, và kế hoạch làm việc lâu dài (nền tảng trước, tính năng theo lớp).

**Topology (locked):** C từ ngày 1 — Next.js + NestJS + FastAPI AI — **không** “một stack TS xuyên suốt” và **không** đợi năm 2–3 mới tách AI.

---

## 1. Kết luận ngắn

**Đã chốt (2026-07-24):** Chủ sản phẩm yêu cầu nền móng vững từ đầu — sau này **chỉ xây thêm**, chuẩn **Enterprise-Grade từ dòng code đầu tiên**, không làm demo/throwaway.

Spec Phase 1 (SaaS đa shop, FB Page+IG, RAG, đơn nháp, Supabase, TypeScript) **đúng hướng sản phẩm**. Tư duy enterprise được khóa trong:

- [Design §2.2](./2026-07-24-omni-commerce-ai-saas-design.md) — build posture  
- [Engineering Foundation Charter](./2026-07-24-enterprise-engineering-foundation-charter.md) — luật engineering + DoD + thứ tự scaffold  

**Enterprise-Grade ≠ Full ERP ngay năm 1.**  
**Enterprise-Grade =** mỗi phần ship ra có thể bán/ký hợp đồng lâu dài: bảo mật, cô lập tenant, audit, ổn định, quan sát được, mở rộng được, vận hành được, tuân thủ được — **không viết lại từ demo**.

Cách làm đúng: **Platform & Quality từ ngày 1** + **Feature theo phase** (additive modules).

---

## 2. “Enterprise-Grade” nghĩa là gì với sản phẩm này?

Với SaaS bán hàng đa kênh + AI admin tại Việt Nam / khu vực, khách enterprise (chuỗi shop, agency quản lý nhiều page, công ty vừa) thường đòi:

| Trụ cột | Kỳ vọng thực tế | Nếu thiếu sẽ ra sao |
|---------|-----------------|---------------------|
| **Security & Isolation** | Mỗi shop không đụng data shop khác; mã hóa secret; quyền RBAC rõ | Mất uy tín ngay vụ đầu tiên |
| **Compliance** | PDPA/NV liên quan PII; nhật ký truy cập; xóa/xuất data theo yêu cầu | Không ký được hợp đồng lớn |
| **Reliability** | Webhook không mất tin; retry; SLA uptime; backup/DR | Đơn mất = mất khách của khách hàng bạn |
| **Auditability** | AI nói gì, ai duyệt đơn, ai đổi giá — truy vết được | Tranh chấp không xử lý nổi |
| **AI Governance** | Không bịa; eval định kỳ; cost/quota; human takeover | Hallucination = kiện / cháy tài khoản Meta |
| **Operability** | Console vận hành SaaS (suspend shop, xem lỗi Meta, usage) | Support chết khi có 50+ shop |
| **Extensibility** | Module rõ; API/webhook sau này; feature flags | Mỗi kênh mới = đập đi làm lại |
| **Commercial packaging** | Gói Standard / Pro / Enterprise; hạn mức; hợp đồng; SSO (enterprise) | Không scale doanh thu |
| **Quality system** | CI, test isolation, staging, migration an toàn | Mỗi release là canh bạc |

Đây là tiêu chí **cấp thương mại bền**, không phải checklist “làm giống SAP trong 3 tháng”.

---

## 3. Spec Phase 1 hiện tại: giữ gì / thiếu gì

### 3.1 Giữ — đã đúng cho đường dài

- Custom full (không phụ thuộc ManyChat làm lõi)
- Multi-tenant SaaS từ đầu
- Supabase + RLS + pgvector
- Đơn nháp mặc định + audit hướng
- RAG grounding, không bịa
- Topology **C**: FE + Core API (TS) + AI Service (Python) — tách deployable từ đầu
- Modular **trong từng service** (Nest modules / FastAPI routers); không nở microservices theo từng bảng
- Polyglot có kiểm soát (không “một stack TS xuyên suốt” cho AI)
- Scope kênh hẹp (Page+IG) — **đúng**: enterprise cũng bắt đầu hẹp rồi mở rộng có kiểm soát
- **Free-first** vendors pre-customer ([catalog](./2026-07-24-external-services-catalog.md))

### 3.2 Thiếu — phải bổ sung tư duy “nền tảng enterprise” vào Phase 1 (dù UI còn mỏng)

Những thứ sau **không được** để “làm sau khi demo chạy”:

| Nền tảng | Việc tối thiểu ngay từ đầu | Lý do |
|----------|----------------------------|-------|
| Tenant isolation tests | Test tự động chứng minh shop A không đọc shop B | An toàn sống còn |
| Encryption secrets | Token Meta: **AES-256-GCM** + `TOKEN_ENCRYPTION_KEY` trên Core | Leak token = chiếm page |
| Structured audit log | Ai / khi nào / entity nào đổi | Enterprise mua cái này |
| Idempotent webhooks | Dedupe `message_id` Meta | Tránh double reply / double order |
| Job queue + retry/DLQ | Worker tách khỏi request HTTP | Reliability |
| Environments | `local` / `staging` / `production` tách project Supabase | Không test trên prod |
| Observability | Request id, error tracking (Sentry…), AI cost log | Debug khi có tiền khách |
| Backup & restore drill | Policy backup Supabase + thử restore 1 lần/quý | DR tối thiểu |
| Feature flags | Bật auto-confirm / module theo gói | Packaging enterprise |
| AI eval harness | Bộ câu hỏi vàng + đo hallucination | Chất lượng AI có quản trị |
| Operator admin | Ít nhất: list orgs, suspend, xem connection health | Bạn là nhà cung cấp SaaS |
| Legal/ToS/Privacy | Điều khoản, chính sách dữ liệu, DPA mẫu | Bán được |
| Meta App Review path | Quy trình permission, use-case, screencast | Không review = không onboard công khai |

### 3.3 Cố ý làm sau (vẫn enterprise, nhưng không chặn năm 1)

- SSO/SAML, SCIM
- SOC 2 Type II (bắt đầu control sớm, chứng nhận sau 12–18 tháng)
- Dedicated VPC / on-prem
- Đa vùng active-active
- Full ERP, mọi sàn, auto-publish
- SLA 99.99% có bồi thường (bắt đầu 99.5–99.9 nội bộ trước)

---

## 4. Sai lầm “demo rồi nâng cấp” — tránh tuyệt đối

| Làm kiểu demo | Hậu quả khi thương mại hóa |
|---------------|----------------------------|
| Một DB không RLS / tin middleware thôi | Phải rewrite bảo mật |
| Token Meta để plain text / client | Xoay secret hàng loạt khi lộ |
| AI prompt hardcode, không eval | Không kiểm soát chất lượng theo phiên bản |
| Webhook xử lý sync trong HTTP request | Timeout Meta, mất tin khi scale |
| Schema “tạm”, migration tay | Không deploy an toàn |
| Không staging | Mỗi hotfix là downtime |
| Gói cước hardcode if/else trong UI | Không bán Enterprise được |
| Tài liệu = không có | Onboard khách / partner thất bại |

**Nguyên tắc:** Phase 1 có thể **ít tính năng**, nhưng mọi đường đi chính (auth → tenant → channel → message → RAG → order → export) phải là **đường production**.

---

## 5. Kiến trúc lâu dài (Enterprise posture)

**Đã chốt Option C:** ba deployable (`web` / `api` / `ai`) + Supabase. Không microservices theo từng bảng; không nhét LLM vào Core.

```
┌─────────────────────────────────────────────────────────┐
│  Edge: Next.js web (VI UI) + CDN                        │
├─────────────────────────────────────────────────────────┤
│  Core API (NestJS/TS): identity · channels · catalog ·  │
│  inbox · orders · billing · admin-ops · audit · jobs out│
├─────────────────────────────────────────────────────────┤
│  AI Service (FastAPI/Python): RAG · LLM · embed · eval  │
├─────────────────────────────────────────────────────────┤
│  Platform: jobs/queue · feature-flags · secrets · obs   │
├─────────────────────────────────────────────────────────┤
│  Supabase: Auth · Postgres+RLS · pgvector · Storage     │
│  (staging ≠ production)                                 │
├─────────────────────────────────────────────────────────┤
│  Externals: Meta (via Core) · LLM (via AI) · later ship │
└─────────────────────────────────────────────────────────┘
```

### Ranh giới module (để không phải đập lại)

Mỗi module expose API nội bộ rõ (functions/services), không import vòng:

- `channels` không biết pricing gói cước  
- `ai` chỉ gọi tool qua interface (`getProduct`, `createDraftOrder`)  
- `orders` không gọi Meta trực tiếp  
- `billing` chỉ đọc usage events  

Khi cần scale (AI inference, webhook burst), **tách worker trước**, tách DB sau.

---

## 6. Lộ trình thương mại hóa nhiều năm (gợi ý)

Thang thời gian mang tính **định hướng** (team 2–4 eng full-time). Điều chỉnh theo ngân sách.

### Năm 0–1 — “Sellable Core” (Enterprise foundations + ít tính năng)

**Mục tiêu kinh doanh:** 5–20 shop trả phí (hoặc pilot có hợp đồng), không mất data, Meta ổn định.

**Ship:**

1. Platform: Auth, org, RBAC, RLS, audit, flags, staging, monitoring, backups  
2. Meta Page+IG connect + inbox + takeover  
3. Catalog general + RAG grounded + eval tối thiểu  
4. Orders draft/confirm + export  
5. Dashboard cơ bản  
6. Billing tối thiểu (gói + hạn mức token/page) hoặc invoice thủ công + plan flags  
7. Operator admin mỏng  
8. Legal: Terms, Privacy, subprocessors  

**Không ship:** ERP, mọi sàn, payment gateway, advisor AI sâu.

**Cổng chất lượng ra mắt công khai:**

- Isolation test xanh  
- Webhook idempotent + DLQ  
- Meta App Review approved (hoặc advanced access đủ)  
- Uptime nội bộ đo được  
- Runbook: mất kết nối Meta, LLM down, DB failover  

### Năm 1–2 — “Operations Depth”

- Vận chuyển API, COD đối soát, returns  
- P&L đơn giản + ads spend sync  
- Nhiều kênh (Zalo OA hoặc 1 sàn) theo connector pattern  
- SSO cho gói Enterprise  
- SOC 2 gap analysis → evidence collection  
- SLA công bố + support tier  

### Năm 2–3 — “Intelligence & Expansion”

- Advisor AI (advise-only)  
- Attribution tốt hơn  
- Đa chi nhánh / multi-warehouse  
- Marketplace connectors thêm  
- API công khai / webhook cho khách enterprise  
- Scale thêm worker/replicas (AI đã là service riêng từ Phase 1)  

### Năm 3+ — “Platform”

- Partner/agency multi-org  
- Data residency options  
- Vertical packs (template ngành) trên nền general  
- Chứng nhận compliance mạnh hơn theo thị trường mục tiêu  

---

## 7. Kế hoạch làm việc chi tiết theo dòng công việc (Workstreams)

Làm **song song** 4 workstream; không chờ “xong chat bot mới nghĩ bảo mật”.

### WS0 — Governance & Product (liên tục)

- Roadmap quý, pricing, ICP (ideal customer profile)  
- Meta partnership / App Review  
- Hợp đồng DPA, ToS  
- Định nghĩa SLI/SLO (ví dụ: 99.5% API; p95 webhook xử lý < 5s)

### WS1 — Platform Foundation (ưu tiên tuyệt đối tháng đầu)

Deliverables:

- Monorepo Next.js + Supabase migrations  
- `organizations` / `memberships` + RLS policies + isolation tests  
- Secrets handling cho Meta tokens  
- Job runner + retry/DLQ  
- Staging + prod projects  
- Logging/tracing/error tracking  
- Feature flags table  
- SaaS operator routes (internal)

### WS2 — Revenue Path (Channels → AI → Orders)

Deliverables theo spec Phase 1 đã khóa, nhưng **cắm vào** WS1 (không bypass RLS/audit).

### WS3 — AI Quality & Cost

- Prompt/version registry  
- Golden set (tiếng Việt) theo ngành general  
- Metrics: grounded rate, escalation rate, cost/conversation  
- Quotas theo plan  

### WS4 — GTM & Customer Success

- Onboarding checklist shop  
- Tài liệu VI  
- Support playbook  
- Pilot design (success criteria từng khách)

---

## 8. Packaging thương mại (định hướng Enterprise)

| Gói | Đối tượng | Khác biệt chính |
|-----|-----------|-----------------|
| **Starter** | Shop nhỏ | 1–2 Page, hạn mức AI thấp, draft-only (khuyến nghị khóa auto-confirm) |
| **Growth** | Shop đang scale | Nhiều NV, auto-confirm, export nâng cao, usage cao hơn |
| **Enterprise** | Chuỗi / agency | SSO (sau), SLA, audit export, nhiều org, hỗ trợ riêng, custom retention, DPA ký |

Phase 1 có thể chỉ implement **plan flags + hạn mức**; cổng thanh toán tự động có thể sau — nhưng **model gói** phải có trong data model từ đầu (`organizations.plan`, `entitlements`).

---

## 9. Rủi ro enterprise đặc thù (phải thiết kế sớm)

| Rủi ro | Mitigation |
|--------|------------|
| Meta policy / App Review chậm hoặc reject | Sandbox + pilot whitelist; không promise “onboard tự phục vụ 100%” trước review |
| AI bịa giá/tồn | Tool realtime + refuse; eval; default draft order |
| Cross-tenant leak | RLS + service-role chỉ server + tests |
| Chi phí LLM ăn margin | Quota, caching FAQ, model tier theo gói |
| Phụ thuộc 1 LLM vendor | Abstract provider interface từ ngày 1 |
| Khách đòi “toàn bộ ERP” sớm | Bán roadmap; không custom one-off phá kiến trúc |
| Team quá mỏng | Cắt feature, không cắt foundation |

---

## 10. Đội ngũ & cách vận hành dự án (thực tế)

Tối thiểu bền vững:

| Vai trò | Việc |
|---------|------|
| Tech lead / architect | Biên module, review RLS/security |
| Full-stack eng ×2 | Product path |
| Part-time DevOps/platform | Staging, backup, observability |
| Product / founder | ICP, Meta review, sales pilot |
| (Sau) AI quality owner | Eval, prompt versions |

**Quy trình bắt buộc:**

- PR + CI (typecheck, unit, isolation tests)  
- Migration review  
- Không deploy thẳng schema lên prod không qua staging  
- Changelog + version AI prompt  

---

## 11. Điều chỉnh đề xuất cho spec Phase 1

Để khớp “thương mại hóa enterprise, không demo”, nên **mở rộng Definition of Done Phase 1** (không nhất thiết mở rộng tính năng bán hàng):

Thêm vào success criteria:

1. Isolation tests tự động pass  
2. Staging environment tồn tại và dùng cho UAT  
3. Webhook idempotent + DLQ có runbook  
4. Audit log đủ cho đơn + cấu hình AI + kết nối Meta  
5. Operator có thể suspend org / xem health kết nối  
6. Plan/entitlements trong DB (dù billing thủ công)  
7. Golden eval set AI (tối thiểu) chạy được trong CI hoặc weekly job  
8. Terms + Privacy published  

Feature scope bán hàng **giữ như spec** (Page+IG, export file, không payment gateway) — đó vẫn là cách enterprise: **đúng và hẹp**, không **rộng và ẩu**.

---

## 12. Ngân sách thời gian (tham chiếu)

| Cách làm | Thời gian tới “bán pilot có kiểm soát” | Rủi ro |
|----------|----------------------------------------|--------|
| Demo nhanh bỏ foundation | 4–8 tuần | Phải viết lại 6–12 tháng sau |
| **Enterprise foundations + Sellable Core** | **4–8 tháng** (team 2–4) | Chậm hơn demo, bán được lâu |
| Full ERP + mọi kênh năm 1 | 12–24 tháng+ | Dễ cháy scope, không ra thị trường |

Khuyến nghị: chọn hàng giữa — **4–8 tháng tới pilot có hợp đồng**, rồi Năm 1–2 đào sâu vận hành.

---

## 13. Trạng thái chốt (sync 2026-07-24)

| Mục | Trạng thái |
|-----|------------|
| Foundations-first Phase 1 | **Đã chốt** — design §2.2 + charter |
| Topology C + Free-first | **Đã chốt** — web = Render Free Node |
| Structure + schema + scaffold DoD | **Đã chốt** — structure doc |
| Maturity M0–M4 / 100@M4 only | **Đã chốt** — scorecard |
| Conflict SoT | **CANONICAL-LOCKED-DECISIONS** |
| ICP năm 1 (shop lẻ vs chuỗi/agency) | **Mở** — GTM; không chặn scaffold |
| Quy mô team / ngân sách eng | **Mở** — tốc độ, không đổi architecture |
| Render vs Fly single vendor | **Mở** — task đầu Plan A |

**Bước tiếp:** user **OK / duyệt spec** → `docs/superpowers/plans/` (Platform → Meta → Catalog/AI → Orders). Plan A phải gồm **M2 DoD**.

**Không** market 100/100 trước M4.
