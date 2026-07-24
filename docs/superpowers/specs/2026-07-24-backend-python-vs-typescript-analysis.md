# Phân tích: Tách Backend Python + Frontend riêng?

**Date:** 2026-07-24  
**Context:** Dự án lớn, lâu dài, Enterprise-Grade. **Quyết định cuối: Option C đã khóa** (FE Next.js + Core NestJS/TS + AI FastAPI/Python + Supabase).  
**Vai trò tài liệu:** ADR / phân tích lịch sử — không còn để chọn A/B/C.

---

## 1. Kết luận tư vấn (đọc trước)

| Câu hỏi | Trả lời ngắn |
|---------|----------------|
| Công ty lớn có tách FE/BE không? | **Có** |
| Đã chốt cho dự án này? | **C — FE + Core API + AI Service Python** (2026-07-24) |
| Core API ngôn ngữ? | **TypeScript / NestJS** (không phải Python toàn bộ) |
| AI Service? | **Python / FastAPI** — process & deploy riêng từ scaffold |
| “Tốc độ” đến từ đâu? | Queue, scale AI/Core riêng, DB — không từ “đổi hết sang Python” |

**Trạng thái:** Option **C đã khóa** trong design + foundation charter. Không còn là “đích mơ hồ A→C”; scaffold **ba deployable từ commit đầu**.

Chi tiết vận hành: [**CANONICAL**](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [design §3](./2026-07-24-omni-commerce-ai-saas-design.md) · [charter](./2026-07-24-enterprise-engineering-foundation-charter.md).

> Historical A/B sections below are **ADR context only**. Do not scaffold Option A.

---

## 1b. Quyết định đã khóa (C)

| Deployable | Stack | Vai trò |
|------------|-------|---------|
| `apps/web` | Next.js + TS | UI tiếng Việt |
| `apps/api` | NestJS + TS | Tenant, Meta, catalog, inbox, orders, jobs producer |
| `apps/ai` | FastAPI + Python | RAG, LLM, embed, eval |
| Supabase | Postgres+RLS+Storage+Auth | Data platform |

**Luồng:** Meta webhook → Core → enqueue → AI → tool gọi Core (tạo đơn) → Core gửi tin Meta.

---

## 2. “Tốc độ xử lý” — làm rõ trước khi đổi stack

| Loại tốc độ | Nghẽn thật | Đổi sang Python có giúp? |
|-------------|------------|---------------------------|
| Latency trả lời AI cho khách | LLM inference + RAG retrieve + tool DB | Không đáng kể (ms ngôn ngữ << giây LLM) |
| Webhook Meta burst (spam inbox) | Queue, idempotency, horizontal workers | **Kiến trúc** giúp; Go/Java thường tốt hơn Python nếu CPU-bound thuần |
| Truy vấn đơn / dashboard | Index Postgres, RLS design, caching | Không phụ thuộc Python |
| Embed hàng nghìn SP | Batch job, GPU/API embed | Service worker; Python tiện ecosystem |
| Throughput API CRUD | Framework + connection pool + scale-out | Node/Go/Java đều đủ nếu thiết kế đúng |

**Kết luận kỹ thuật:** Ưu tiên tốc độ = **async jobs, scale workers, DB/index, cache, CDN, giới hạn LLM**, không phải “backend phải là Python”.

---

## 3. Công ty lớn thường tổ chức thế nào?

### 3.1 Tách theo lớp (luôn có)

```
[Web / Mobile clients]
        │ HTTPS / BFF
        ▼
[API Gateway / BFF]
        │
        ├── Identity / Tenant service
        ├── Channel / Messaging service   ← Meta webhooks
        ├── Catalog / Commerce / Orders
        ├── AI Orchestration service      ← RAG, tools, LLM
        ├── Billing / Entitlements
        └── Admin / Audit
        │
        ▼
[Postgres / Queue / Object storage / Secrets]
```

FE **không** gọi thẳng DB production bằng service role.  
Webhook Meta **không** chạy logic nặng trong HTTP request — chỉ verify + enqueue.

### 3.2 Polyglot có chủ đích (không “một ngôn ngữ cho tất cả”)

| Domain | Ngôn ngữ hay gặp ở công ty lớn | Lý do |
|--------|--------------------------------|-------|
| Web UI | TypeScript (React/Next) | Ecosystem FE |
| OMS / Order / Billing lõi | Java, Kotlin, Go, C# | Strong typing, throughput, hiring, maturity |
| Realtime messaging gateway | Go, Java, Node | Concurrent connections |
| AI / ML / RAG / ranking | **Python** | PyTorch, eval, notebooks, data libs |
| Data pipeline | Python, Java, Scala | Batch/stream |
| Edge/BFF | Node/TS hoặc Go | Gần FE |

**Mẫu phổ biến nhất với sản phẩm “chat + AI + commerce”:**

- FE: TypeScript  
- Core API: Go/Java/Kotlin **hoặc** Node  
- AI worker: **Python**  
- Queue: Kafka/SQS/PubSub/Rabbit  
- DB: Postgres (đôi khi tách read replica)

Họ **không** chọn Python vì “nhanh hơn TypeScript”; họ chọn Python vì **năng suất AI/data**.

### 3.3 Họ không làm gì ở năm đầu nếu team nhỏ

- 15 microservices từ tuần 1  
- Viết lại 3 lần stack cho “chuẩn Big Tech”  
- Python monolith + FE tách nhưng **không có** module boundary / contract / queue  

Công ty lớn đạt được độ bền nhờ **hợp đồng API, ownership, SLO, platform team** — không nhờ tên ngôn ngữ.

---

## 4. Ba phương án cho dự án của bạn

### Phương án A — Modular monolith TypeScript (đã loại làm đích)

```
Next.js UI + TS modules + Supabase + workers TS
```

| Ưu | Nhược |
|----|--------|
| Một hiring profile | AI ecosystem kém Python |
| Ít ops hơn | Không khớp quyết định C đã khóa |

**Trạng thái:** Không dùng làm runtime đích. Chỉ tham khảo lịch sử.

**Phù hợp khi:** team fullstack TS, ưu tiên ra Sellable Core vững trong 4–8 tháng.

### Phương án B — FE TypeScript + Backend Python (FastAPI) toàn bộ

```
Next.js ──REST/GraphQL── FastAPI ── Supabase/Postgres
                              └── Celery/RQ workers
```

| Ưu | Nhược |
|----|--------|
| Một backend language; AI + API cùng repo Python | Mất đồng bộ type FE↔BE trừ khi có OpenAPI codegen |
| Hiring AI eng dễ hơn | Webhook/order throughput: Python cần cẩn thận (async, workers) |
| Tách FE/BE “sạch” | Hai hệ CI/CD, auth cookie/JWT bridge phức tạp hơn monolith |
| | Phải **đổi spec đã khóa** (TS backend) |

**Phù hợp khi:** đội ngũ mạnh Python, AI là trọng tâm tuyệt đối, chấp nhận chậm hơn 1–2 tháng để dựng contract OpenAPI + auth.

### Phương án C — Giống công ty lớn (khuyến nghị dài hạn) — Polyglot có kiểm soát

```
Next.js (FE)
   │
   ├── Core API (TypeScript NestJS *hoặc* Go)  ← tenant, Meta, orders, billing
   │         │
   │         └── enqueue
   │
   └── AI Service (Python FastAPI)  ← RAG, LLM, eval, embed
             │
        Supabase Postgres + RLS + Storage + Queue
```

| Ưu | Nhược |
|----|--------|
| Đúng tư duy Big Tech: đúng tool đúng việc | Phức tạp hơn A (2 runtimes) |
| Core commerce ổn định; AI độc lập scale/deploy | Cần API contract + auth service-to-service sớm |
| Sau này thêm Shipping/Payment service không đụng AI | Cần kỷ luật module — đúng với charter enterprise của bạn |
| Tốc độ xử lý AI/webhook scale **từng service** | Chi phí eng cao hơn A |

**Phù hợp khi:** dự án lâu dài, Enterprise, muốn “chỉ xây thêm”, chấp nhận đầu tư foundation contract ngay từ đầu.

**Thứ tự triển khai (đã khóa C — không làm A rồi tách):**

1. **Foundation (tháng 1–3):** Scaffold **ba deployable** `web` + `api` + `ai` ngay từ commit #1 + `LlmProvider` + Inngest trong api (xem structure §11).  
2. **Khi AI pipeline nặng:** scale **replicas `apps/ai`** / queue depth — **không** viết lại orders/Meta.  
3. **Khi Core cần tách thêm:** extract domain workers từ Nest — FE không đổi.

Đây mới là “không sửa nhiều, chỉ xây thêm”.

> Đoạn A→C tuần tự trong bản ADR cũ **đã hủy** — không scaffold monolith rồi tách AI.

---

## 5. So sánh trực diện với mong muốn của bạn

| Mong muốn | Cách đáp ứng đúng |
|-----------|-------------------|
| Dự án lớn, lâu dài | Modular + contracts + polyglot *khi cần* (C), không monorepo hỗn loạn |
| Ưu tiên tốc độ xử lý | Queue, workers, DB, cache, scale AI service — không “đổi Python cho nhanh” |
| FE riêng | Có — Next.js app tách khỏi logic nặng (A đã gần; B/C rõ hơn) |
| Backend Python | Chỉ **nên bắt buộc** cho AI service; cả OMS bằng Python là lựa chọn team, không phải chuẩn Big Tech bắt buộc |
| Enterprise từ dòng đầu | Charter RLS/audit/jobs **giữ nguyên** dù chọn A/B/C |

---

## 6. Rủi ro nếu chọn sai

| Chọn | Rủi ro |
|------|--------|
| B toàn Python quá sớm, team chủ yếu TS | Chậm foundation SaaS/Meta; type drift FE↔BE |
| A mãi không tách AI khi đã nặng | Deploy AI làm rung core API; khó hiring ML |
| Microservices Python+Go+TS tuần 1 | Chết vì ops, chưa có khách |
| Đổi spec liên tục theo “ngôn ngữ nóng” | Phá nguyên tắc additive |

---

## 7. Quyết định cuối (đã khóa — không hỏi lại)

**Đã chọn: Phương án C từ commit đầu** (2026-07-24).

- `apps/web` Next.js/TS
- `apps/api` NestJS/TS
- `apps/ai` FastAPI/Python
- Supabase data platform
- Free-first vendors (xem external-services catalog)

Phương án A/B chỉ giữ trong ADR để giải thích *vì sao không chọn*.

## 8. Ảnh hưởng tài liệu

Design + charter + external-services đã cập nhật theo C + Free-first. ADR này không còn quyền đổi stack.

## 9. Tóm tắt một câu

Công ty lớn tách FE/BE và AI; dự án này **khóa C ngay từ đầu** (Core TS + AI Python), scale bằng queue/hosting/LLM — không bằng việc đổi hết sang Python.
