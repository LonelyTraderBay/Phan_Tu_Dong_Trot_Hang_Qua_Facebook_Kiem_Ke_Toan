# Plan A — Platform Foundation (Waves A + B + C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Enterprise monorepo skeleton (`web` + `api` + `ai` + Supabase) with identity/tenancy, `X-Org-Id`, platform ops, Inngest+outbox spine, and **M2 hooks** — before any Meta/catalog/AI product features.

**Architecture:** Topology C — Next.js VI shell talks only to Nest Core; FastAPI AI exposes `/health` (+ m2m stub); Postgres/Supabase is SoT with RLS; side effects via `outbox_events` → Inngest functions **only in `apps/api`**; AI called over HTTP m2m later.

**Tech Stack:** pnpm + Turborepo · Node 20 · NestJS · Next.js App Router · FastAPI + uv · Python 3.12 · Supabase (Postgres+Auth+RLS) · Inngest · Vitest · pytest · Zod · Ruff

**Specs:** [CANONICAL](../specs/2026-07-24-CANONICAL-LOCKED-DECISIONS.md) · [structure §1–11](../specs/2026-07-24-enterprise-structure-and-data-architecture.md) · [WBS Waves A–C](../specs/2026-07-24-implementation-work-breakdown.md) · [maturity M2](../specs/2026-07-24-enterprise-maturity-scorecard-to-100.md) · [master CPC/E100](../specs/2026-07-24-master-roadmap-commercial-complete.md)

## Global Constraints

- UI language: **Tiếng Việt** only; code identifiers: **English**
- JSON HTTP: **camelCase**
- Routes: `/v1/*` shop · `/internal/v1/*` m2m · `/ops/v1/*` platform
- Header **`X-Org-Id`** required on shop business APIs
- Money later: BIGINT VND; phones: E.164; TZ column `organizations.timezone` default `Asia/Ho_Chi_Minh`
- Jobs: **Inngest in `apps/api` only** — never register Inngest in Python
- No Meta OAuth, no LLM production calls, no catalog/orders UI in this plan
- Host vendor locked in Task 18: **Render** (single vendor web+api+ai); Fly deferred unless Render blocked
- Do **not** claim 100/100 Enterprise (E100 = M4 only); CPC = Phase 1–4 + M3
- Every task ends with tests green + commit

## Plan A Definition of Done (must all pass)

- [ ] Structure tree matches structure doc §1–4 (empty business modules OK as folders)
- [ ] Identity migration + RLS + `platform_admins` + `outbox_events` + global kill-switches seeded
- [ ] Nest `/health` + `/ready`; FastAPI `/health`; Next VI authenticated shell placeholder
- [ ] CI workflows for web/api/ai + isolation + migrate-check; Dependabot; gitleaks
- [ ] `.env.example` + README run-all-three (VI engineer onboarding)
- [ ] M2 hooks: outbox path, redacting logger, `traceparent` stub, `Idempotency-Key` middleware stub, security headers, `kill_ai_*` flags, `docs/runbooks/`, `docs/adr/`, `CODEOWNERS`
- [ ] Eval folder with ≥10 adversarial prompt files (no need to execute LLM yet)
- [ ] Isolation tests prove cross-tenant denial
- [ ] Sample outbox → Inngest no-op job E2E locally
- [ ] Api can HTTP-GET ai `/health` with service key + echo `traceparent`

## File map (create in this plan)

```text
/
├── package.json, pnpm-workspace.yaml, turbo.json, .nvmrc, .gitignore
├── .prettierrc, eslint.config.js, .env.example, README.md, CODEOWNERS
├── .github/workflows/{ci-web,ci-api,ci-ai,ci-isolation,migrate-check}.yml
├── .github/dependabot.yml
├── apps/web/...
├── apps/api/...
├── apps/ai/...
├── packages/{authz-types,db,contracts,api-client}/...
├── supabase/{config.toml,migrations/,seed/}
├── tests/{isolation,integration,eval}/
└── docs/{adr/,runbooks/}
```

---

### Task 1: Monorepo root + tooling

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.gitignore`, `.prettierrc`, `eslint.config.js`, `.npmrc`

**Interfaces:**
- Produces: `pnpm` workspace scripts `build`, `lint`, `typecheck`, `test`

- [ ] **Step 1: Create root manifests**

```json
// package.json
{
  "name": "omni-commerce",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "dev": "turbo run dev --parallel"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.7.2",
    "prettier": "^3.4.2",
    "eslint": "^9.17.0"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

```text
# .nvmrc
20
```

```ini
# .npmrc
strict-peer-dependencies=false
auto-install-peers=true
```

- [ ] **Step 2: Add `.gitignore` + Prettier + ESLint flat config**

Ignore: `node_modules`, `.next`, `dist`, `.turbo`, `.env`, `.env.local`, `apps/ai/.venv`, `__pycache__`, `.pytest_cache`, `coverage`.

- [ ] **Step 3: Install and verify**

Run: `corepack enable && pnpm install`  
Expected: lockfile created; no workspace package errors yet (empty apps OK after Task 2+).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .nvmrc .gitignore .prettierrc eslint.config.js .npmrc pnpm-lock.yaml
git commit -m "chore: initialize pnpm turborepo monorepo root"
```

---

### Task 2: `packages/authz-types` — roles & permissions

**Files:**
- Create: `packages/authz-types/package.json`, `packages/authz-types/tsconfig.json`, `packages/authz-types/src/index.ts`, `packages/authz-types/src/permissions.ts`
- Test: `packages/authz-types/src/permissions.test.ts`

**Interfaces:**
- Produces: `Role`, `Permission`, `roleHasPermission(role, permission)`, `PLATFORM_ADMIN_PERMISSIONS`

- [ ] **Step 1: Write failing test**

```ts
// packages/authz-types/src/permissions.test.ts
import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./permissions";

describe("roleHasPermission", () => {
  it("owner can invite members", () => {
    expect(roleHasPermission("owner", "members.invite")).toBe(true);
  });
  it("cskh cannot invite members", () => {
    expect(roleHasPermission("cskh", "members.invite")).toBe(false);
  });
  it("kho cannot reply inbox", () => {
    expect(roleHasPermission("kho", "inbox.reply")).toBe(false);
  });
  it("platform ops.suspend only via platform admin path later", () => {
    expect(roleHasPermission("owner", "ops.org.suspend")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm --filter @omni/authz-types test`  
Expected: FAIL (module/package missing)

- [ ] **Step 3: Implement matrix (scorecard §6)**

```ts
// packages/authz-types/src/permissions.ts
export type Role = "owner" | "cskh" | "kho";

export type Permission =
  | "org.settings.read"
  | "org.settings.write"
  | "members.invite"
  | "channels.connect"
  | "catalog.read"
  | "catalog.write"
  | "inbox.read"
  | "inbox.reply"
  | "inbox.takeover"
  | "orders.read"
  | "orders.write"
  | "orders.approve"
  | "orders.export"
  | "ai.settings.write"
  | "ops.org.suspend"
  | "ops.global_flags";

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: [
    "org.settings.read",
    "org.settings.write",
    "members.invite",
    "channels.connect",
    "catalog.read",
    "catalog.write",
    "inbox.read",
    "inbox.reply",
    "inbox.takeover",
    "orders.read",
    "orders.write",
    "orders.approve",
    "orders.export",
    "ai.settings.write",
  ],
  cskh: [
    "org.settings.read",
    "catalog.read",
    "inbox.read",
    "inbox.reply",
    "inbox.takeover",
    "orders.read",
    "orders.write",
    "orders.approve",
  ],
  kho: [
    "org.settings.read",
    "catalog.read",
    "inbox.read",
    "orders.read",
    "orders.write",
    "orders.export",
  ],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}
```

```ts
// packages/authz-types/src/index.ts
export * from "./permissions";
```

Wire `package.json` name `@omni/authz-types`, vitest script, `"main": "./src/index.ts"`.

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm --filter @omni/authz-types test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/authz-types
git commit -m "feat(authz-types): lock role permission matrix"
```

---

### Task 3: `packages/db` — shared Zod identity shapes

**Files:**
- Create: `packages/db/package.json`, `packages/db/src/index.ts`, `packages/db/src/identity.ts`
- Test: `packages/db/src/identity.test.ts`

**Interfaces:**
- Produces: `OrganizationSchema`, `MembershipSchema`, `RoleSchema` (zod)

- [ ] **Step 1: Failing test for slug + timezone defaults**

```ts
import { describe, expect, it } from "vitest";
import { OrganizationSchema } from "./identity";

describe("OrganizationSchema", () => {
  it("defaults timezone and locale", () => {
    const org = OrganizationSchema.parse({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Shop A",
      slug: "shop-a",
      plan: "free_dev",
    });
    expect(org.timezone).toBe("Asia/Ho_Chi_Minh");
    expect(org.locale).toBe("vi");
  });
});
```

- [ ] **Step 2: Implement**

```ts
import { z } from "zod";

export const RoleSchema = z.enum(["owner", "cskh", "kho"]);

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  plan: z.string(),
  settingsJson: z.record(z.unknown()).default({}),
  timezone: z.string().default("Asia/Ho_Chi_Minh"),
  locale: z.string().default("vi"),
  suspendedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  role: RoleSchema,
});
```

- [ ] **Step 3: Tests pass + commit**

```bash
git add packages/db
git commit -m "feat(db): add zod identity schemas"
```

---

### Task 4: `apps/api` Nest bootstrap — health + env zod

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/config/env.ts`, `apps/api/src/modules/health/health.controller.ts`, `apps/api/src/modules/health/health.module.ts`
- Test: `apps/api/src/modules/health/health.controller.spec.ts`

**Interfaces:**
- Produces: `GET /health` → `{ status: "ok" }`; `GET /ready` → `{ status: "ready" }`; `loadEnv()`

- [ ] **Step 1: Write health controller test (supertest or nest testing)**

```ts
import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    expect(controller.health()).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Implement env + health**

```ts
// apps/api/src/config/env.ts
import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(32),
  SERVICE_M2M_KEY: z.string().min(16),
  AI_BASE_URL: z.string().url().default("http://127.0.0.1:8000"),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PLATFORM_ADMIN_EMAILS: z.string().default(""),
  AI_MODEL_ALLOWLIST: z.string().default("gemini-2.0-flash"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  return EnvSchema.parse(raw);
}
```

```ts
// health.controller.ts
import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { status: "ok" };
  }

  @Get("ready")
  ready() {
    return { status: "ready" };
  }
}
```

Bootstrap Nest on `PORT`, enable shutdown hooks. No business modules yet beyond empty folders matching structure §2.

- [ ] **Step 3: Run api tests**

Run: `pnpm --filter @omni/api test`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/api
git commit -m "feat(api): nest bootstrap with health and env validation"
```

---

### Task 5: `apps/ai` FastAPI — health + config

**Files:**
- Create: `apps/ai/pyproject.toml`, `apps/ai/app/main.py`, `apps/ai/app/config.py`, `apps/ai/app/api/health.py`, `apps/ai/tests/test_health.py`

**Interfaces:**
- Produces: `GET /health` → `{"status":"ok"}`; settings via pydantic-settings

- [ ] **Step 1: Failing pytest**

```python
# apps/ai/tests/test_health.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
```

- [ ] **Step 2: Implement**

```python
# apps/ai/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    service_m2m_key: str = "dev-m2m-key-change-me"
    core_base_url: str = "http://127.0.0.1:3001"
    ai_model_allowlist: str = "gemini-2.0-flash"
    sentry_dsn: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
```

```python
# apps/ai/app/main.py
from fastapi import FastAPI
from app.api.health import router as health_router

app = FastAPI(title="omni-ai", version="0.1.0")
app.include_router(health_router)
```

```python
# apps/ai/app/api/health.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}
```

Use **uv** (`uv sync`). Python **3.12**.

- [ ] **Step 3: Run**

Run: `cd apps/ai && uv run pytest -q`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/ai
git commit -m "feat(ai): fastapi health endpoint with uv"
```

---

### Task 6: `apps/web` Next.js VI shell

**Files:**
- Create: `apps/web/package.json`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/app/(app)/dashboard/page.tsx`, `apps/web/src/lib/org-context.ts`, `apps/web/next.config.ts`
- Test: `apps/web/src/lib/org-context.test.ts`

**Interfaces:**
- Produces: `getActiveOrgId()` / `setActiveOrgId()` helpers; VI placeholder copy

- [ ] **Step 1: Test org header helper**

```ts
import { describe, expect, it } from "vitest";
import { buildApiHeaders } from "./org-context";

describe("buildApiHeaders", () => {
  it("injects Authorization and X-Org-Id", () => {
    const h = buildApiHeaders({
      accessToken: "tok",
      orgId: "11111111-1111-1111-1111-111111111111",
    });
    expect(h.Authorization).toBe("Bearer tok");
    expect(h["X-Org-Id"]).toBe("11111111-1111-1111-1111-111111111111");
  });
});
```

- [ ] **Step 2: Implement VI shell**

`page.tsx` (marketing stub): tiêu đề tiếng Việt — tên sản phẩm tạm **Omni Commerce**.  
`(app)/dashboard/page.tsx`: "Bảng điều khiển (đang dựng nền tảng)" — không gọi service-role.

```ts
// org-context.ts
export function buildApiHeaders(input: {
  accessToken: string;
  orgId: string;
}): Record<string, string> {
  return {
    Authorization: `Bearer ${input.accessToken}`,
    "X-Org-Id": input.orgId,
    "Content-Type": "application/json",
  };
}
```

Security headers in `next.config.ts` (`headers()`): `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.

- [ ] **Step 3: Tests + commit**

```bash
git add apps/web
git commit -m "feat(web): next vi shell with org header helper"
```

---

### Task 7: Supabase migration — identity + outbox + flags + RLS

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/20260724120000_init_platform.sql`, `supabase/seed/dev.sql`

**Interfaces:**
- Produces: tables `organizations`, `memberships`, `membership_invites`, `platform_admins`, `entitlements`, `feature_flags`, `usage_events`, `outbox_events`, `audit_logs`; RLS enabled

- [ ] **Step 1: Write migration SQL (exact names from structure §8.1–8.2, 8.8)**

Include:
- extensions `pgcrypto`
- all identity/billing/outbox/audit tables with columns per structure doc
- `UNIQUE (org_id, user_id)` on memberships
- `feature_flags` unique `(key, org_id)` — use partial unique for null org if needed (`unique index on (key) where org_id is null` + `unique (key, org_id)`)
- RLS policies: members select/update rows where `org_id in (select org_id from memberships where user_id = auth.uid())`
- `platform_admins` readable only by service role / later Core
- Seed global flags:

```sql
insert into feature_flags (id, key, org_id, enabled, payload_json)
values
  (gen_random_uuid(), 'kill_ai_outbound', null, false, '{}'),
  (gen_random_uuid(), 'kill_ai_all', null, false, '{}'),
  (gen_random_uuid(), 'kill_auto_confirm', null, false, '{}');
```

Default org settings must support AI draft max amount later:

```sql
-- organizations.settings_json example shape (document in comment):
-- { "aiDraftMaxAmountVnd": 5000000, "allowCskhApprove": false }
```

- [ ] **Step 2: Validate migration locally**

Run: `npx supabase db reset` (or `supabase db reset`)  
Expected: applies clean; seed OK

- [ ] **Step 3: Commit**

```bash
git add supabase
git commit -m "feat(db): identity tenancy outbox flags and RLS"
```

---

### Task 8: API common — ProblemDetails, request id, redacting logger, security headers, Idempotency-Key stub

**Files:**
- Create: `apps/api/src/common/filters/problem-details.filter.ts`, `apps/api/src/common/middleware/request-id.middleware.ts`, `apps/api/src/common/logging/redacting-logger.ts`, `apps/api/src/common/middleware/idempotency.middleware.ts`, `apps/api/src/common/middleware/security-headers.middleware.ts`
- Test: `apps/api/src/common/logging/redacting-logger.spec.ts`

**Interfaces:**
- Produces: `createRedactingLogger()`, error body `{ type, title, status, detail, instance, requestId, code? }`

- [ ] **Step 1: Failing redaction test**

```ts
import { describe, expect, it } from "vitest";
import { redactLogRecord } from "./redacting-logger";

describe("redactLogRecord", () => {
  it("redacts phone and token keys", () => {
    const out = redactLogRecord({
      phone: "+84901234567",
      authorization: "Bearer secret",
      orgId: "11111111-1111-1111-1111-111111111111",
    });
    expect(out.phone).toBe("[REDACTED]");
    expect(out.authorization).toBe("[REDACTED]");
    expect(out.orgId).toContain("11111111");
  });
});
```

- [ ] **Step 2: Implement redaction + wire middleware in `main.ts`**

Redact keys matching: `phone`, `address`, `token`, `authorization`, `cookie`, and E.164-looking strings in values.

`Idempotency-Key`: middleware reads header on POST; if present, attach to request (`req.idempotencyKey`); persistence table can wait Plan D — **hook required now**.

Security headers middleware: `X-Content-Type-Options=nosniff`, `X-Frame-Options=DENY`, `Referrer-Policy=no-referrer`.

- [ ] **Step 3: Tests pass + commit**

```bash
git commit -m "feat(api): problem details request id redaction security headers"
```

---

### Task 9: Auth guards — JWT + OrgGuard (`X-Org-Id`)

**Files:**
- Create: `apps/api/src/common/guards/jwt-auth.guard.ts`, `apps/api/src/common/guards/org.guard.ts`, `apps/api/src/common/decorators/org-id.decorator.ts`, `apps/api/src/common/decorators/current-user.decorator.ts`
- Test: `apps/api/src/common/guards/org.guard.spec.ts`

**Interfaces:**
- Consumes: Supabase JWT verification (jwks or `SUPABASE_JWT_SECRET` if configured — prefer `@supabase/supabase-js` `auth.getUser(jwt)`)
- Produces: request user `{ id, email }`; orgId uuid; throws 401/403 ProblemDetails

- [ ] **Step 1: OrgGuard unit test**

```ts
it("rejects missing X-Org-Id", async () => {
  const guard = new OrgGuard(/* mock memberships repo returning [] */);
  await expect(
    guard.canActivate(mockContext({ headers: {}, user: { id: "u1" } })),
  ).rejects.toMatchObject({ status: 400 });
});

it("rejects membership miss", async () => {
  await expect(
    guard.canActivate(
      mockContext({
        headers: { "x-org-id": "11111111-1111-1111-1111-111111111111" },
        user: { id: "u1" },
      }),
    ),
  ).rejects.toMatchObject({ status: 403 });
});
```

- [ ] **Step 2: Implement guards**

- `JwtAuthGuard`: Bearer required (except `/health`, `/ready`, Inngest webhook path later).  
- `OrgGuard`: require `X-Org-Id`, verify membership row, attach `req.membership`.  
- Skip OrgGuard on `/ops/v1` and `/internal/v1` (other guards).

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(api): jwt and X-Org-Id org guard"
```

---

### Task 10: Identity module — create org + membership

**Files:**
- Create: `apps/api/src/modules/identity/*` (module, controller, service, dto)
- Test: `apps/api/src/modules/identity/identity.service.spec.ts`

**Interfaces:**
- Produces:
  - `POST /v1/orgs` → create org + owner membership + default entitlements
  - `GET /v1/orgs` → list orgs for current user
  - `POST /v1/orgs/:orgId/invites` (owner only) — stub OK storing `membership_invites`

- [ ] **Step 1: Service unit test — creating org writes entitlements**

Assert service calls insert organization, membership role `owner`, entitlements row.

- [ ] **Step 2: Implement with Supabase service client only after JWT user resolved**

Use user-scoped client when possible; service role only for bootstrap inserts that RLS blocks — document why in code comment.

CamelCase JSON response.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(api): identity create org and memberships"
```

---

### Task 11: Authz module — permission guard

**Files:**
- Create: `apps/api/src/modules/authz/permissions.guard.ts`, `apps/api/src/common/decorators/require-permission.decorator.ts`
- Test: `apps/api/src/modules/authz/permissions.guard.spec.ts`

**Interfaces:**
- Consumes: `@omni/authz-types` `roleHasPermission`
- Produces: `@RequirePermission('members.invite')`

- [ ] **Step 1–4: TDD guard + apply on invite route + commit**

```bash
git commit -m "feat(api): permission guard from authz matrix"
```

---

### Task 12: Admin-ops `/ops/v1`

**Files:**
- Create: `apps/api/src/modules/admin-ops/*`, `apps/api/src/common/guards/platform-admin.guard.ts`
- Test: `apps/api/src/modules/admin-ops/admin-ops.service.spec.ts`
- Modify: seed path / `PLATFORM_ADMIN_EMAILS` sync helper

**Interfaces:**
- Produces:
  - `GET /ops/v1/orgs` — list orgs (platform admin)
  - `POST /ops/v1/orgs/:orgId/suspend` — set `suspended_at`
  - `POST /ops/v1/flags/:key` — toggle global kill switches

- [ ] **Step 1: Test owner JWT cannot call ops**

Expect 403.

- [ ] **Step 2: Implement `PlatformAdminGuard` via `platform_admins` table**

On boot/dev: upsert emails from `PLATFORM_ADMIN_EMAILS` into `platform_admins` after those users exist (document manual seed for local).

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(api): platform admin ops v1 suspend and flags"
```

---

### Task 13: Isolation tests (CI-ready)

**Files:**
- Create: `tests/isolation/cross-tenant.org.spec.ts`, `tests/isolation/package.json` (or root vitest project), `.github/workflows/ci-isolation.yml`

**Interfaces:**
- Produces: HTTP tests against running api (or test module) proving user A cannot read org B

- [ ] **Step 1: Write isolation test**

Pseudo-flow:
1. Create userA/orgA, userB/orgB (service role test helpers)
2. As userA with `X-Org-Id=orgB` → expect 403
3. As userA with `X-Org-Id=orgA` GET own org → 200

- [ ] **Step 2: Run**

Run: `pnpm test:isolation`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git commit -m "test(isolation): deny cross-tenant org access"
```

---

### Task 14: Feature flags + entitlements + audit writer

**Files:**
- Create: `apps/api/src/modules/feature-flags/*`, `apps/api/src/modules/billing/entitlements.service.ts`, `apps/api/src/modules/audit/audit.service.ts`
- Test: `apps/api/src/modules/feature-flags/feature-flags.service.spec.ts`

**Interfaces:**
- Produces: `isEnabled(key, orgId | null)`, `writeAudit({ action, entityType, entityId, meta })`, `getEntitlements(orgId)`

- [ ] **Step 1: Test global `kill_ai_outbound` default false; can enable**

- [ ] **Step 2: Implement + write audit on suspend org**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(api): feature flags entitlements audit writer"
```

---

### Task 15: Outbox + Inngest sample job

**Files:**
- Create: `apps/api/src/jobs/inngest.client.ts`, `apps/api/src/jobs/functions/platform-noop.ts`, `apps/api/src/jobs/index.ts`, `apps/api/src/jobs/outbox.publisher.ts`, `apps/api/src/modules/internal/outbox.controller.ts` (dev-only trigger optional)
- Test: `apps/api/src/jobs/outbox.publisher.spec.ts`

**Interfaces:**
- Produces: `enqueueOutbox(tx, { orgId, eventName, payload })`; Inngest function `platform/noop`; publisher marks `published_at`

- [ ] **Step 1: Unit test outbox insert shape**

```ts
expect(row).toMatchObject({
  eventName: "platform.noop",
  publishedAt: null,
  attempts: 0,
});
```

- [ ] **Step 2: Implement Inngest serve endpoint**

Nest route e.g. `POST /api/inngest` (or `/v1/inngest`) using `inngest` + `express`/`fastify` adapter Nest supports.

Function:

```ts
export const platformNoop = inngest.createFunction(
  { id: "platform-noop" },
  { event: "platform/noop" },
  async ({ event }) => {
    return { ok: true, orgId: event.data.orgId };
  },
);
```

Publisher cron/interval (dev: every 2s) selects `published_at is null`, sends Inngest event, sets `published_at`, increments `attempts` on failure → eventually `job_dead_letters` (create table if not in Task 7 — add migration `..._job_dead_letters.sql` if missing).

- [ ] **Step 3: Manual E2E note in README** — insert outbox row → see function run in Inngest dev server

Run: `pnpm --filter @omni/api exec inngest-cli dev` (document exact command)

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(api): outbox publisher and inngest platform noop"
```

---

### Task 16: Internal m2m + call AI health + traceparent

**Files:**
- Create: `apps/api/src/modules/internal/internal.module.ts`, `apps/api/src/modules/internal/ai-proxy.service.ts`, `apps/api/src/common/guards/service-key.guard.ts`, `apps/api/src/common/middleware/traceparent.middleware.ts`
- Modify: `apps/ai/app/api/health.py` to echo `traceparent` header when present
- Test: `apps/api/src/modules/internal/ai-proxy.service.spec.ts`

**Interfaces:**
- Produces: `GET /internal/v1/ai/health` (service key) → proxies AI; forwards `traceparent`

- [ ] **Step 1: Test ServiceKeyGuard rejects bad key**

- [ ] **Step 2: Implement**

```ts
// ai-proxy.service.ts
async checkAiHealth(traceparent?: string) {
  const res = await fetch(`${env.AI_BASE_URL}/health`, {
    headers: {
      "X-Service-Key": env.SERVICE_M2M_KEY,
      ...(traceparent ? { traceparent } : {}),
    },
  });
  return res.json();
}
```

Generate traceparent if missing: `00-<32hex>-<16hex>-01`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(api): m2m ai health proxy with traceparent"
```

---

### Task 17: CI + Dependabot + gitleaks + packages stubs

**Files:**
- Create: `.github/workflows/ci-web.yml`, `ci-api.yml`, `ci-ai.yml`, `ci-isolation.yml`, `migrate-check.yml`, `.github/dependabot.yml`, `.gitleaks.toml`
- Create stubs: `packages/contracts/openapi.yaml` (paths: `/health`, `/v1/orgs`, `/ops/v1/orgs`, `/internal/v1/ai/health`), `packages/api-client/README.md` (codegen later)

- [ ] **Step 1: Write CI workflows**

Each: checkout, setup node 20 / pnpm, install, lint, typecheck, test.  
`ci-ai.yml`: setup python 3.12, uv sync, pytest.  
`migrate-check.yml`: supabase start + db reset.

- [ ] **Step 2: Dependabot** weekly npm + github-actions + pip (ai)

- [ ] **Step 3: Commit**

```bash
git commit -m "ci: add web api ai isolation migrate workflows and dependabot"
```

---

### Task 18: Docs spine — README, env example, ADR host=Render, runbooks, eval stubs, CODEOWNERS

**Files:**
- Create: `.env.example`, `README.md`, `CODEOWNERS`, `docs/adr/0001-host-vendor-render.md`, `docs/adr/0002-inngest-in-api-only.md`, `docs/runbooks/README.md`, `docs/runbooks/ai-down.md`, `docs/runbooks/db-failover.md`, `docs/runbooks/meta-down.md` (stub for later), `tests/eval/adversarial/01-ignore-previous.md` … `10-*.md`, `tests/eval/README.md`

**Interfaces:**
- Produces: engineer can run all three apps + supabase from README

- [ ] **Step 1: Write `.env.example` with all keys from `EnvSchema` + web supabase anon + ai keys — no secrets**

- [ ] **Step 2: ADR lock Render as single free/paid vendor for web+api+ai**

State Fly is fallback only with new ADR.

- [ ] **Step 3: Create 10 adversarial eval markdown files** (jailbreak VI/EN prompts). Runner can be no-op script `tests/eval/run_stub.py` exiting 0 counting files ≥10.

```python
# tests/eval/run_stub.py
from pathlib import Path
cases = list(Path(__file__).parent.joinpath("adversarial").glob("*.md"))
assert len(cases) >= 10, len(cases)
print(f"ok:{len(cases)}")
```

- [ ] **Step 4: Runbooks stubs in Vietnamese** for AI down / DB failover (symptom → check → action → escalate)

- [ ] **Step 5: Commit**

```bash
git commit -m "docs: README env ADR render runbooks and eval adversarial stubs"
```

---

### Task 19: Empty business module folders + Sentry init stubs

**Files:**
- Create empty module folders under `apps/api/src/modules/{channels,catalog,inbox,orders,knowledge}/.gitkeep`
- Create `apps/api/src/instrument.ts` Sentry init if `SENTRY_DSN` set (no-op otherwise)
- Same pattern optional for web/ai

- [ ] **Step 1: Add folders + Sentry stub**

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: reserve business module folders and sentry stubs"
```

---

### Task 20: Plan A acceptance — DoD gate

**Files:**
- Modify: `docs/superpowers/plans/2026-07-24-plan-a-platform-foundation.md` (check DoD boxes)
- Create: `docs/superpowers/plans/plan-a-dod-evidence.md` (commands + results pasted by implementer)

- [ ] **Step 1: Run full local gate**

```bash
pnpm lint && pnpm typecheck && pnpm test
cd apps/ai && uv run pytest -q
pnpm test:isolation
cd apps/ai && uv run python ../../tests/eval/run_stub.py
```

Expected: all green

- [ ] **Step 2: Manual smoke**

1. `supabase start` + migrate  
2. `pnpm --filter @omni/api dev` → `/health` `/ready`  
3. `uv run uvicorn app.main:app --port 8000` → `/health`  
4. `pnpm --filter @omni/web dev` → VI shell  
5. Insert outbox noop → Inngest receives  
6. `GET /internal/v1/ai/health` with service key → ok  

- [ ] **Step 3: Confirm M2 hook checklist**

| M2 item | Evidence |
|---------|----------|
| Security headers | web+api |
| Dependabot | `.github/dependabot.yml` |
| Idempotency-Key middleware | stub present |
| PII redacting logger | tests green |
| Outbox same-TX helper | publisher + table |
| traceparent | api↔ai health |
| prompt_version / allowlist | env `AI_MODEL_ALLOWLIST` (+ comment on future `ai_runs`) |
| kill_ai_outbound | seeded flag |
| Runbooks | `docs/runbooks/` |
| ≥10 adversarial eval files | stub runner |
| AI draft max amount policy | documented in `settings_json` shape + constant `DEFAULT_AI_DRAFT_MAX_AMOUNT_VND=5000000` in api config |

- [ ] **Step 4: Final commit**

```bash
git commit -m "docs: record plan A DoD evidence — platform foundation complete"
```

---

## Out of scope (explicit)

- Meta OAuth / webhooks (Plan B)  
- Catalog / knowledge embed / LLM calls (Plan C)  
- Orders / export / full VI product UI (Plan D)  
- M3 paid hosting/Pro DB (Plan E)  
- CPC / E100 claims  

## Self-review (author)

| Spec requirement | Task |
|------------------|------|
| Structure §11 scaffold | 1–7, 17–20 |
| M2 hooks | 8, 15–18, 20 |
| Identity + RLS + platform_admins | 7, 10, 12 |
| X-Org-Id | 6, 9 |
| Isolation CI | 13, 17 |
| Inngest in api only + outbox | 15, ADR 0002 |
| AI HTTP m2m health | 5, 16 |
| Render single vendor | 18 ADR 0001 |
| No Meta/LLM product paths | Out of scope |

Placeholder scan: none intentional. Host choice locked to Render for this plan.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-24-plan-a-platform-foundation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

**Which approach?**
