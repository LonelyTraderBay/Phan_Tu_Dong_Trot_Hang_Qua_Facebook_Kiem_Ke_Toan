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

## Knowledge reindex (`knowledge_chunks`)

Product create enqueues `knowledge.reindex` via outbox → Inngest → AI embed → `replace_knowledge_chunks`.
Without a local Inngest dev server **and** `GEMINI_API_KEY`, chunks stay empty even though the product exists.

```powershell
# separate terminal while API is running (must be up before outbox publishes)
npx inngest-cli@latest dev -u http://127.0.0.1:3001/api/inngest
```

Set `GEMINI_API_KEY` in repo `.env` and `apps/ai/.env`, then restart AI (`pnpm run dev:local` or restart AI process).

### E0.2 local verify (2026-07-25 · sdd-task-2)

| Step | Result |
|------|--------|
| Stack health (api/ai/supabase) | **PASS** — `/health` 200 on 3001 + 8000; Supabase @ 54321 |
| Inngest dev | **PASS** — `inngest-cli@1.38.1` on `:8288`; apps synced to `http://127.0.0.1:3001/api/inngest` |
| `POST /v1/catalog/products` | **PASS** — product + variant created (`539c1233-…`) |
| `outbox_events` `knowledge.reindex` | **PASS** — `published_at` set when Inngest dev running (2 rows) |
| `knowledge_chunks` count | **BLOCKED** — `0`; Inngest `knowledge-reindex` → AI `502 GEMINI_API_KEY is required for embeddings` |

**Owner to unblock chunks:** add `GEMINI_API_KEY` to `.env` + `apps/ai/.env`, restart AI, keep Inngest dev running, create product (or reset outbox `attempts`/`published_at`), then:

```powershell
docker exec supabase_db_omni-commerce psql -U postgres -d postgres -t -c "select count(*) from knowledge_chunks;"
```

Expect `> 0`. Do not claim PASS until then.

## Meta webhooks

Meta cannot call localhost. Use Cloudflare Tunnel / ngrok when testing webhooks.

## Known fix: order confirm after multi-warehouse

Orgs created without a default warehouse caused `POST /v1/orders/:id/confirm` → `500 orders_failed`.
Migration `20260727210000_ensure_default_warehouse_on_org.sql` creates `Kho chính` / `MAIN` on
org insert and backfills existing orgs. Apply locally with `npx supabase db reset` or
`npx supabase migration up --local`.
