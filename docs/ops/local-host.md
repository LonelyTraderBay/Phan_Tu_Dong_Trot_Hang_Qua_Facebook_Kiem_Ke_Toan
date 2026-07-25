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

## Meta webhooks

Meta cannot call localhost. Use Cloudflare Tunnel / ngrok when testing webhooks.
