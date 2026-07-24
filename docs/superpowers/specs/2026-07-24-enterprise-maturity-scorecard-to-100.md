# Enterprise Maturity Scorecard — đường tới 100/100

**Date:** 2026-07-24  
**Owner decision:** Đạt **100/100 Enterprise-Grade** theo lộ trình có cổng đo được — không tự nhận 100 khi còn Free-first / chưa pen-test / chưa SOC2.  
**Hướng đã chọn (best path):** **Khóa Tier A vào spec ngay → Plan A bắt buộc Tier B → Tier C khi có khách = cổng 100.**

**Related:** [**CANONICAL**](./2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [upgrade opportunities](./2026-07-24-enterprise-upgrade-opportunities.md) · [structure](./2026-07-24-enterprise-structure-and-data-architecture.md) · [design §15](./2026-07-24-omni-commerce-ai-saas-design.md)

---

## 1. Thực tế về “100/100”

| Nhầm | Đúng |
|------|------|
| Spec đẹp = 100 điểm | 100 = **chứng minh được** bằng control + infra + chứng nhận/hợp đồng |
| Free tier + Phase 1 hẹp = enterprise procurement | Procurement đòi Pro DB, always-on, DPA, thường SSO/SOC2/pen-test |
| Làm hết Tier C trước khi có khách | Đốt tiền/ops; vẫn chưa có bằng chứng vận hành thật |

**Định nghĩa 100/100 cho sản phẩm này (locked):**

> Đạt **tất cả cổng M0→M4** trong scorecard dưới đây.  
> Hiện tại (sau khi khóa Tier A docs): mục tiêu **M1 hoàn tất trên giấy** + sẵn sàng code **M2**.  
> **M4 = 100/100** — chỉ tuyên bố khi cổng M4 xanh.

---

## 2. Hướng tốt nhất đã chọn

```
M0 Foundation (đã có ~70) 
  → M1 Spec Hardening = Tier A LOCKED vào docs (làm ngay)
  → M2 Build Hardening = Tier B trong mọi Plan A/B (bắt buộc DoD)
  → M3 Pilot Enterprise = paid critical path + vận hành thật
  → M4 Procurement 100 = SSO path + SOC2-in-progress/pen-test + DPA + SLA
```

**Không chọn:** “Code hết SOC2/multi-region trước khi có khách” (over-engineer).  
**Không chọn:** “Bỏ Tier A, tính sau” (sẽ phải kiểm tra lại — trái yêu cầu của bạn).

---

## 3. Scorecard (trọng số → 100)

| Trụ | Trọng số | M0 nay | Sau M1 (Tier A docs) | Sau M2 (Tier B code) | Sau M3 (có khách) | Sau M4 (100) |
|-----|----------|--------|----------------------|----------------------|-------------------|--------------|
| Architecture & modularity | 12 | 10 | 11 | 11 | 12 | 12 |
| Multi-tenant security | 15 | 12 | 14 | 14 | 15 | 15 |
| Reliability / SRE | 12 | 7 | 9 | 10 | 11 | 12 |
| Observability | 10 | 5 | 7 | 8 | 9 | 10 |
| AI governance | 12 | 8 | 10 | 11 | 12 | 12 |
| Compliance / legal ops | 12 | 5 | 8 | 9 | 10 | 12 |
| Commercial packaging | 8 | 5 | 6 | 7 | 8 | 8 |
| Quality / SDLC | 10 | 7 | 8 | 9 | 10 | 10 |
| Infra maturity (paid DR) | 9 | 3 | 3 | 4 | 8 | 9 |
| **Tổng** | **100** | **~62–70*** | **~76** | **~83** | **~95** | **100** |

\*Dao động tùy cách chấm; sau structure+§15 ~70; bảng trên conservative.

---

## 4. Cổng bắt buộc từng mốc

### M0 — Foundation (DONE trên spec)

Topology C · structure doc · RLS model · §15 defaults · Free-first · charter.

### M1 — Spec Hardening (Tier A) — **KHÓA NGAY**

Phải có trong docs (file này + structure/charter bổ sung):

- [x] Permission matrix (S1) — xem §6 bên dưới  
- [x] Data classification + retention (D1/D2) — §7  
- [x] PII log redaction rules (D3) — §7  
- [x] RPO/RTO targets (D4) — §8  
- [x] Outbox / same-TX enqueue rule (R5) — §8  
- [x] Trace + AI metrics skeleton (O1/O3) — §9  
- [x] Prompt version + model allowlist (A1/A4) — §9  
- [x] Global kill-switch (P5) — §6  
- [x] Threat model 1-pager (S6) — §10  
- [x] CODEOWNERS + ADR policy (E1/E2) — §11  

### M2 — Build Hardening (Tier B) — **DoD của Plan Platform + mọi plan sau**

Code phải có:

- Security headers (web+api)  
- Dependabot / audit CI  
- `Idempotency-Key` cho POST tạo resource  
- Logger PII redaction  
- Transactional outbox **hoặc** enqueue trong cùng DB transaction với business write  
- `traceparent` api↔ai  
- `prompt_version` + model allowlist enforced  
- Feature flag `kill_ai_outbound`  
- Runbooks trong `docs/runbooks/`  
- Eval adversarial (jailbreak) tối thiểu 10 cases  
- AI draft max amount policy (settings)  

**Không merge Plan A nếu thiếu các mục trên (skeleton chấp nhận được, nhưng phải có hook).**

### M3 — Pilot Enterprise (khi có khách thật đầu tiên)

- Supabase **Pro** (prod) + PITR bật  
- Host **always-on** (hết cold start)  
- LLM billing + spend cap + secondary vendor cấu hình được  
- Uptime + on-call tối thiểu  
- Terms/Privacy/DPA mẫu dùng thật  
- Restore drill đã chạy 1 lần  
- Isolation + eval chạy trên staging định kỳ  

**Điểm mục tiêu: ~95.** Có thể bán pilot có kiểm soát.

### M4 — Procurement 100/100

- SSO/SAML path (implement hoặc calendar cam kết gói Enterprise ≤ 90 ngày)  
- SOC 2 Type I in progress **hoặc** equivalent control evidence pack  
- Pen-test bên thứ ba (hoặc remediations xong finding critical)  
- Status page + incident comms  
- Subprocessors list công khai  
- SLA hợp đồng (vd. 99.5%+) + support tier  
- SBOM trên release  
- Access review định kỳ (platform_admins)  

**Chỉ khi M4 xanh mới được marketing “100/100 Enterprise-Grade”.**

---

## 5. Lịch trình gợi ý (không bắt buộc ngày cứng)

| Mốc | Khi nào |
|-----|---------|
| M1 | Trước / cùng ngày khóa spec cuối (docs) |
| M2 | Trong Plan A (Platform) + gated mọi PR nền |
| M3 | Trước onboard khách #1 trả phí / pilot hợp đồng |
| M4 | 6–18 tháng sau M3 tùy ngân sách chứng nhận |

---

## 6. Permission matrix + kill-switch (M1)

### Roles → permissions (Phase 1)

| Permission | owner | cskh | kho | platform_admin |
|------------|:-----:|:----:|:---:|:--------------:|
| `org.settings.read` | ✓ | ✓ | ✓ | ✓ (any org) |
| `org.settings.write` | ✓ | — | — | ✓ |
| `members.invite` | ✓ | — | — | ✓ |
| `channels.connect` | ✓ | — | — | ✓ |
| `catalog.read` | ✓ | ✓ | ✓ | ✓ |
| `catalog.write` | ✓ | — | — | ✓ |
| `inbox.read` | ✓ | ✓ | ✓* | ✓ |
| `inbox.reply` | ✓ | ✓ | — | ✓ |
| `inbox.takeover` | ✓ | ✓ | — | ✓ |
| `orders.read` | ✓ | ✓ | ✓ | ✓ |
| `orders.write` | ✓ | ✓** | ✓ (status ship) | ✓ |
| `orders.approve` | ✓ | ✓** | — | ✓ |
| `orders.export` | ✓ | — | ✓ | ✓ |
| `ai.settings.write` | ✓ | — | — | ✓ |
| `ops.org.suspend` | — | — | — | ✓ |
| `ops.global_flags` | — | — | — | ✓ |

\*kho: chỉ conversation gắn đơn đang xử lý (enforce in Core).  
\*\*cskh approve/write orders: chỉ khi `org.settings.allow_cskh_approve` = true.

### Global kill-switches (`feature_flags` org_id NULL)

| Key | Effect |
|-----|--------|
| `kill_ai_outbound` | Không gửi tin AI ra Meta |
| `kill_ai_all` | Không chạy orchestrator (inbound chỉ lưu + escalate) |
| `kill_auto_confirm` | Ép mọi shop về draft-only |

---

## 7. Data classification + retention + PII logs (M1)

### Classification

| Class | Examples | Rules |
|-------|----------|-------|
| `secret` | `access_token_enc`, LLM keys, service keys | Never log; encrypt at rest |
| `pii` | `phone_e164`, `address_text`, customer name | Log redacted; export/delete supported |
| `internal` | order totals, sku, ai_runs citations | Staff only |
| `public` | product title on storefront (future) | OK |

### Retention defaults (`organizations.settings_json` overridable later)

| Data | Retain |
|------|--------|
| `messages` | 24 months then anonymize body |
| `ai_runs` | 12 months |
| `audit_logs` | 36 months |
| `usage_events` | 24 months |
| `job_dead_letters` | 90 days after resolved |

### Log redaction

Logger must scrub keys matching: `phone`, `address`, `token`, `authorization`, `cookie`, raw `body` containing E.164 patterns.

---

## 8. Reliability targets + outbox rule (M1)

### RPO/RTO

| Stage | RPO | RTO |
|-------|-----|-----|
| Pre-customer (Free) | ≤ 24h (best effort) | ≤ 24h |
| M3+ (Supabase Pro) | ≤ 1h | ≤ 4h |
| M4 contract optional | ≤ 15m | ≤ 1h |

### Write + job rule (R5)

Mọi business write kéo theo side-effect ngoài process (Inngest/Meta/AI):

1. **Preferred:** insert `outbox_events` **cùng transaction** với write → poller/Inngest publish.  
2. **Minimum M2:** nếu enqueue trực tiếp, phải trong cùng request handler sau commit thành công + DLQ + replay tooling.  

Bảng `outbox_events`: `id`, `org_id`, `event_name`, `payload_json`, `created_at`, `published_at`, `attempts`.

---

## 9. Observability + AI governance skeleton (M1→M2)

### Headers

- Propagate `X-Request-Id` and W3C `traceparent` across Core → Inngest → AI → Core tools.

### AI metrics (export later to any backend)

- `ai_grounded_rate`, `ai_escalate_rate`, `ai_cost_tokens_total`, `ai_outbound_blocked_killswitch`

### Prompt / model

- Every `ai_runs` row **requires** `prompt_version` + `model` in allowlist env `AI_MODEL_ALLOWLIST`.  
- Reject runtime if model not allowlisted.

---

## 10. Threat model (1 page) (M1)

| Threat | Mitigation (already / M2) |
|--------|---------------------------|
| Forged Meta webhook | Signature verify + `webhook_receipts` |
| Cross-tenant read | RLS + `X-Org-Id` membership + isolation tests |
| Stolen page token | AES-GCM enc + no client exposure + reauth status |
| Prompt injection | Guardrails + tool-only mutations + eval adversarial |
| LLM cost abuse | Entitlements quota + kill switches |
| Privilege escalation | platform_admins separate; permission matrix |
| Dependency CVE | audit/Dependabot CI |
| Secret in git | gitleaks + `.env` gitignore |

---

## 11. SDLC enterprise (M1)

- `CODEOWNERS`: `supabase/migrations/**`, `apps/ai/**`, `packages/contracts/**` require review  
- `docs/adr/` for decisions after this date (template required)  
- `main` protected: CI green required  

---

## 12. What we refuse to do for fake “100” early

- Claim SOC2 certified without audit  
- Multi-region active-active before revenue  
- 15 microservices  
- Self-host GPU LLM as Phase 1 requirement  

---

## 13. Next actions

1. **M1:** Tài liệu này = nguồn khóa Tier A (done).  
2. User **OK spec** → Plan A Platform với **M2 DoD bắt buộc**.  
3. Trước khách #1 → checklist M3.  
4. Trước bán enterprise lớn → checklist M4 = **100/100**.

---

## 14. Approval

Best path selected by product direction request (2026-07-24):  
**Scorecard M0→M4; M4 = official 100/100; do not market 100 before M4.**
