# Runbook — Phase 3 Intelligence

## Scope

Plan G covers ads spend import, attribution, owner advisor, content calendar,
public API keys, and outbound webhook test pings.

## Daily checks

1. Run `pnpm --filter api test` before release.
2. Spot-check `/ads`, `/attribution`, `/advisor`, and `/calendar` with a pilot
   org.
3. Confirm `GET /public/v1/orders` works with a non-revoked `omni_` key and
   fails after revoke.
4. Send one webhook test ping and verify the receiver validates
   `X-Omni-Signature`.

## Guardrails

- Do not claim CPC from Plan G. Plan H remains required.
- Content calendar `autoPostEnabled` is stored only. No Meta auto-post,
  background publishing, or provider send exists in Plan G.
- Owner Advisor is advice-only. It must not mutate business tables or buy ads.
- Public API keys are secrets; only `key_prefix` and `key_hash` should be stored
  or logged.
- Outbound webhook secrets are encrypted at rest and returned only once.

## Incident response

### Public API key suspected leaked

1. Revoke the key through `POST /v1/public-api/keys/{keyId}/revoke`.
2. Create a replacement key for the owner.
3. Review `audit_logs` for `public_api.key_created` and
   `public_api.key_revoked`.
4. Ask the customer to rotate the secret in downstream systems.

### Webhook test ping fails

1. Confirm the webhook is enabled and the URL is HTTPS.
2. Retry `POST /v1/public-api/webhooks/{webhookId}/test`.
3. Verify customer receiver checks HMAC input as
   `<timestamp>.<raw JSON body>`.
4. If receiver is down, disable the webhook until the customer confirms
   recovery.

### Calendar auto-post confusion

1. Confirm no job/provider send was triggered; Plan G has no such code path.
2. Point owner to `/calendar` warning and `docs/public-api.md`.
3. If the owner needs publishing automation, capture it for a future plan after
   Meta App Review and human approval controls.

## Release evidence

- API tests: `pnpm --filter api test`.
- Optional extra checks: `pnpm --filter api lint`, `pnpm --filter web lint`.
- Evidence file: `docs/superpowers/plans/plan-g-dod-evidence.md`.
