# Plan F Phase 2 load-test notes

Heavy load was not run for Wave 2H. These notes define the first lightweight checks to run on staging before a live pilot batch.

## Suggested tools

- `k6` for scripted authenticated flows with `Authorization` and `X-Org-Id` headers.
- `hey` for quick smoke pressure on simple GET endpoints.
- Keep test data isolated to one staging org and one staging user.

## Target endpoints

Start with read-heavy paths:

- `GET /v1/inventory/low-stock?threshold=5`
- `GET /v1/inventory/movements?limit=50`
- `GET /v1/cod/report`
- `GET /v1/pnl/summary?from=<date>&to=<date>`
- `GET /v1/pnl/by-sku?from=<date>&to=<date>`
- `GET /v1/billing/plan`
- `GET /v1/billing/usage`

Then add low-rate write paths with seeded disposable orders/SKUs:

- `POST /v1/inventory/adjust`
- `POST /v1/shipping/shipments`
- `POST /v1/cod/collections`
- `POST /v1/cod/reconcile/batch`
- `POST /v1/orders/:orderId/return`
- `POST /v1/channels/zalo/webhook`

## Example commands

```bash
hey -z 60s -c 20 -H "Authorization: Bearer $TOKEN" -H "X-Org-Id: $ORG_ID" "$API_URL/v1/cod/report"
```

```bash
k6 run -e API_URL="$API_URL" -e TOKEN="$TOKEN" -e ORG_ID="$ORG_ID" tests/load/phase2-smoke.js
```

## Pass criteria

- 0 HTTP 5xx responses.
- p95 latency under 500 ms for read endpoints at light staging load.
- p95 latency under 1000 ms for mutation endpoints at low write concurrency.
- No cross-org rows in responses when run with two org fixtures.
- No duplicate ledger, shipment, COD, return, webhook receipt, or invoice rows after idempotent retries.
- API logs do not include secrets, raw tokens, or customer PII beyond approved redacted fields.
