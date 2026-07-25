# Deploy staging â€” Render (ADR 0001)

## Project linkage

| App | Render service | Live URL | Supabase |
|-----|----------------|----------|----------|
| `apps/api` | `omni-api-staging` | https://omni-api-staging-cs2w.onrender.com | `tjsmpcgkeoglemptuymu` |
| `apps/ai` | `omni-ai-staging` | https://omni-ai-staging.onrender.com | â€” |
| `apps/web` | `omni-web-staging` | https://omni-web-staging.onrender.com | same staging project |

Blueprint file: [`render.yaml`](../../render.yaml) (currently **free** plan â€” sleeps; upgrade to **starter** when payment added).

## One-shot (Dashboard)

1. Open https://dashboard.render.com/blueprints  
2. **New Blueprint Instance** â†’ connect GitHub repo `LonelyTraderBay/Phan_Tu_Dong_Trot_Hang_Qua_Facebook_Kiem_Ke_Toan`  
3. Branch `main`, path `render.yaml`  
4. Fill `sync: false` env vars (see below)  
5. **Deploy Blueprint**

## Env values to paste (staging Supabase)

```
SUPABASE_URL=https://tjsmpcgkeoglemptuymu.supabase.co
SUPABASE_ANON_KEY=<from supabase projects api-keys>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
NEXT_PUBLIC_SUPABASE_URL=https://tjsmpcgkeoglemptuymu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
META_APP_ID=<your meta app>
META_APP_SECRET=<secret>
META_VERIFY_TOKEN=<8+ chars>
META_REDIRECT_URI=https://omni-web-staging.onrender.com/settings/channels/callback
NEXT_PUBLIC_API_BASE_URL=https://omni-api-staging-cs2w.onrender.com
```

`TOKEN_ENCRYPTION_KEY` / `SERVICE_M2M_KEY` set via Render API (also in local `.local-secrets/`).

## CLI / CI (API key)

```bash
# https://dashboard.render.com/u/settings#api-keys
export RENDER_API_KEY=rnd_...
# Then open Blueprint in dashboard once (CLI cannot create Blueprint from YAML without dashboard link yet for first time).
# Subsequent deploys:
render deploys create <SERVICE_ID> --confirm
```

GitHub secret optional: `RENDER_API_KEY` for workflow re-deploys.

## Verify

```bash
curl -sS https://<api>/health
curl -sS https://<ai>/health
curl -sS -o /dev/null -w "%{http_code}\n" https://<web>/
```

## Status

| Field | Value |
|-------|-------|
| Blueprint committed | YES â€” `render.yaml` |
| Live services | **LIVE (free)** — api/ai/web; API Nest started on Node 22 (`49cc493`) |
| Supabase staging | `tjsmpcgkeoglemptuymu` migrated |
