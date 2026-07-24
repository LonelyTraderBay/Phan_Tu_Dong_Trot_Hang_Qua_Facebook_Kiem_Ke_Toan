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
- API: `http://127.0.0.1:3001`
- AI: `http://127.0.0.1:8000/health`

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
python tests/eval/run_stub.py
```
