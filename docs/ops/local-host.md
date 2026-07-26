# Local host mode (PC as server)

Full local stack: Supabase (Docker) + API + Web + AI on this machine.

> **Default for coding / SDD (2026-07-26):** Local-first is the default development surface. Render staging payment / Starter and Meta App Review are **deferred** until owner wants to **claim CPC thương mại** (Gate R0 live) — see [L1 plan](../superpowers/plans/2026-07-26-sdd-l1-local-first.md) and [completion-step-by-step](../superpowers/plans/2026-07-25-completion-step-by-step.md).

## Prerequisites

- Docker Desktop running (`docker` on PATH, or `C:\Program Files\Docker\Docker\resources\bin`)
- Node 22+, pnpm, Python 3.12, `uv`

## Start database

```powershell
$env:Path = "C:\Program Files\Docker\Docker\resources\bin;$env:Path"
npx supabase start
npx supabase status -o env
```

If port 54322 is busy, stop the other project first:

```powershell
npx supabase stop --project-id api
npx supabase start
```

## Point apps at local Supabase

`.env`, `apps/web/.env.local`, `apps/ai/.env` must use:

- `SUPABASE_URL=http://127.0.0.1:54321`
- local anon / service_role keys from `supabase status`

## Start / stop apps

```powershell
pnpm run dev:local
pnpm run dev:local:stop
```

## URLs

| Service | URL |
|---------|-----|
| Web | http://127.0.0.1:3000 |
| API | http://127.0.0.1:3001/health |
| AI | http://127.0.0.1:8000/health |
| Supabase API | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| Mailpit | http://127.0.0.1:54324 |

### L1 Task 2 stack verify (2026-07-26)

| Check | Result |
|-------|--------|
| Docker Desktop + `npx supabase status` | **PASS** — `API_URL=http://127.0.0.1:54321`; project `omni-commerce` |
| Env alignment | **PASS** — parent `.env` + `apps/web/.env.local` use `127.0.0.1:54321` (worktree shares parent secrets; not committed) |
| api `GET /health` | **PASS** — HTTP 200 `{"status":"ok"}` |
| ai `GET /health` | **PASS** — HTTP 200 `{"status":"ok"}` |
| web `GET /` | **PASS** — HTTP 200 (`Omni Commerce`) |
| Supabase auth health | **PASS** — `GET http://127.0.0.1:54321/auth/v1/health` 200 |
| Meta webhooks | **BLOCKED** — localhost not callable by Meta (expected) |

## Knowledge reindex (`knowledge_chunks`)

Product create enqueues `knowledge.reindex` via outbox → Inngest → AI embed → `replace_knowledge_chunks`.
Without a local Inngest dev server, chunks stay empty even though the product exists.

```powershell
# separate terminal while API is running (must be up before outbox publishes)
npx inngest-cli@latest dev -u http://127.0.0.1:3001/api/inngest
```

### Embeddings: Gemini vs local stub

| Mode | When | Quality |
|------|------|---------|
| **Gemini** | `GEMINI_API_KEY` set (non-empty) | Real `text-embedding-004` (768-d) |
| **Local stub** | Key empty **and** (`APP_ENV` ∈ local/dev/test **or** `EMBEDDINGS_ALLOW_STUB=1`) | Deterministic hash vectors (768-d). **Not** Gemini quality; **not** for CPC/live-LLM claims |
| **Refused** | Key empty **and** `APP_ENV`/`NODE_ENV` = `production` (even if allow flag set) | Clear error — stub never silent in prod |

Enable stub for local-only (key already empty on this PC — probe `GEMINI_API_KEY` len=0):

```powershell
# parent .env and/or apps/ai/.env
APP_ENV=local
# optional explicit flag (needed if APP_ENV is neither local/dev/test):
EMBEDDINGS_ALLOW_STUB=1
```

Restart AI after env changes (`pnpm run dev:local` or restart AI process).

Unit coverage: `cd apps/ai; uv run pytest tests/test_stub_embeddings.py -q`

### E0.2 local verify (2026-07-26 · L1 Task 3)

| Step | Result |
|------|--------|
| `GEMINI_API_KEY` probe (parent `.env`, value len only) | **EMPTY** — len=0 → stub path (not live Gemini) |
| Stub embeddings code | **PASS** — `apps/ai` factory + `StubEmbeddingProvider` (768-d, labeled `local-stub-embeddings`) |
| Prod guard | **PASS** — stub refused when `APP_ENV`/`NODE_ENV=production` even with `EMBEDDINGS_ALLOW_STUB=1` |
| `uv run pytest tests/test_stub_embeddings.py -q` | **PASS** — see commit evidence |
| Create product + Inngest → `knowledge_chunks` > 0 | **VERIFY STEPS** (optional smoke) — stack + Inngest required; see below |

**Optional smoke (after AI restart with stub enabled):**

```powershell
# 1) Ensure APP_ENV=local (or EMBEDDINGS_ALLOW_STUB=1), GEMINI empty OK
# 2) API + AI + Inngest dev running
# 3) POST /v1/catalog/products (auth as usual)
# 4) Wait for knowledge.reindex, then:
docker exec supabase_db_omni-commerce psql -U postgres -d postgres -t -c "select count(*) from knowledge_chunks;"
```

Expect `> 0` with stub vectors. **Do not** claim Gemini retrieval / CPC quality from stub chunks.

### Prior E0.2 note (2026-07-25 · sdd-task-2)

| Step | Result |
|------|--------|
| Stack + Inngest | **PASS** — product/outbox published |
| `knowledge_chunks` | Was **BLOCKED** on `502 GEMINI_API_KEY is required` — unblocked by L1 Task 3 stub path above |

## Meta webhooks

Meta cannot call localhost. Use Cloudflare Tunnel / ngrok when testing webhooks.

## Known fix: order confirm after multi-warehouse

Orgs created without a default warehouse caused `POST /v1/orders/:id/confirm` → `500 orders_failed`.
Migration `20260727210000_ensure_default_warehouse_on_org.sql` creates `Kho chính` / `MAIN` on
org insert and backfills existing orgs. Apply locally with `npx supabase db reset` or
`npx supabase migration up --local`.
