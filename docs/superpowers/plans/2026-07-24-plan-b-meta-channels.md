# Plan B — Meta Channels (Wave D) — Kế hoạch chi tiết từng bước

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shop kết nối Facebook Page + Instagram; webhook idempotent → inbox DB; token Meta AES-256-GCM — **không gọi LLM** trong plan này.

**Architecture:** Nest Core owns OAuth + crypto + webhook (`verify → webhook_receipts → outbox → 200`) → Inngest `meta/persist_inbound` ghi `contacts` / `conversations` / `messages`. Web VI tối thiểu “Kết nối kênh”. AI **không** được gọi.

**Tech Stack:** NestJS · Supabase · Inngest · Meta Graph + Webhooks · AES-256-GCM · Vitest · Next.js

**Depends on:** Plan A DONE (`main` @ `397601f`+)  
**Sau DoD B:** [Plan C](./2026-07-24-plan-c-catalog-ai.md)  
**Roadmap tổng:** [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md)  
**Playbook ưu tiên (đọc trước khi code):** [plan-b-priority-execution](./2026-07-24-plan-b-priority-execution.md)

---

## Thứ tự ưu tiên *trong* Plan B (không đảo)

| Ưu tiên | Task | Vì sao trước |
|--------:|------|----------------|
| **B0** | Task 1 Migration | Mọi API/job cần schema |
| **B1** | Task 2 Token crypto | OAuth không được lưu plaintext |
| **B2** | Task 3 Signature + env Meta | Webhook/OAuth phụ thuộc |
| **B3** | Task 4 OAuth connect | Có channel trước khi nhận tin |
| **B4** | Task 5 Webhook ingest | Critical path Meta → 200 |
| **B5** | Task 6 Persist job + inbox read | Tin vào DB + API đọc |
| **B6** | Task 7 Isolation | Không merge nếu lộ tenant |
| **B7** | Task 8 Web VI connect | UX tối thiểu |
| **B8** | Task 9 Docs/runbook/tunnel | Vận hành local + incident |
| **B9** | Task 10 DoD evidence | Đóng Plan B |

**Cấm nhảy:** Task 5 trước 1–3; Task 6 trước 5; Task 8 trước 4.

---

## Global Constraints

- Channels: **Facebook Page + Instagram only**
- Tokens: **AES-256-GCM**; key derive = `SHA-256(TOKEN_ENCRYPTION_KEY)` → 32 bytes; **never** gửi browser
- Webhook: verify → receipt → outbox → **200**; **no LLM**
- Inngest **chỉ** `apps/api`
- Shop API: JWT + `X-Org-Id`; webhook path **public** (skip JWT/Org)
- JSON **camelCase**; UI **Tiếng Việt**
- RLS: member **SELECT** org rows; writes privileged qua **service role** (pattern Plan A harden)
- Event names: outbox `meta.inbound` → Inngest event `meta/persist_inbound`

---

## Plan B Definition of Done

- [ ] Migration inbox/channels/receipts + RLS  
- [ ] Crypto tests xanh  
- [ ] OAuth lưu `access_token_enc`; list API không lộ token  
- [ ] Webhook signature; duplicate receipt → 200 không double-outbox  
- [ ] Job persist ghi message; takeover `bot_epoch++`  
- [ ] JwtAuthGuard/OrgGuard skip `/v1/webhooks/meta`  
- [ ] Isolation channels/inbox xanh  
- [ ] Runbook meta-down + README tunnel  
- [ ] `plan-b-dod-evidence.md`  

---

## File map (tạo mới / sửa)

```text
supabase/migrations/20260725090000_meta_inbox.sql
apps/api/src/common/crypto/token-crypto.ts (+ .spec.ts)
apps/api/src/integrations/meta/signature.ts (+ .spec.ts)
apps/api/src/integrations/meta/graph.client.ts
apps/api/src/config/env.ts                          # META_* keys
apps/api/src/common/guards/jwt-auth.guard.ts        # skip webhook
apps/api/src/common/guards/org.guard.ts             # skip webhook
apps/api/src/modules/channels/*
apps/api/src/modules/inbox/*
apps/api/src/jobs/functions/meta-persist-inbound.ts
apps/api/src/jobs/index.ts
apps/api/src/app.module.ts                          # ChannelsModule, InboxModule
apps/web/src/app/(app)/settings/channels/page.tsx
apps/web/src/app/(app)/dashboard/page.tsx           # link
.env.example, README.md, docs/runbooks/meta-down.md
tests/isolation/cross-tenant.channels.spec.ts
tests/fixtures/meta/messenger-inbound.json
docs/superpowers/plans/plan-b-dod-evidence.md
```

---

### Task 1 — B0: Migration channels + inbox + receipts

**Files:**
- Create: `supabase/migrations/20260725090000_meta_inbox.sql`

**Interfaces:**
- Produces tables: `channel_connections`, `contacts`, `conversations`, `messages`, `webhook_receipts`

- [ ] **Step 1: Write migration** (exact names from structure §8.3 / §8.6 / §8.8)

```sql
-- 20260725090000_meta_inbox.sql
-- channel_connections, contacts, conversations, messages, webhook_receipts
-- RLS: authenticated SELECT where org membership; no INSERT/UPDATE/DELETE for authenticated
-- UNIQUE(channel_connections.org_id, provider, external_page_id)
-- UNIQUE(webhook_receipts.provider, receipt_key)
-- UNIQUE INDEX messages (org_id, provider_message_id) WHERE provider_message_id IS NOT NULL
-- conversations.bot_epoch int default 0, bot_paused boolean default false
```

Column checklist:
- `channel_connections`: id, org_id, provider (`meta_page`|`meta_ig`), external_page_id, external_ig_id, access_token_enc, refresh_token_enc, token_expires_at, status (`active`|`needs_reauth`|`revoked`), metadata_json, created_at, updated_at  
- `contacts`: id, org_id, display_name, phone_e164, page_scoped_id, ig_scoped_id, tags_json, created_at, updated_at  
- `conversations`: id, org_id, channel (`messenger`|`instagram`), channel_connection_id, contact_id, status, bot_paused, bot_epoch, assignee_user_id, last_message_at, created_at, updated_at  
- `messages`: id, org_id, conversation_id, direction, sender_type, raw_type, body_text, payload_json, provider_message_id, created_at  
- `webhook_receipts`: id, provider, receipt_key, org_id, payload_hash, received_at  

- [ ] **Step 2: Peer-check SQL** (or `npx supabase db reset` nếu có Docker)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260725090000_meta_inbox.sql
git commit -m "feat(db): meta channel connections and inbox tables"
```

---

### Task 2 — B1: AES-256-GCM token crypto

**Files:**
- Create: `apps/api/src/common/crypto/token-crypto.ts`
- Test: `apps/api/src/common/crypto/token-crypto.spec.ts`

**Interfaces:**
- `deriveKey(secret: string): Buffer` — `createHash('sha256').update(secret).digest()`
- `encryptToken(plaintext: string, secret: string): string` — base64url(`iv[12] || ciphertext || tag[16]`)
- `decryptToken(payload: string, secret: string): string`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { encryptToken, decryptToken } from "./token-crypto";

describe("token-crypto", () => {
  const key = "dev-token-encryption-key-32chars!!";

  it("roundtrips and does not leak plaintext", () => {
    const enc = encryptToken("EAAB_test_token", key);
    expect(enc).not.toContain("EAAB");
    expect(decryptToken(enc, key)).toBe("EAAB_test_token");
  });

  it("throws on tamper", () => {
    const enc = encryptToken("x", key);
    const bad = Buffer.from(enc, "base64url");
    bad[bad.length - 1] ^= 0xff;
    expect(() => decryptToken(Buffer.from(bad).toString("base64url"), key)).toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm --filter @omni/api test -- src/common/crypto/token-crypto.spec.ts
```

- [ ] **Step 3: Implement**

```ts
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptToken(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString("base64url");
}

export function decryptToken(payload: string, secret: string): string {
  const key = deriveKey(secret);
  const buf = Buffer.from(payload, "base64url");
  if (buf.length < 12 + 16 + 1) throw new Error("invalid_token_payload");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(12, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
```

- [ ] **Step 4: Tests PASS + commit**

```bash
git add apps/api/src/common/crypto
git commit -m "feat(api): aes-256-gcm meta token crypto"
```

---

### Task 3 — B2: Meta signature + env + Graph client

**Files:**
- Create: `apps/api/src/integrations/meta/signature.ts`, `signature.spec.ts`, `graph.client.ts`
- Modify: `apps/api/src/config/env.ts`, `.env.example`

**Interfaces:**
- `verifyMetaSignature(rawBody: Buffer, signatureHeader: string | undefined, appSecret: string): boolean`
- `GraphClient`: `exchangeCodeForToken(code)`, `debugToken`, `getManagedPages(userToken)`, `getPageAccessToken(pageId, userToken)` — implement with `fetch`; unit-test signature only; Graph methods mockable

- [ ] **Step 1: Signature tests**

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "./signature";

describe("verifyMetaSignature", () => {
  const secret = "meta-app-secret";
  const body = Buffer.from('{"object":"page"}', "utf8");
  const sig =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  it("accepts valid signature", () => {
    expect(verifyMetaSignature(body, sig, secret)).toBe(true);
  });

  it("rejects missing or bad signature", () => {
    expect(verifyMetaSignature(body, undefined, secret)).toBe(false);
    expect(verifyMetaSignature(body, "sha256=deadbeef", secret)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement signature (timing-safe compare)**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const actual = signatureHeader.slice("sha256=".length);
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(actual, "utf8"));
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Extend EnvSchema**

```ts
META_APP_ID: z.string().min(1),
META_APP_SECRET: z.string().min(1),
META_VERIFY_TOKEN: z.string().min(8),
META_REDIRECT_URI: z.string().url(),
META_GRAPH_VERSION: z.string().default("v21.0"),
```

Update `.env.example` với placeholder. Tests/CI: stub Meta env trong vitest `setup` hoặc từng spec `vi.stubEnv`.

- [ ] **Step 4: Minimal `graph.client.ts`** với `exchangeCodeForToken` + `getManagedPages` dùng Graph REST.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(api): meta signature verify graph client and env"
```

---

### Task 4 — B3: Channels module — OAuth connect

**Files:**
- Create: `apps/api/src/modules/channels/{channels.module,channels.controller,channels.service,dto}.ts`
- Test: `channels.service.spec.ts`
- Modify: `app.module.ts` import `ChannelsModule`

**Interfaces:**
- `GET /v1/channels/meta/oauth-url` → `{ url: string }` — permission `channels.connect`
- `POST /v1/channels/meta/complete` body `{ code: string }` → upsert connection(s); **response never includes tokens**
- `GET /v1/channels` → list `{ id, provider, externalPageId, status, createdAt }[]`
- `POST /v1/channels/:id/revoke` → status `revoked`

OAuth scopes (Phase 1): `pages_show_list`, `pages_messaging`, `instagram_basic`, `instagram_manage_messages`, `pages_read_engagement` (điều chỉnh theo App Review Meta hiện hành — ghi trong comment).

- [ ] **Step 1: Failing unit test — complete encrypts**

```ts
it("stores encrypted token and omits secrets from DTO", async () => {
  const inserts: unknown[] = [];
  const service = new ChannelsService(/* mocks capturing inserts */);
  // mock graph to return page token "EAAB_PLAIN"
  const result = await service.completeOAuth({ orgId, userId, code: "x" });
  expect(JSON.stringify(inserts)).not.toContain("EAAB_PLAIN");
  expect(result).not.toHaveProperty("accessToken");
  expect(result.connections[0].status).toBe("active");
});
```

- [ ] **Step 2: Implement service** — `encryptToken(pageToken, env.TOKEN_ENCRYPTION_KEY)`; audit `channel.connected`

- [ ] **Step 3: Controller + `@RequirePermission('channels.connect')` trên mutate; list dùng `channels.connect` hoặc cho mọi role có `inbox.read` — **lock: list = bất kỳ membership; mutate = `channels.connect`****

- [ ] **Step 4: Tests + commit**

```bash
git commit -m "feat(api): meta oauth channel connect with encrypted tokens"
```

---

### Task 5 — B4: Webhook verify + ingest (critical path)

**Files:**
- Create: `meta-webhook.controller.ts`, `meta-webhook.service.ts`, `meta-webhook.service.spec.ts`
- Modify: `jwt-auth.guard.ts` `isPublicPath` thêm `/v1/webhooks/meta`
- Modify: `org.guard.ts` skip cùng path
- Modify: `main.ts` — enable raw body cho webhook (Nest: `rawBody: true` trên `NestFactory.create` **hoặc** middleware copy `req.rawBody`)

**Interfaces:**
- `GET /v1/webhooks/meta?hub.mode=subscribe&hub.verify_token=&hub.challenge=` → trả challenge plain text khi token khớp
- `POST /v1/webhooks/meta` → 401 nếu signature sai; 200 `{ ok: true }` luôn sau xử lý nhanh
- Flow POST: verify sig → chọn `receipt_key` = mid hoặc `entry[0].id + '-' + time` → insert receipt (conflict ignore) → nếu insert mới thì `enqueueOutbox(client, { orgId, eventName: 'meta.inbound', payload })` → 200
- Map `org_id` từ `entry[].id` (page id) → `channel_connections.external_page_id` status active

- [ ] **Step 1: Service unit tests**

```ts
it("returns challenge when verify token matches", ...)
it("rejects bad signature", ...)
it("enqueues outbox once for new receipt", ...)
it("skips outbox on duplicate receipt_key", ...)
```

- [ ] **Step 2: Implement; không gọi AI / Graph send**

- [ ] **Step 3: Confirm guards skip webhook** (unit test path helpers hoặc guard specs)

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(api): meta webhook verify receipt and outbox enqueue"
```

---

### Task 6 — B5: Persist inbound job + inbox APIs

**Files:**
- Create: `apps/api/src/jobs/functions/meta-persist-inbound.ts` (+ `.spec.ts`)
- Create: `tests/fixtures/meta/messenger-inbound.json` (sample page messaging payload)
- Create: `apps/api/src/modules/inbox/*`
- Modify: `jobs/index.ts` — `inngestFunctions = [platformNoop, metaPersistInbound]`
- Modify: `outbox.publisher.ts` mapping: `eventName === 'meta.inbound'` → Inngest send `meta/persist_inbound`

**Interfaces:**
- Inngest function id `meta-persist-inbound`, event `meta/persist_inbound`
- Upsert contact by `page_scoped_id` / `ig_scoped_id`
- Upsert conversation; insert message if `provider_message_id` new
- **Không** gọi `apps/ai`
- HTTP:
  - `GET /v1/inbox/conversations` — `inbox.read`
  - `GET /v1/inbox/conversations/:id/messages` — `inbox.read`
  - `POST /v1/inbox/conversations/:id/takeover` — `inbox.takeover` → `bot_paused=true`, `bot_epoch = bot_epoch + 1`, audit

- [ ] **Step 1: Persist unit test từ fixture**

- [ ] **Step 2: Implement job + wire outbox→inngest event name map**

- [ ] **Step 3: Inbox module APIs + tests takeover increments epoch**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(api): persist meta inbound messages and inbox read apis"
```

---

### Task 7 — B6: Isolation tests

**Files:**
- Create: `tests/isolation/cross-tenant.channels.spec.ts`

**Pattern:** Giống `cross-tenant.org.spec.ts` — Nest test module, mock membership, real `OrgGuard` + controllers.

- [ ] **Step 1: Cases**

1. userA + `X-Org-Id=orgB` → `GET /v1/channels` → 403  
2. userA + orgA → 200 (empty list OK)  
3. userA + orgB → `GET /v1/inbox/conversations` → 403  

- [ ] **Step 2: Run**

```bash
pnpm test:isolation
```

- [ ] **Step 3: Commit**

```bash
git commit -m "test(isolation): deny cross-tenant channel and inbox access"
```

---

### Task 8 — B7: Web VI — Kết nối kênh

**Files:**
- Create: `apps/web/src/app/(app)/settings/channels/page.tsx`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx` — link “Kết nối kênh”
- Create/modify: `apps/web/src/lib/api-client.ts` helper dùng `buildApiHeaders` (token + org từ localStorage stubs OK)

**UI (VI):**
- Nút “Kết nối Facebook / Instagram”
- Gọi `GET /v1/channels/meta/oauth-url` → `window.location = url` **hoặc** flow popup + `POST .../complete` với `code`
- Bảng kênh đã nối (provider, page id, status) — **không** hiện token
- Empty state: “Chưa kết nối trang nào”

- [ ] **Step 1: Implement page (no service-role, no META secrets in NEXT_PUBLIC_*)**

- [ ] **Step 2: `pnpm --filter @omni/web typecheck` + commit**

```bash
git commit -m "feat(web): vi channel connect settings page"
```

---

### Task 9 — B8: Runbook + README tunnel + env

**Files:**
- Modify: `docs/runbooks/meta-down.md`, `README.md`, `.env.example`

- [ ] **Step 1: README section “Meta webhook local”**

```md
## Meta webhook (local)
1. Chạy api: `pnpm --filter @omni/api dev`
2. Tunnel: `cloudflared tunnel --url http://127.0.0.1:3001` (hoặc ngrok)
3. Meta Webhook Callback URL: `https://<tunnel>/v1/webhooks/meta`
4. Verify token = `META_VERIFY_TOKEN`
```

- [ ] **Step 2: meta-down runbook đầy đủ** — symptom (không nhận DM) → check signature/logs → `webhook_receipts` → outbox unpublished → Inngest DLQ → escalate

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: meta webhook tunnel and meta-down runbook"
```

---

### Task 10 — B9: DoD evidence + đóng Plan B

**Files:**
- Create: `docs/superpowers/plans/plan-b-dod-evidence.md`
- Modify: `docs/superpowers/plans/2026-07-24-priority-execution-roadmap.md` — đánh dấu Plan B DONE khi xanh

- [ ] **Step 1: Chạy cổng tự động**

```bash
pnpm --filter @omni/api test
pnpm --filter @omni/web test
pnpm --filter @omni/web typecheck
pnpm test:isolation
```

- [ ] **Step 2: Bảng DoD** trong evidence (green/amber)

| Mục | Status |
|-----|--------|
| Migration + RLS | |
| Crypto tests | |
| OAuth encrypted | |
| Webhook 200 + dedupe | |
| Persist job | |
| Isolation | |
| Web VI | |
| Runbook + tunnel docs | |
| Live Meta E2E (Page DM) | NOT RUN / PASS |

Live Meta E2E **amber OK** nếu chưa có Meta App — ghi rõ.

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: record plan B DoD evidence"
```

---

## Out of scope (không làm trong Plan B)

| Để plan | Việc |
|---------|------|
| **C** | LLM, RAG, `ai_runs`, reindex |
| **D** | Orders, export, inbox UI đầy đủ poll, App Review package |
| Phase 2 | Carrier API |

---

## Self-review checklist (author)

| Wave D | Task |
|--------|------|
| D1 OAuth | 4 |
| D2 AES-GCM | 2 |
| D3 Webhook | 5 |
| D4 Persist | 6 |
| D5 Idempotent | 5–6 |
| D6 Runbook | 9 |
| D7 Tunnel docs | 9 |
| Isolation | 7 |
| VI connect | 8 |

Placeholder scan: không còn `...` / TBD trong bước code.

---

## Execution handoff

**Thứ tự ưu tiên + cổng giai:** [plan-b-priority-execution](./2026-07-24-plan-b-priority-execution.md)  
**Chi tiết file/code từng task:** file này (Task 1–10).

**Hai cách chạy:**

1. **Subagent-Driven (khuyến nghị)** — từng B0→B9, review giữa các task  
2. **Inline Execution** — làm tuần tự trong session  

Sau DoD B → mở [Plan C](./2026-07-24-plan-c-catalog-ai.md).

**Which approach?**
