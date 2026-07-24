# Coding gap analysis — lỗ hổng khi bắt tay code

**Date:** 2026-07-24  
**Status:** **CLOSED / SUPERSEDED** — blockers B1–B8 closed in design **§15** + [CANONICAL-LOCKED-DECISIONS](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md)  
**Scope:** Historical gap hunt (kept for audit trail)  
**Lens:** “Engineer opens repo Monday — what will block, thrash, or force rewrite?”  
**Companion:** Closed defaults → design **§15** · structure §11 · maturity M2  

> **Implementers:** Do **not** treat sections below as open debates. Use CANONICAL + design §15. Only residual opens: Render vs Fly vendor pick, Gemini model IDs + vector dims.

---

## Verdict (post-sync 2026-07-24)

**Blockers B1–B8 đã đóng.** Scaffold có thể bắt đầu theo structure §11 + maturity M2 hooks.  
Historical risks (CF Pages × Next, Inngest × Python, multi-org, ai_runs write path, cold start) → **đã có default locked**.

---

## Severity

| Sev | Nghĩa |
|-----|--------|
| **B** | Blocker — đoán sai = viết lại hoặc mất tuần |
| **H** | High — dễ bug production / race / bảo mật |
| **M** | Medium — chậm tiến độ hoặc nợ kỹ thuật |
| **L** | Low — có thể để plan/task sau |

---

## B — Blockers (đã đóng — giữ nguyên nội dung gốc bên dưới để audit)

**Resolution map → design §15 / CANONICAL:**

| ID | Resolution |
|----|------------|
| B1 CF Pages × Next | Web = Render Free Node Phase 1 |
| B2 Inngest × Python | Inngest only in `apps/api`; AI via HTTP |
| B3 ai_runs / RAG write | Core writes `ai_runs`; knowledge via org RPC/Core |
| B4 X-Org-Id | Required header |
| B5–B8 | See design §15 |

---

## Original gap text (historical)

<details>
<summary>Expand only for audit history</summary>

Spec đủ để **định hướng sản phẩm + topology**, nhưng **chưa đủ để code tuần 1 mà không đoán**. Có **~12 lỗ hổng blocker** (phải chốt trước/khi scaffold) và nhiều lỗ hổng nên chốt trong plan task đầu.

Nếu không đóng blockers: rủi ro cao nhất là (1) **Next.js × Cloudflare Pages**, (2) **Inngest × Python AI**, (3) **multi-org context**, (4) **ai_runs / RAG write path vs “AI không ghi DB”**, (5) **cold start webhook Meta trên free host**.

</details>

---

## B — Blockers detail (CLOSED)

### B1. Next.js trên Cloudflare Pages — **CLOSED** (Render Free)

| | |
|--|--|
| **Spec nói** | Web = Next.js App Router; host Free = Cloudflare Pages + “spike OpenNext” |
| **Lỗ hổng** | App Router + Node APIs + Supabase SSR + middleware thường **không** “drop-in” Pages. OpenNext/CF adapter có giới hạn; fail spike = đổi host giữa chừng. |
| **Hậu quả** | Mất 3–10 ngày; env/CI viết lại |
| **Đóng mặc định (đề xuất §15)** | Phase 1 Free-first: host **`apps/web` trên Render Free (Node)** giống api; Cloudflare Pages chỉ là Opt sau khi spike xanh. DNS/CDN vẫn Cloudflare. |

### B2. Inngest với AI Service Python — **CLOSED** (Inngest in api only)
### B3. `ai_runs` / `knowledge_chunks` — **CLOSED** (Core writes)
### B4. Multi-org: user thuộc nhiều shop — **CLOSED** (`X-Org-Id`)
### B5. Platform operator vs shop `owner` — **CLOSED** (`platform_admins` / `/ops`)
### B6. Meta webhook + cold start free host — **CLOSED** (verify→receipt→enqueue→200)
### B7. Package/monorepo tooling — **CLOSED** (pnpm + Turborepo + uv)
### B8. Mã hóa token Meta — **CLOSED** (AES-256-GCM)

---

<details>
<summary>Original B2–B8 gap writeups (audit history)</summary>

### B2. Inngest với AI Service Python — ai chạy function?

| | |
|--|--|
| **Spec nói** | Jobs = Inngest; “AI consumes AI jobs” |
| **Lỗ hổng** | Inngest SDK mạnh nhất ở **TypeScript**. Spec không nói Python có phải đăng ký Inngest function hay không. |
| **Hậu quả** | Dual runtime Inngest phức tạp; hoặc AI không nhận được job |
| **Đóng mặc định (§15)** | **Mọi Inngest function chạy trong `apps/api` (TS).** Step gọi `apps/ai` qua HTTP m2m (`POST /internal/v1/process-message`). Python **không** cần Inngest SDK Phase 1. |

### B3. `ai_runs` / `knowledge_chunks` — AI ghi DB thế nào?

| | |
|--|--|
| **Spec nói** | AI không bypass Core cho orders; AI embeds vào `knowledge_chunks`; AI writes `ai_runs` |
| **Lỗ hổng** | Mâu thuẫn nhẹ: “không ghi DB tay” vs embed/ai_runs cần persistence |
| **Hậu quả** | Service role rộng trên AI = rủi ro tenant; hoặc AI không lưu audit |
| **Đóng mặc định (§15)** | AI **được** dùng DB role hạn chế **chỉ** cho `knowledge_chunks` + optional read RPC **hoặc** gửi embed/ai_runs qua Core internal APIs. **Khuyến nghị Phase 1:** Core owns writes to `ai_runs`; AI returns run payload in HTTP response / callback; AI may write `knowledge_chunks` via **org-scoped RPC** only. |

### B4. Multi-org: user thuộc nhiều shop — chọn org nào?

| | |
|--|--|
| **Spec nói** | `memberships` nhiều org; RLS theo org |
| **Lỗ hổng** | Không có `X-Org-Id` / active org session / switcher |
| **Hậu quả** | Bug lộ data hoặc API không biết tenant |
| **Đóng mặc định (§15)** | Mọi request Core (trừ auth bootstrap) bắt buộc header **`X-Org-Id`**; Core verify membership; web lưu active org. |

### B5. Platform operator (SaaS admin) vs shop `owner`

| | |
|--|--|
| **Spec nói** | Admin-ops suspend org — roles chỉ owner/cskh/kho |
| **Lỗ hổng** | Ai được vào operator console? Thiếu `platform_admins` |
| **Hậu quả** | Dùng owner đầu tiên làm superadmin = lỗ bảo mật |
| **Đóng mặc định (§15)** | Bảng `platform_admins(user_id)`; chỉ họ gọi `/ops/v1/*`. Seed bằng env `PLATFORM_ADMIN_EMAILS`. |

### B6. Meta webhook + cold start free host

| | |
|--|--|
| **Spec nói** | Verify + enqueue; Render Free spin-down |
| **Lỗ hổng** | Nếu **cả process Nest** cold-start > Meta timeout, mất event trước khi enqueue |
| **Hậu quả** | “Bot không trả lời” khó debug |
| **Đóng mặc định (§15)** | Webhook handler: verify → insert `webhook_receipts` → enqueue Inngest → **200 ngay**. Pre-customer: cron keep-warm **hoặc** chấp nhận miss + Meta retry; **trước khách thật** must always-on. Document ngrok/cloudflare tunnel for local. |

### B7. Package/monorepo tooling chưa chọn

| | |
|--|--|
| **Lỗ hổng** | pnpm/npm/yarn? turbo/nx? Python poetry/uv/pip? |
| **Đóng (§15)** | **pnpm** + **Turborepo**; Python **uv**; Node **20 LTS**; Python **3.12**. |

### B8. Mã hóa token Meta — thuật toán & key

| | |
|--|--|
| **Lỗ hổng** | “Encrypted” không nói AES-GCM, key length, rotation |
| **Đóng (§15)** | AES-256-GCM; env `TOKEN_ENCRYPTION_KEY` (32-byte base64); rotation = re-encrypt job (Phase 1: single key OK). |

</details>

---

## H — High (dễ bug / race / policy Meta)

### H1. Stock trừ khi nào?

Draft → confirm → ship: trừ kho lúc nào? Race 2 đơn cùng SKU.  
**Đóng (§15):** Trừ **available stock khi `confirmed`**; hoàn stock nếu `cancelled` trước `shipped`. Draft không trừ.

### H2. Job AI đang chạy khi takeover

CSKH pause bot nhưng Inngest vẫn gửi reply.  
**Đóng (§15):** `conversations.bot_epoch` ++; job mang `bot_epoch`; trước send Meta, Core so khớp — lệch thì drop.

### H3. Tool `createDraftOrder` gọi 2 lần (LLM retry)

**Đóng (§15):** Idempotency key = `conversation_id + client_order_key` (AI sinh UUID/run id); unique partial index.

### H4. Cửa sổ 24h Messaging Meta

Ngoài cửa sổ gửi bị reject.  
**Đóng (§15):** Trước `meta.send`, Core check; nếu ngoài window → lưu outbound failed + escalate inbox (không crash job vô hạn).

### H5. Tin nhắn ảnh/voice/sticker

**Đóng (§15):** Phase 1: lưu `messages.raw_type` + attachment URL nếu có; AI **chỉ text** — trả lời VI: “Anh/chị nhắn chữ giúp shop nhé.”

### H6. Gemini embed dimension ↔ pgvector

Sai dimension = migration đau.  
**Đóng (§15):** Chốt model embed trong env; cột `vector(N)` đúng N; documented in migration comment. (Model ID cụ thể = task đầu AI.)

### H7. Currency / tiền

**Đóng (§15):** **VND integer** (đồng), không số thập phân; `BIGINT` cho money fields.

### H8. Timezone giờ làm việc AI

**Đóng (§15):** Default timezone column `organizations.timezone = Asia/Ho_Chi_Minh` (không nhét vào `settings_json`).

### H9. Phone / address

**Đóng (§15):** Phone lưu **E.164** (`+84…`); address = free-text + optional structured JSON Phase 1 (không bắt buộc API tỉnh thành).

### H10. Concurrent CSKH cùng conversation

**Đóng (§15):** `assignee_user_id`; takeover gán assignee; người khác vẫn đọc được, gửi được (Phase 1 không lock cứng — tránh overbuild).

---

## M — Medium (chậm hoặc nợ)

| ID | Gap | Gợi ý |
|----|-----|--------|
| M1 | CORS / cookie vs Bearer | Web → API: Bearer Supabase JWT; CORS allow web origin env |
| M2 | Invite member flow (pending, expiry) | `membership_invites` table; email Resend |
| M3 | Page vs IG thread identity | `contacts` có cả `page_scoped_id` + `ig_scoped_id`; conversation có `channel` enum |
| M4 | Local Meta webhook URL | Dev: Cloudflare Tunnel hoặc ngrok; doc in README |
| M5 | CI secrets / mock Gemini & Meta | Contract tests + recorded fixtures; no live Meta in CI |
| M6 | Deploy order migrations | CI: supabase db push staging → deploy api/ai/web |
| M7 | OpenAPI: Nest Swagger generate → `packages/contracts` | Python httpx client from OpenAPI |
| M8 | Realtime inbox | Phase 1: poll 3–5s hoặc Realtime trên `messages` với RLS; ưu tiên poll để đơn giản |
| M9 | Feature flag storage | DB `feature_flags` + in-memory cache TTL 30s |
| M10 | Entitlement seed | Plan `free_dev`: 1 page, N tokens; `starter`… |
| M11 | Export Excel lib | API: ExcelJS or similar; PDF optional Phase 1b |
| M12 | Sentry DSN per service | 3 projects |
| M13 | Health endpoints | `/health` + `/ready` trên api & ai |
| M14 | Idempotent Meta send | store `outbound_message_id` |
| M15 | Soft delete products vs RAG stale chunks | reindex deletes old chunks by `source_id` |

---

## L — Low / có thể để sau trong plan

- Formal brand name VI  
- SSO/SAML  
- Full tỉnh-huyện-xã dataset  
- Secondary LLM  
- Status page  
- Doppler  

---

## Mâu thuẫn / mơ hồ còn sót (sau audit trước)

| Chủ đề | Trạng thái |
|--------|------------|
| RAG write vs no-DB | Đóng bằng §15 (B3) |
| Inngest × Python | Đóng bằng §15 (B2) |
| CF Pages × Next | Đóng bằng §15 (B1) — web Render Free Phase 1 |
| Admin-ops identity | Đóng bằng §15 (B5) |
| Jobs vendor | Inngest — OK |
| Free-first | OK — nhưng B6 cold start phải tuân thủ |

---

## Checklist trước dòng code đầu tiên

- [ ] Đọc design **§15 Pre-code defaults**  
- [ ] Chọn Render **hoặc** Fly cho api+ai+web (cùng vendor giảm ops)  
- [ ] Tạo 2 Supabase projects + bật pgvector  
- [ ] Quyết định Gemini chat + embed model IDs (ghi `.env.example`)  
- [ ] Meta App + Page + IG test + tunnel local  
- [ ] pnpm/turbo/uv scaffold theo charter  
- [ ] Không bắt đầu Catalog/UI trước isolation tests + org header  

---

## Recommendation for implementation plan structure

Vì scope lớn, **không** nên một plan 200 task. Chia:

1. **Plan A — Platform foundation** (scaffold, RLS, authz, org header, ops admin, Inngest stub, health)  
2. **Plan B — Channels Meta** (OAuth, webhook, inbox persistence)  
3. **Plan C — Catalog + knowledge + AI loop**  
4. **Plan D — Orders + export + dashboard VI**  

Mỗi plan ship được + test được độc lập.

---

## Approval

**CLOSED.** Blockers resolved in design §15 + CANONICAL. Residual: Gemini model IDs, Render vs Fly — first Plan A tasks.
