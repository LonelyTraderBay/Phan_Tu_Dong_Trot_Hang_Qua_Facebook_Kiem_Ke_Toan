# Omni Commerce

Monorepo for the web app, core API, AI service, and Supabase database used by the Vietnamese omni-commerce operating system.

## Apps

- `apps/web`: Next.js web application — locked port **`4700`**.
- `apps/api`: NestJS core API — locked port **`4701`**.
- `apps/ai`: FastAPI AI service — locked port **`4702`**.
- `supabase`: local database — locked API **`54721`** (+ db/studio/mailpit; see `config/local-ports.json`).
- Port lock (avoid collisions with other repos): [`docs/ops/local-ports.md`](docs/ops/local-ports.md).

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
# Preferred one-shot (uses locked ports from config/local-ports.json):
pnpm run ports:sync
pnpm run dev:local
```

Health checks (locked):

- Web: `http://127.0.0.1:4700`
- API: `http://127.0.0.1:4701/health` and `http://127.0.0.1:4701/ready`
- AI: `http://127.0.0.1:4702/health`
- Inngest: `http://127.0.0.1:4788`
- Supabase: `http://127.0.0.1:54721`

## Quality checks

`pnpm lint` and `pnpm typecheck` both run `tsc --noEmit` via Turbo across `@omni/api`, `@omni/web`, `@omni/authz-types`, and `@omni/db`. There is no ESLint config in this monorepo (Gate A A3: honesty over an empty flat config).

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
npx supabase start
npx supabase db reset
pnpm run ports:sync
pnpm run dev:local
# or manually: API :4701 · AI :4702 · Web :4700 · Inngest :4788
```

Then probe API `/health` and `/ready`, AI `/health`, web shell, `GET /internal/v1/ai/health` with `X-Service-Key`, and insert a `platform.noop` outbox row to confirm Inngest receives it.

## Meta webhook (local)

1. Chạy api: `pnpm run dev:local` (API **:4701**)
2. Tunnel: `cloudflared tunnel --url http://127.0.0.1:4701` (hoặc ngrok)
3. Meta Webhook Callback URL: `https://<tunnel>/v1/webhooks/meta`
4. Verify token = `META_VERIFY_TOKEN`

OAuth redirect (Facebook Login) dùng web app, không qua tunnel API:

- `META_REDIRECT_URI=http://127.0.0.1:4700/settings/channels/callback`
- Trong Meta App → Facebook Login → Valid OAuth Redirect URIs: cùng giá trị trên.

Chạy Inngest (đã gồm trong `dev:local`):

```powershell
npx inngest-cli@latest dev -u http://127.0.0.1:4701/api/inngest -p 4788
```

Xem thêm runbook: [docs/runbooks/meta-down.md](./docs/runbooks/meta-down.md).

## Pilot / Meta App Review (staging)

Trước khi onboard shop pilot hoặc nộp Meta App Review:

1. Deploy staging web + API (always-on; webhook không cold-start).
2. Legal public: `https://<app-host>/legal/privacy` và `/legal/terms`.
3. Webhook prod/staging: `https://<api-host>/v1/webhooks/meta` + `META_VERIFY_TOKEN`.
4. OAuth redirect: `https://<app-host>/settings/channels/callback` (= `META_REDIRECT_URI`).

Checklist đầy đủ (permissions, test Page/IG, screencast): [docs/meta-app-review-checklist.md](./docs/meta-app-review-checklist.md).
