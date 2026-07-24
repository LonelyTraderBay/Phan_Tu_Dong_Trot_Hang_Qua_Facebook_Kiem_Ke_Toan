# Task 8 Report — B7 Web VI — Kết nối kênh

## Status
**Complete** — channel connect settings page, API client helper, dashboard link.

## Changes
- **`apps/web/src/lib/api-client.ts`** — `apiFetch` using `buildApiHeaders`; auth from `omni.accessToken` + `getActiveOrgId()` localStorage stubs; `NEXT_PUBLIC_API_BASE_URL` only (no Meta secrets).
- **`apps/web/src/app/(app)/settings/channels/page.tsx`** — VI UI: connect button → `GET /v1/channels/meta/oauth-url` then redirect; table (provider, page id, status); empty state “Chưa kết nối trang nào”; no token display.
- **`apps/web/src/app/(app)/dashboard/page.tsx`** — link “Kết nối kênh →” to `/settings/channels`.

## Test run
```
pnpm --filter @omni/web typecheck
PASS (tsc --noEmit)
```

## Commit
`feat(web): vi channel connect settings page`

## Notes
- OAuth uses full-page redirect (not popup + `POST .../complete`); API owns callback via `META_REDIRECT_URI`.
- Page requires stubbed `omni.accessToken` and `omni.activeOrgId` in localStorage until real auth ships.

## Concerns
- No web unit tests for `api-client` yet (only existing `org-context.test.ts`).
- Real Supabase session wiring deferred to auth task.

## Fix — OAuth completion (Important finding)
- **`apps/web/src/lib/api-client.ts`** — `completeMetaOAuth(code)` → `POST /v1/channels/meta/complete`.
- **`apps/web/src/app/(app)/settings/channels/callback/page.tsx`** — reads `code` / Meta `error` from query; completes OAuth with JWT + org headers; redirects to `/settings/channels` with VI success/error.
- **`apps/web/src/app/(app)/settings/channels/page.tsx`** — shows OAuth success/error banner from redirect query params.
- **`.env.example`** — `META_REDIRECT_URI=http://127.0.0.1:3000/settings/channels/callback` (web port 3000, not API callback).

### Test run (fix)
```
pnpm --filter @omni/web typecheck
PASS (tsc --noEmit)
```

### Commit (fix)
`fix(web): meta oauth callback via web complete endpoint`
