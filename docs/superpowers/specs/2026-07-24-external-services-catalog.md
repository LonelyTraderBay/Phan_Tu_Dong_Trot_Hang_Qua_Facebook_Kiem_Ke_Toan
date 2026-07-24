# Danh mục dịch vụ thuê ngoài (External Services)

**Date:** 2026-07-24 · **Sync:** aligned with [CANONICAL-LOCKED-DECISIONS](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md)  
**Product:** Omni-Commerce AI SaaS — Topology C (Next.js + NestJS + FastAPI + Supabase)  
**Mục đích:** Liệt kê mọi thứ cần **thuê / đăng ký / trả phí bên thứ ba** trước và trong quá trình vận hành. Không gồm máy dev cá nhân.  
**Chính sách chi phí (đã chốt 2026-07-24):** **Free-first** — dùng gói miễn phí / free tier cho đến khi có khách hàng; khi có khách (hoặc vượt ngưỡng vận hành) mới nâng gói trả phí. Xem **§0**.  
**Host web Phase 1:** **Render Free (Node)** — không Cloudflare Pages.

**Chú thích mức độ**

| Tag | Nghĩa |
|-----|--------|
| **P0** | Bắt buộc để dựng & chạy Phase 1 (Sellable Core) |
| **P1** | Rất nên có trước khi onboard khách trả phí |
| **P2** | Phase 2+ hoặc khi scale / gói Enterprise |
| **Opt** | Tùy chọn / có thể tự host thay thế |
| **Free→Paid** | Bắt đầu free tier; có đường nâng cấp rõ |

---

## 0. Chính sách Free-first (đã chốt)

### 0.1 Nguyên tắc

1. **Trước khi có khách hàng thật:** ưu tiên **100% gói miễn phí** (free tier / hobby / trial credit) cho mọi dịch vụ có lựa chọn.  
2. **Khi có khách hàng** (ký pilot / trả phí / onboard shop production có traffic thật): nâng các dịch vụ **critical path** lên gói trả phí theo bảng §0.3.  
3. Architecture **không phụ thuộc** tính năng chỉ có ở gói Pro (tránh lock-in “phải trả tiền mới chạy được RLS/jobs”).  
4. Vẫn giữ **staging ≠ production** (2 project Supabase) — cả hai có thể ở Free lúc đầu; chấp nhận giới hạn pause/cold start.  
5. **Ngoại lệ gần như bắt buộc có phí nhỏ:** tên miền (domain) ~ vài trăm nghìn VND/năm. Có thể tạm dùng subdomain free (`*.onrender.com` / Fly) **chỉ khi chưa public thương hiệu**.

### 0.2 Bộ vendor Free-first đã chốt (pre-customer)

| Nhu cầu | Vendor + gói free | Ghi chú / giới hạn cần biết |
|---------|-------------------|-----------------------------|
| DB / Auth / Storage | **Supabase Free** × 2 project (staging + prod) | Project có thể **pause** khi idle; không PITR; giới hạn dung lượng/egress |
| Git + CI | **GitHub Free** + Actions free minutes | Đủ monorepo private cho team nhỏ |
| `apps/web` | **Render Free** (Node Next.js) | CF Pages **không** dùng Phase 1 critical path (adapter risk); DNS vẫn Cloudflare |
| `apps/api` + `apps/ai` | **Render Free** *hoặc* **Fly.io** free allowance | Một vendor cho web+api+ai; spin-down → cold start |
| DNS / TLS / WAF cơ bản | **Cloudflare Free** | Proxy + TLS; domain mua riêng |
| Domain | Mua rẻ (Cloudflare Registrar / nhà VN) **hoặc** tạm `*.onrender.com` | Khi có khách: domain riêng bắt buộc (Meta App Review / brand) |
| Meta API | **Meta Developer** — không thu phí message API kiểu SMS | Miễn phí đăng ký; “phí” = thời gian App Review |
| LLM + embed | **Google Gemini (AI Studio) Free tier** làm mặc định pre-customer | Có rate limit; **không** dùng cho nhiều shop production |
| LLM dự phòng (Opt) | **Groq** free tier / trial OpenAI credits | Chỉ dev/eval |
| Jobs | **Inngest Free** | Đủ webhook/AI async lúc đầu; nâng Inngest paid khi throughput tăng |
| Email | **Resend Free** (hoặc Brevo Free) | Hạn mức gửi/ngày; verify domain khi có domain |
| Errors | **Sentry Developer Free** | Quota event/tháng |
| Uptime | **UptimeRobot Free** | 5-min interval |
| Secrets | Env vars trên Render/CF + Supabase | Doppler trả phí → để sau |
| Logs tập trung | Log platform free tier **hoặc** chỉ log native PaaS lúc đầu | Axiom/Better Stack nâng khi có khách |

**Không dùng pre-customer (trả phí):** Datadog full, Supabase Pro, Vercel Pro, Railway paid, Azure OpenAI, Statuspage trả phí, helpdesk Zendesk trả phí.

### 0.3 Khi nào bắt buộc nâng lên trả phí

Nâng **ngay** khi xảy ra **một** trong các điều:

| Điều kiện | Nâng gì trước |
|-----------|----------------|
| Có **khách hàng / shop production** đầu tiên dùng thật | Supabase **Pro** (prod), hosting api/ai **không spin-down** (Render paid / Fly paid / Cloud Run), domain riêng |
| Meta App Review / onboard tự phục vụ | Domain + Privacy/Terms URL ổn định; API không cold-start quá lâu |
| Webhook Meta bị miss vì cold start | Hosting api + worker luôn-on (paid) |
| LLM free hết quota / cần ổn định | OpenAI/Anthropic/Gemini **billing** + spending cap |
| Cần backup/PITR, không chấp nhận pause DB | Supabase Pro (prod; staging có thể free lâu hơn) |
| > vài shop hoặc SLA trong hợp đồng | Sentry team+, uptime tốt hơn, email deliverability (Postmark/Resend paid) |

### 0.4 Rủi ro chấp nhận ở giai đoạn free

| Rủi ro | Mức | Mitigation |
|--------|-----|------------|
| Cold start API/AI (Render free) | Cao với webhook | Health cron giữ ấm (nếu ToS cho phép) **hoặc** nâng paid trước khách thật |
| Supabase pause | Trung bình | Cron ping; nâng Pro khi có khách |
| LLM free rate-limit | Cao | Quota chặt trong app; 1–2 shop test thôi |
| Vercel Hobby ToS | Trung bình | Phase 1 dùng **Render Free Node** cho web — không Vercel Hobby |
| Mất data nếu chỉ Free | Trung bình | Export định kỳ; nâng Pro sớm khi có khách |

### 0.5 Ngân sách giai đoạn pre-customer (mục tiêu)

| Hạng mục | Mục tiêu |
|----------|----------|
| Cloud/PaaS/SaaS tools | **~$0/tháng** (trừ domain nếu mua) |
| Domain | ~$5–15/năm (khuyến nghị mua sớm cho Meta) |
| LLM | $0 trong free tier; bật billing chỉ khi test vượt quota có chủ đích |
| Khi có khách | Chấp nhận nhảy lên ~$50–150/tháng fixed + LLM usage |

## 1. Bản đồ nhanh theo Topology C

```
[Khách / Chủ shop]
       │
[DNS + CDN + TLS] ─────────────────────────────┐
       │                                       │
[apps/web — hosting]                           │
       │                                       │
[apps/api — hosting] ←── [Queue/Jobs] ←── [apps/ai — hosting]
       │                       │               │
       ├───────[Supabase: Auth, Postgres, Storage, Realtime]
       │
       ├──[Meta Graph / Webhooks]
       ├──[LLM + Embedding APIs]  (chủ yếu từ AI service)
       ├──[Email giao dịch]
       ├──[Error tracking / APM / Logs]
       └──[CI/CD + Artifact registry]
```

---

## 2. Nền tảng dữ liệu & Auth (P0)

### 2.1 Supabase (bắt buộc theo spec)

| Hạng mục | Chi tiết |
|----------|----------|
| **Dịch vụ** | [Supabase](https://supabase.com) |
| **Dùng cho** | Postgres + **RLS**, Auth, Storage, Realtime (tuỳ), pgvector |
| **Pre-customer (Free-first)** | **Free** × 2 project: staging + production |
| **Khi có khách** | Nâng **production → Pro**; staging có thể ở Free thêm một thời gian |
| **Giới hạn Free cần biết** | Pause khi idle; không PITR; cap DB/storage/egress |
| **Cấu hình thêm** | Custom SMTP (Resend free) khi có domain |

**Việc đăng ký:** MFA; không dùng 1 project cho cả staging lẫn prod.

---

## 3. Hosting / Compute cho 3 app (P0)

Bạn cần chỗ chạy **web**, **api**, **ai** (và worker nếu tách process).

### 3.1 Pre-customer (Free-first — đã chốt, sync với CANONICAL)

| Thành phần | Dịch vụ | Ghi chú |
|------------|---------|---------|
| `apps/web` | **Render Free (Node Next.js)** | **Không** dùng Cloudflare Pages Phase 1 (adapter risk). DNS/CDN: Cloudflare Free |
| `apps/api` | **Render Free** hoặc **Fly.io** free | Một vendor cho web+api+ai; cold start chấp nhận pre-customer |
| `apps/ai` | Cùng vendor với api (process riêng) | RAM ưu tiên hơn api |
| Workers / jobs | **Inngest** (functions trong `apps/api`) | Gọi AI qua HTTP m2m; không LLM trong HTTP webhook |

### 3.2 Khi có khách (upgrade) — maturity M3

| Thành phần | Hướng nâng |
|------------|------------|
| web + api + ai | **Always-on** paid (Render/Fly) hoặc Cloud Run |
| DB | Supabase **Pro** (production) + PITR |
| LLM | Gemini/OpenAI/Anthropic **billing** + spend cap |

### 3.3 Phương án cloud “công ty lớn” (P2 / M4+)

| Thành phần | AWS | GCP | Azure |
|------------|-----|-----|-------|
| Web | S3+CloudFront hoặc Amplify | Cloud Run / Firebase Hosting | Static Web Apps |
| API/AI | ECS/Fargate hoặc EKS | Cloud Run / GKE | Container Apps / AKS |
| Queue | SQS + worker | Pub/Sub | Service Bus |
| Secrets | Secrets Manager | Secret Manager | Key Vault |

Thiết kế 12-factor để sau chuyển Cloud Run/Fargate **không viết lại**.

### 3.4 Checklist thuê hosting P0

- [ ] Runtime **web** (production + staging) — Render Free Node  
- [ ] Runtime **api** (production + staging)  
- [ ] Runtime **ai** (production + staging)  
- [ ] HTTPS tự động  
- [ ] Inngest app connected  
- [ ] Log drain / Sentry  
- [ ] (Pre-customer) chấp nhận cold start; (M3) always-on  

---

## 4. Tên miền, DNS, TLS, Email DNS (P0)

| Hạng mục | Dịch vụ | Chi tiết |
|----------|---------|----------|
| **Domain** | Namecheap, GoDaddy, **Cloudflare Registrar**, Matbao/P.A Vietnam… | Ví dụ `yoursaas.vn` |
| **DNS** | **Cloudflare** (khuyến nghị) hoặc DNS nhà đăng ký | A/CNAME cho web/api; dễ proxy/CDN |
| **TLS** | Thường miễn phí (Let's Encrypt / Cloudflare / Vercel) | Không cần mua SSL riêng nếu PaaS lo |
| **Subdomain chuẩn** | `app.` web, `api.` Core, (nội bộ) AI không public hoặc `ai.` chỉ VPC/private | AI **không** expose public nếu không cần |
| **Email DNS** | SPF, DKIM, DMARC | Bắt buộc khi gửi mail Auth/onboarding |

**P0:** 1 domain production + (P1) staging subdomain `staging-app.`, `staging-api.`.

---

## 5. Meta / Facebook Platform (P0 — xương sống kênh)

| Hạng mục | Chi tiết |
|----------|----------|
| **Dịch vụ** | [Meta for Developers](https://developers.facebook.com) |
| **Cần tạo** | Meta App (type Business); sản phẩm **Messenger** + **Instagram** messaging |
| **Tài khoản liên quan** | Meta Business Suite / Business Manager; Facebook Page test + Instagram Professional gắn Page |
| **Phí Meta API** | Messaging API thông thường **không** tính phí theo message như SMS; chi phí là eng + App Review thời gian |
| **Webhook URL** | HTTPS public tới **Core API** (staging + prod riêng verify token) |
| **App Review** | Bắt buộc trước khi nhiều shop tự OAuth — chuẩn bị screencast, privacy policy URL, terms URL |
| **Quyền (permissions) điển hình** | `pages_messaging`, `pages_manage_metadata`, `pages_show_list`, `instagram_basic`, `instagram_manage_messages`, … (xác nhận theo docs mới nhất khi xin review) |
| **System User / token** | Lưu encrypted phía Core — không thuê thêm dịch vụ nhưng cần quy trình bảo mật |
| **P1** | Meta ** technologist / partner** không bắt buộc năm 1 |

**Chi phí ẩn:** thời gian App Review; Page/IG business assets; số điện thoại xác minh Business.

**Không thuê “tool inbox sẵn”** (ManyChat…) làm lõi — đã loại phương án B trước đó.

---

## 6. AI / LLM / Embedding (P0)

AI Service gọi nhà cung cấp bên ngoài (trừ khi tự host model — Opt/P2).

### 6.1 LLM (chat / tool calling) — chọn 1 chính + 1 dự phòng (P0 + P1)

| Nhà cung cấp | Vai trò | Ghi chú |
|--------------|---------|--------|
| **OpenAI** | LLM chính hoặc phụ | GPT models; API key billing |
| **Anthropic** | LLM chính hoặc phụ | Claude; mạnh instruction-following |
| **Google Gemini** | LLM / hoặc multimodal | Thanh toán Google AI Studio / Vertex |
| **OpenRouter** (Opt) | Router đa model | Tiện failover; thêm lớp phụ thuộc |
| **Azure OpenAI** (P2/Enterprise) | Compliance / hợp đồng lớn | Khi khách enterprise đòi |

**Cần thuê/trả:** billing account, spending limit, tách key **staging/prod**.

### 6.2 Embedding (RAG / pgvector) — P0

| Lựa chọn | Ghi chú |
|----------|---------|
| Embedding API cùng vendor LLM (OpenAI `text-embedding-3-*`, Gemini embedding…) | Đơn giản ops |
| Vendor riêng (Cohere, Voyage…) | Opt — chất lượng retrieve |

**Lưu ý:** chi phí embed tăng theo số SP × lần reindex; cần quota trong entitlements.

### 6.3 (Opt/P2) Self-host model

| Dịch vụ | Khi nào |
|---------|---------|
| **vLLM / Ollama** trên GPU cloud (RunPod, Lambda, AWS g5…) | Muốn giảm $/token hoặc data residency |
| **Vertex AI / Bedrock** | Gói managed model enterprise |

Năm 1: **API cloud LLM đủ**; giữ `LlmProvider` interface như charter.

---

## 7. Hàng đợi / Job durable (P0)

**LOCKED:** **Inngest** — functions chỉ trong `apps/api` (Nest/TS); AI gọi qua HTTP m2m. Không LLM trong HTTP webhook.

| Lựa chọn | Vai trò |
|----------|---------|
| **Inngest** | **Primary / locked** — Free-first |
| Trigger.dev / BullMQ+Redis / SQS / CF Queues | **Không** dùng Phase 1; chỉ xét khi ADR đổi Inngest |

**Nếu sau này đổi sang BullMQ:** phải thuê Redis (Upstash…) + ADR mới.

---

## 8. Quan sát lỗi, log, uptime (P0–P1)

| Dịch vụ | Mức | Dùng cho |
|---------|-----|----------|
| **Sentry** (hoặc GlitchTip self-host Opt) | P0 | Exception `web` + `api` + `ai` |
| **OpenTelemetry → Axiom / Grafana Cloud / Datadog / Better Stack** | P1 | Log + metrics + trace liên service |
| **Better Stack / Checkly / Pingdom / UptimeRobot** | P1 | Uptime `app` + `api` + webhook URL |
| **Statuspage** (Atlassian) hoặc **Instatus** | P2 | Trang trạng thái công khai cho khách Enterprise |
| **PostHog** / Mixpanel | P1/P2 | Product analytics (onboarding funnel) — cẩn thận PII |

**P0 tối thiểu:** Sentry (3 project/service) + uptime check cơ bản.

---

## 9. CI/CD & mã nguồn (P0)

| Hạng mục | Dịch vụ | Chi tiết |
|----------|---------|----------|
| **Git hosting** | **GitHub** (khuyến nghị) / GitLab | Private repo monorepo |
| **CI** | GitHub Actions (đi kèm) | Build/test `web`, `api`, `ai`; migrate check |
| **Container registry** | GHCR / Docker Hub / cloud registry | Khi deploy container |
| **Preview env** | Render preview / staging services + staging API | P1 |

**P0:** GitHub Team nếu cần SSO/permissions sớm (Opt năm 1: Free private đủ nếu team nhỏ).

---

## 10. Email giao dịch (P0)

Dùng cho: Supabase Auth (magic link/verify), mời thành viên, cảnh báo đơn, báo cáo ngày (sau).

| Nhà cung cấp | Ghi chú |
|--------------|---------|
| **Resend** | DX tốt với Next |
| **Postmark** | Deliverability mạnh |
| **Amazon SES** | Rẻ ở scale |
| **SendGrid** / Mailgun | Phổ biến |
| **Brevo** (ex-Sendinblue) | Có mặt VN/EU |

**P0:** 1 provider + domain verified (SPF/DKIM).  
**Không** dùng Gmail cá nhân cho production Auth.

---

## 11. Object storage ngoài Supabase? (thường không P0)

Supabase Storage đủ Phase 1.  

| Khi nào thuê thêm | Dịch vụ |
|-------------------|---------|
| CDN ảnh toàn cầu / chi phí lớn | **Cloudflare R2** + CDN, hoặc S3 |
| Backup file lạnh | S3 Glacier / R2 |

**Tag:** P2 trừ khi Storage Supabase không đủ.

---

## 12. Bí mật & bảo mật nâng cao (P1–P2)

| Hạng mục | Dịch vụ | Mức |
|----------|---------|-----|
| Secrets trên PaaS | Env vars + platform secrets | P0 |
| **Doppler** / **Infisical** / HashiCorp Vault | Quản lý secret đa env | P1 |
| **Supabase Vault** | Opt encrypt helper — **không** thay AES-256-GCM Phase 1 (Core `TOKEN_ENCRYPTION_KEY`) | Opt / P2 |
| WAF | Cloudflare WAF | P1 |
| Bot protection | Cloudflare Turnstile / hCaptcha trên login | P1 |
| MFA IdP | Google Workspace / Microsoft 365 cho team nội bộ | P1 |

---

## 13. Thanh toán thu tiền *SaaS của bạn* (billing khách thuê phần mềm) — P1/P2

Phase 1 có thể **plan flags + hóa đơn tay**; vẫn nên biết dịch vụ sẽ thuê:

| Thị trường | Dịch vụ |
|------------|---------|
| Việt Nam | **PayOS**, **SePay**, **VNPay** merchant, ngân hàng QR |
| Quốc tế | **Stripe** |
| Hóa đơn điện tử VN (sau) | MISA / Viettel / EasyInvoice… (P2/ERP) |

**P0:** chưa bắt buộc cổng — nhưng cần **entity pháp lý** xuất HĐ cho khách (công ty bạn).

---

## 14. Không phải Phase 1 kênh bán — để biết trước (P2)

| Dịch vụ | Khi nào |
|---------|---------|
| **GHN / GHTK / Viettel Post / SPX API** | Phase 2 fulfillment |
| **Cổng thanh toán đơn hàng khách cuối** (VietQR động…) | Khi bỏ “chỉ ghi nhận PTTT” |
| **Zalo OA API** | Thêm kênh |
| **Shopee / TikTok Shop Partner** | Thêm sàn |
| **Meta Marketing API** | Ads spend sync Phase 3 |

---

## 15. Pháp lý, compliance, doanh nghiệp (P0–P1 “mềm”)

Không phải “cloud API” nhưng **bắt buộc để bán Enterprise**:

| Hạng mục | Việc / dịch vụ |
|----------|----------------|
| **Công ty / MST** | Pháp nhân ký HĐ, xuất HĐ |
| **Hosting Privacy Policy + Terms** | URL public (Meta App Review đòi) — có thể host trên web |
| **DPA mẫu** | Luật sư / template PDPA |
| **Chữ ký HĐ điện tử** (Opt) | DocuSign / Viettel MySign… |
| **Kế toán / hóa đơn** | Phần mềm kế toán nội bộ công ty bạn |

---

## 16. Cộng tác nội bộ team (P1)

| Việc | Dịch vụ |
|------|---------|
| Chat nội bộ | Slack / Discord / Microsoft Teams |
| Tickets hỗ trợ khách | **Plain**, **Crisp**, **Zendesk**, **Freshdesk**, hoặc Facebook Page tạm |
| Design | Figma |
| Docs nội bộ | Notion / Outline |
| Password team | 1Password / Bitwarden |

---

## 17. Bảng tổng hợp “phải mở ví / đăng ký” trước khi code production

### 17.1 P0 — mở trước hoặc ngay tuần đầu

| # | Dịch vụ | Mục đích | Staging+Prod? |
|---|---------|----------|----------------|
| 1 | **Supabase Free** ×2 project | DB/Auth/Storage/RLS/pgvector | Có |
| 2 | **GitHub Free** | Source + CI | — |
| 3 | **Render Free** (Node Next.js) | `apps/web` | Có |
| 4 | **Render Free** hoặc **Fly.io** free | `apps/api` | Có |
| 5 | **Render/Fly** (cùng hoặc service riêng) | `apps/ai` | Có |
| 6 | **Domain + DNS** (Cloudflare Free) | `app` / `api` (domain phí nhỏ) | Prod; staging subdomain |
| 7 | **Meta Developer App** + Business + Page/IG test | Kênh | App riêng hoặc env riêng |
| 8 | **Gemini** (AI Studio Free) | Chat AI | Key tách env |
| 9 | **Gemini embedding** (cùng vendor Free) | RAG | Key tách env |
| 10 | **Inngest Free** | Webhook/AI async | Có |
| 11 | **Resend Free** | Auth, invite | Domain verify |
| 12 | **Sentry Free** | Crash reporting | Project theo service |

### 17.2 P1 — trước khách trả phí / App Review công khai

| # | Dịch vụ | Mục đích |
|---|---------|----------|
| 13 | Uptime monitoring | SLO / biết khi webhook chết |
| 14 | Log/APM tập trung | Debug đa service |
| 15 | Cloudflare WAF / proxy | Bảo vệ app/api |
| 16 | Captcha login | Chống spam đăng ký |
| 17 | Doppler/Infisical (Opt mạnh) | Secrets đa môi trường |
| 18 | Spending limits & billing alerts trên LLM + cloud | Tránh cháy tiền |
| 19 | Privacy Policy & Terms URL (host sẵn) | Meta + pháp lý |
| 20 | Hỗ trợ khách (Crisp/Zendesk…) | CSKH SaaS |

### 17.3 P2 — theo roadmap sản phẩm

| # | Dịch vụ | Mục đích |
|---|---------|----------|
| 21 | PayOS/Stripe… | Thu phí thuê bao SaaS |
| 22 | GHN/GHTK… | Giao hàng API |
| 23 | Status page | Enterprise trust |
| 24 | Datadog/Grafana full | Observability nặng |
| 25 | Azure OpenAI / Bedrock | Hợp đồng enterprise |
| 26 | Zalo/Shopee/TikTok partner | Đa kênh |
| 27 | Meta Marketing API | Ads/P&L |
| 28 | E-invoice provider | ERP-lite VN |

---

## 18. Ước lượng ngân sách ops tháng (tham khảo thô, USD, chưa gồm LLM usage)

| Hạng mục | Thấp (đầu) | Vừa (pilot 10 shop) |
|----------------------|---------------------|
| Supabase ×2 | ~$25–50 | ~$50–100+ |
| Hosting web+api+ai | ~$20–60 | ~$60–200 |
| Redis/Jobs managed | ~$0–30 | ~$30–80 |
| Email | ~$0–20 | ~$20–50 |
| Sentry | ~$0–26 | ~$26–80 |
| Domain/DNS | ~$1–15/năm + CF free | — |
| **Cố định xấp xỉ** | **~$70–200** | **~$200–500** |
| **LLM + embed (biến thiên)** | Có thể **vượt** cố định | Theo tin nhắn × shop — **cần hard limit** |

LLM là dòng **đắt và khó đoán** nhất — thiết kế quota theo gói từ ngày đầu (đã có trong charter).

---

## 19. Việc *không* cần thuê (tự làm / đã loại)

| Không thuê | Lý do |
|------------|--------|
| ManyChat / Respond.io làm lõi | Đã chọn Custom full |
| Chatbot Facebook cá nhân / tool vi phạm ToS | Rủi ro khóa tài khoản |
| SSL riêng nếu PaaS/Cloudflare lo | Trùng |
| DB Mongo riêng cho Phase 1 | Spec = Postgres Supabase |
| GPU cloud năm 1 | Trừ khi self-host model |

---

## 20. Thứ tự mở tài khoản thực tế (checklist)

1. Pháp nhân / thẻ thanh toán cloud  
2. GitHub org  
3. Domain + Cloudflare DNS  
4. Supabase staging + production  
5. Render Free (web + api + ai) — hoặc Fly cho cả ba  
6. Resend Free + verify domain (khi có domain)  
7. Sentry Free  
8. Inngest Free  
9. Gemini AI Studio Free (+ spending cap chỉ khi bật billing)  
10. Meta Developer + Business + Page/IG test  
11. (P1) Uptime + WAF  

---

## 21. Open decisions — ĐÃ CHỐT Free-first vendors

| Hạng mục | Pre-customer (free) | Upgrade khi có khách |
|----------|---------------------|----------------------|
| Hosting web | **Render Free** (Node) | Always-on / CF Pages later optional |
| Hosting api + ai | **Render Free** (hoặc Fly free allowance) | Render/Fly **paid always-on** hoặc Cloud Run |
| Jobs | **Inngest Free** | Inngest paid theo event |
| LLM mặc định | **Google Gemini (AI Studio) Free** | Gemini paid / thêm OpenAI hoặc Anthropic |
| Email | **Resend Free** (fallback Brevo Free) | Resend/Postmark paid |
| Errors | **Sentry Free** | Sentry Team |
| DB | **Supabase Free** ×2 | Supabase **Pro** (prod) |

Implementation plan sẽ dùng đúng cột **Pre-customer** trong env templates; có runbook “Upgrade when first customer”.

## 22. Approval ghi nhận

- **Free-first commercial policy** — locked 2026-07-24 theo yêu cầu chủ sản phẩm.
