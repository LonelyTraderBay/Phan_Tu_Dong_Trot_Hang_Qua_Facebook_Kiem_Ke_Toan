# Omni Commerce

Monorepo for the web app, core API, AI service, and Supabase database used by the Vietnamese omni-commerce operating system.

## Apps

- `apps/web`: Next.js web application, default port `3000`.
- `apps/api`: NestJS core API, default port `3001`.
- `apps/ai`: FastAPI AI service, default port `8000`.
- `supabase`: local database config, migrations, and development seed.

## Prerequisites

- Node.js with Corepack and `pnpm@9.15.0`.
- Python `3.12`.
- `uv` for the AI service.
- Supabase CLI and Docker for local Supabase.

## Environment

Copy the example file and fill in local Supabase values after `supabase start` prints them:

```powershell
Copy-Item .env.example .env
```

For PowerShell terminals that run Node apps, load `.env` into the current process:

```powershell
Get-Content .env | Where-Object { $_ -and $_ -notmatch '^\s*#' } | ForEach-Object { $name,$value = $_ -split '=',2; [Environment]::SetEnvironmentVariable($name,$value,'Process') }
```

## Run Supabase

```powershell
supabase start
supabase db reset
```

Use the local API URL, anon key, and service role key printed by Supabase to update:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Install dependencies

```powershell
corepack enable
pnpm install
cd apps/ai
uv sync
cd ../..
```

## Run all three apps

Open separate terminals from the repo root.

API:

```powershell
Get-Content .env | Where-Object { $_ -and $_ -notmatch '^\s*#' } | ForEach-Object { $name,$value = $_ -split '=',2; [Environment]::SetEnvironmentVariable($name,$value,'Process') }
pnpm --dir apps/api dev
```

Web:

```powershell
Get-Content .env | Where-Object { $_ -and $_ -notmatch '^\s*#' } | ForEach-Object { $name,$value = $_ -split '=',2; [Environment]::SetEnvironmentVariable($name,$value,'Process') }
pnpm --dir apps/web dev
```

AI:

```powershell
Copy-Item .env apps/ai/.env -Force
cd apps/ai
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health checks:

- Web: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:3001/health` and `http://127.0.0.1:3001/ready`
- AI: `http://127.0.0.1:8000/health`

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:isolation
cd apps/ai
uv run pytest -q
cd ../..
python tests/eval/run_stub.py
```

## Manual smoke

Requires Docker, Supabase, API, AI, web, and Inngest dev services:

```powershell
supabase start
supabase db reset
pnpm --dir apps/api dev
Push-Location apps/ai
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
Pop-Location
pnpm --dir apps/web dev
npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
```

Then probe API `/health` and `/ready`, AI `/health`, web shell, `GET /internal/v1/ai/health` with `X-Service-Key`, and insert a `platform.noop` outbox row to confirm Inngest receives it.

## Meta webhook (local)

1. Chạy api: `pnpm --filter @omni/api dev`
2. Tunnel: `cloudflared tunnel --url http://127.0.0.1:3001` (hoặc ngrok)
3. Meta Webhook Callback URL: `https://<tunnel>/v1/webhooks/meta`
4. Verify token = `META_VERIFY_TOKEN`

OAuth redirect (Facebook Login) dùng web app, không qua tunnel API:

- `META_REDIRECT_URI=http://127.0.0.1:3000/settings/channels/callback`
- Trong Meta App → Facebook Login → Valid OAuth Redirect URIs: cùng giá trị trên.

Chạy Inngest dev khi test luồng webhook → persist:

```powershell
npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
```

Xem thêm runbook: [docs/runbooks/meta-down.md](./docs/runbooks/meta-down.md).

## Pilot / Meta App Review (staging)

Trước khi onboard shop pilot hoặc nộp Meta App Review:

1. Deploy staging web + API (always-on; webhook không cold-start).
2. Legal public: `https://<app-host>/legal/privacy` và `/legal/terms`.
3. Webhook prod/staging: `https://<api-host>/v1/webhooks/meta` + `META_VERIFY_TOKEN`.
4. OAuth redirect: `https://<app-host>/settings/channels/callback` (= `META_REDIRECT_URI`).

Checklist đầy đủ (permissions, test Page/IG, screencast): [docs/meta-app-review-checklist.md](./docs/meta-app-review-checklist.md).
