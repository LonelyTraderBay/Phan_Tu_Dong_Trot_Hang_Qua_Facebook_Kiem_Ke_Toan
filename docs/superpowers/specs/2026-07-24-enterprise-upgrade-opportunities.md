# Phân tích: Còn nâng cấp Enterprise-Grade được những gì?

**Date:** 2026-07-24 · **Sync:** [CANONICAL](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md)  
**Câu hỏi:** Spec hiện tại đã “enterprise từ dòng đầu” — còn phần nào nâng thêm được?  
**Khung đánh giá:** So với SaaS enterprise thực chiến (không phải checklist SAP đầy đủ năm 1).  
**Related:** [maturity scorecard](./2026-07-24-enterprise-maturity-scorecard-to-100.md) · [README](./README.md)

---

## 1. Kết luận ngắn

| Trạng thái | Ý nghĩa |
|------------|---------|
| **Nền tảng code/data/topology** | Đã ở mức **Enterprise foundation Phase 1** khá đủ để scaffold mà không viết lại khung |
| **Vẫn nâng được** | Chủ yếu ở: bảo mật nâng cao, compliance sâu, SRE/DR, AI governance đo lường, packaging thương mại, quan sát đa service |
| **Không nên nâng ngay** | Microservices theo bảng, multi-region, SSO bắt buộc, Kafka, mesh — sẽ làm chậm Free-first và team nhỏ |

**Khuyến nghị:**  
- **Trước khi code:** chỉ bổ sung thêm một lớp “Enterprise baseline v1.1” (rẻ, ghi vào spec) — mục §3.  
- **Khi có khách:** nâng paid infra + SOC2 path + SLA — mục §4.  
- **Không** nâng feature ERP/mọi kênh chỉ để “nghe enterprise hơn”.

---

## 2. Đã đạt (không cần đập lại)

Những trụ này **đã khóa** trong design / charter / structure:

| Trụ | Đã có |
|-----|--------|
| Topology | FE + Core + AI tách deployable |
| Multi-tenant | `org_id` + RLS + isolation tests |
| Module map | Nest/FastAPI/Next folder chuẩn |
| Schema xương | Identity → channels → catalog → inbox → orders → audit |
| Async | Inngest + idempotency + DLQ pattern |
| Authz | Roles + `X-Org-Id` + `platform_admins` |
| AI safety tối thiểu | Grounding, takeover, quota, eval folder |
| Free→Paid path | Catalog §0 |
| Pre-code defaults | Design §15 |

→ Đây là **80% “không phải demo”**. Phần còn lại là **độ chín enterprise**, không phải thiếu khung.

---

## 3. Có thể nâng *ngay trong spec* (rẻ — trước/khi scaffold)

Những mục dưới đây **chưa đủ chi tiết trong docs** nhưng **không đòi trả tiền cloud**. Nếu muốn “không phải kiểm tra lại”, nên **khóa vào structure/charter** trước Plan A.

### 3.1 Security & identity (ưu tiên cao)

| # | Nâng cấp | Hiện trạng | Đề xuất Enterprise v1.1 |
|---|----------|------------|-------------------------|
| S1 | **Permission matrix** chi tiết | Mới có 3 role thô | Bảng permission: `orders.approve`, `catalog.write`, `inbox.takeover`, `ops.suspend`… map role→permission |
| S2 | **Session / token policy** | JWT Supabase | TTL, refresh, revoke membership → deny ngay; optional refresh rotation doc |
| S3 | **Secret rotation runbook** | Có AES key | Quy trình rotate `TOKEN_ENCRYPTION_KEY` + re-encrypt job (spec + script stub) |
| S4 | **Security headers** | Chưa | CSP, HSTS, `X-Content-Type-Options` trên web+api |
| S5 | **Dependency scanning** | Chưa trong CI list | `pnpm audit` / Trivy / Dependabot bắt buộc trên PR |
| S6 | **Threat model 1 trang** | Chưa | STRIDE ngắn: webhook spoof, tenant escape, prompt injection, token leak |

### 3.2 Data & compliance

| # | Nâng cấp | Hiện trạng | Đề xuất |
|---|----------|------------|---------|
| D1 | **Data classification** | Chưa | Tag cột: `public` / `internal` / `pii` / `secret` trong schema doc |
| D2 | **Retention policy** | Mới có export/delete | TTL: messages 24 tháng; audit 36 tháng; ai_runs 12 tháng (config) |
| D3 | **PII redaction in logs** | Nhắc chung | Deny-list: phone, address, token trong logger |
| D4 | **Backup RPO/RTO mục tiêu** | “restore drill” | Pre-customer: RPO 24h; khi Pro: RPO ≤ 1h, RTO ≤ 4h (ghi SLO) |
| D5 | **Migration expand/contract** | Migrations only | Quy tắc: không breaking rename không version; dual-write khi đổi cột nóng |

### 3.3 Reliability & SRE

| # | Nâng cấp | Hiện trạng | Đề xuất |
|---|----------|------------|---------|
| R1 | **SLI/SLO Phase 1** | UptimeRobot | SLI: webhook accept success %, API p95, AI job success %; SLO nội bộ 99.5% sau khi always-on |
| R2 | **Runbook catalog** | Nhắc Meta/AI/DLQ | Template bắt buộc: symptom → check → action → escalate (file `docs/runbooks/`) |
| R3 | **Chaos nhẹ** | Chưa | Staging: kill AI 5 phút — Core phải escalate inbox, không mất webhook receipt |
| R4 | **Idempotency registry** | Orders + webhooks | Mở rộng pattern cho mọi POST tạo resource (`Idempotency-Key` header) |
| R5 | **Outbox pattern** | **LOCKED preferred** (structure §0b / maturity §8 / CANONICAL) | `outbox_events` same-TX → Inngest; fallback enqueue-after-commit + DLQ only if documented |

### 3.4 Observability

| # | Nâng cấp | Hiện trạng | Đề xuất |
|---|----------|------------|---------|
| O1 | **Trace propagation** | request_id | W3C `traceparent` xuyên api↔ai↔Inngest |
| O2 | **RED/USE metrics** | Sentry errors | Metrics: request rate, error rate, duration per route; queue lag |
| O3 | **AI quality dashboard** | Eval folder | Metrics: grounded_rate, escalate_rate, cost/msg, hallucination_flags |
| O4 | **Audit search** | append-only | Index + ops UI filter theo action/entity (Phase 1b) |

### 3.5 AI governance (vượt grounding cơ bản)

| # | Nâng cấp | Hiện trạng | Đề xuất |
|---|----------|------------|---------|
| A1 | **Prompt registry versioning** | prompt files | Bảng `prompt_versions` hoặc manifest + bắt buộc ghi `prompt_version` vào `ai_runs` |
| A2 | **Jailbreak / injection tests** | Eval FAQ | Thêm adversarial cases vào `tests/eval` |
| A3 | **Human approval policies** | auto_confirm flag | Policy engine: max order value AI được tạo draft; trên ngưỡng → luôn draft + notify |
| A4 | **Model allowlist** | Gemini default | Env allowlist model IDs; cấm model lạ |
| A5 | **Shadow mode** (Opt) | Chưa | AI đề xuất nhưng không gửi Meta — so sánh với CSKH (Phase 1.5) |

### 3.6 API & product packaging

| # | Nâng cấp | Hiện trạng | Đề xuất |
|---|----------|------------|---------|
| P1 | **API versioning policy** | `/v1` | Sunset policy: tối thiểu 6 tháng khi `/v2` |
| P2 | **Public webhook cho khách** | Phase 3 | Giữ stub `webhooks_outbound` table sớm (additive) |
| P3 | **Entitlements versioning** | flat columns | `entitlements_json` + `version` để thêm limit không migration mỗi lần |
| P4 | **Changelog / release notes** | Chưa | `CHANGELOG.md` Keep-a-Changelog từ release đầu |
| P5 | **Feature flag kill-switch toàn cục** | flags per org | Global `kill_ai_outbound` cho incident |

### 3.7 Engineering process

| # | Nâng cấp | Hiện trạng | Đề xuất |
|---|----------|------------|---------|
| E1 | **CODEOWNERS** | Chưa | Bắt buộc review `supabase/migrations/**`, `apps/ai/**` |
| E2 | **ADR folder** | ADR rải specs | `docs/adr/NNNN-title.md` cho mọi quyết định sau này |
| E3 | **Branch protection** | Nhắc CI | Rules: main + required checks + no force push |
| E4 | **SBOM** | Chưa | Generate SBOM trên release (khi có khách enterprise) |
| E5 | **Load test baseline** | Chưa | k6 script: 50 webhook/s staging (sau always-on) |

---

## 4. Nâng khi *có khách* / Year 1–2 (tốn tiền hoặc chứng nhận)

| # | Hạng mục | Vì sao đợi |
|---|----------|------------|
| C1 | Supabase **Pro** + PITR | Free không đủ DR enterprise |
| C2 | Host **always-on** + autoscale | Cold start phá webhook |
| C3 | LLM paid + spend caps + failover vendor | Free tier không SLA |
| C4 | Log/APM tập trung (Grafana/Datadog/Axiom) | Cần khi >1 eng on-call |
| C5 | WAF + bot protection cứng | Attack surface tăng khi public |
| C6 | **SSO/SAML** gói Enterprise | Khách chuỗi đòi |
| C7 | **SOC 2** evidence collection | 12–18 tháng; bắt đầu control sớm (audit, access log) là đủ năm 1 |
| C8 | DPA ký + subprocessors list công khai | Bán B2B |
| C9 | Status page + incident comms | Trust |
| C10 | Multi-AZ / multi-region | Chỉ khi SLA hợp đồng |
| C11 | Dedicated VPC / private AI | Khách regulated |
| C12 | Pen-test bên thứ ba | Trước round enterprise lớn |

---

## 5. *Không* nên nâng chỉ để “nghe enterprise” (tránh over-engineering)

| Ý tưởng | Vì sao **không** làm trước khi có PMF |
|---------|--------------------------------------|
| 10+ microservices | Ops giết team nhỏ |
| Kafka thay Inngest năm 1 | Phức tạp không cần |
| Service mesh (Istio…) | Không ROI |
| Tự host LLM GPU ngay | Chi phí + ops |
| Full ERP/HR/payroll | Lệch ICP |
| i18n đa ngôn ngữ | Đã khóa VI-only Phase 1 |
| Event sourcing toàn phần | Học phí cao, ít lợi sớm |
| Cloudflare Pages + OpenNext bắt buộc | Đã chủ đích tránh risk |

---

## 6. Ma trận ưu tiên nếu muốn “chắc hơn nữa” trước code

### Tier A — Nên khóa vào spec *trước Plan A* (1–2 ngày docs)

1. Permission matrix (S1)  
2. Data classification + retention (D1, D2)  
3. PII redaction in logs (D3)  
4. Outbox pattern hoặc ít nhất “enqueue in same TX” rule (R5)  
5. Traceparent + AI quality metrics skeleton (O1, O3)  
6. Prompt version bắt buộc + model allowlist (A1, A4)  
7. Global kill-switch flag (P5)  
8. CODEOWNERS + ADR folder (E1, E2)  
9. Threat model 1 trang (S6)  
10. RPO/RTO targets (D4)

### Tier B — Làm trong Plan A/B (code), không chỉ docs

- Security headers, dependabot, idempotency-key middleware  
- Runbooks trong repo  
- Eval adversarial set  
- Order value policy cho AI draft  

### Tier C — Sau khách trả phí

- Toàn bộ mục §4  

---

## 7. Điểm “enterprise” theo thang 0–100 (ước lượng)

| Hạng mục | Hiện tại (spec) | Sau Tier A+B | Sau Tier C (năm 1–2) |
|----------|-----------------|--------------|----------------------|
| Architecture & modularity | 85 | 90 | 92 |
| Multi-tenant security | 80 | 90 | 95 |
| Reliability/SRE | 65 | 80 | 92 |
| Observability | 55 | 75 | 90 |
| AI governance | 70 | 85 | 92 |
| Compliance/legal ops | 50 | 70 | 90 |
| Commercial packaging | 60 | 75 | 90 |
| **Tổng thể Phase-1-ready enterprise** | **~70** | **~82** | **~92** |

**70 → đủ để không viết lại khung.**  
**82 → đủ tự tin onboard pilot có kiểm soát.**  
**92 → gần procurement enterprise lớn — vẫn chưa phải official 100/100 (chỉ M4).**

---

## 8. Quyết định hướng (cập nhật)

**Đã chọn best path (2026-07-24):** không tự nhận 100 ngay; đi **M0→M4** theo [maturity scorecard](./2026-07-24-enterprise-maturity-scorecard-to-100.md).

- Tier A = **M1** (đã khóa vào scorecard + structure §0b)  
- Tier B = **M2** (bắt buộc trong Plan A)  
- Tier C = **M3/M4** (khi có khách → procurement 100)  

Câu hỏi A/B/C trước đây: trả lời = **A (khóa Tier A) + B (Tier A/B trong plan)** kết hợp — không phải C lẻ tẻ.
