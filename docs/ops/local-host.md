# Local host mode (PC as server)

Apps run on this machine; database uses Supabase staging cloud
(`tjsmpcgkeoglemptuymu`) because Docker Desktop CLI is not required.

## Start / stop

```powershell
pnpm run dev:local
pnpm run dev:local:stop
```

Or:

```powershell
powershell -File scripts/dev-local.ps1
powershell -File scripts/dev-local.ps1 -Stop
```

## URLs

| App | URL |
|-----|-----|
| Web | http://127.0.0.1:3000 |
| API | http://127.0.0.1:3001/health |
| AI | http://127.0.0.1:8000/health |

Env files (gitignored): `.env`, `apps/web/.env.local`, `apps/ai/.env`.

## Optional: fully local DB

Install/start Docker Desktop, then:

```powershell
npx supabase start
npx supabase db reset
# replace SUPABASE_* in .env with values printed by `supabase status`
```

## Meta webhooks

Meta cannot call localhost. Use Cloudflare Tunnel / ngrok when testing webhooks.
