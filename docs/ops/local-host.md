# Local host mode (PC as server)

Full local stack: Supabase (Docker) + API + Web + AI on this machine.

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

Product create enqueues `knowledge.reindex` via outbox → Inngest. Without a local Inngest
dev server (or valid `INNGEST_EVENT_KEY`), chunks stay empty even though the product exists.

```powershell
# separate terminal while API is running
npx inngest-cli@latest dev -u http://127.0.0.1:3001/api/inngest
```

## Meta webhooks

Meta cannot call localhost. Use Cloudflare Tunnel / ngrok when testing webhooks.

## Known fix: order confirm after multi-warehouse

Orgs created without a default warehouse caused `POST /v1/orders/:id/confirm` → `500 orders_failed`.
Migration `20260727210000_ensure_default_warehouse_on_org.sql` creates `Kho chính` / `MAIN` on
org insert and backfills existing orgs. Apply locally with `npx supabase db reset` or
`npx supabase migration up --local`.
