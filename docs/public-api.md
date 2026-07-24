# Public API and outbound webhooks

Plan G exposes a minimal enterprise integration surface for order reads. It is
AMBER by design: keys, read-only orders, webhook registration, and signed test
pings exist; broader resources, pagination contracts, and live delivery workers
remain future work.

## API keys

Owners manage keys through authenticated Core API routes with
`X-Org-Id` and `public_api.keys.manage` permission:

- `POST /v1/public-api/keys`
  - Body: `{ "name": "ERP", "scopes": ["orders.read"] }`
  - Response includes `key` once. Store it immediately.
- `GET /v1/public-api/keys`
  - Lists key metadata: id, name, prefix, scopes, revokedAt, createdAt.
  - Does not return key hashes or full secrets.
- `POST /v1/public-api/keys/{keyId}/revoke`
  - Sets `revokedAt`; revoked keys are rejected.

Keys start with `omni_`. The database stores only `key_prefix` and SHA-256
`key_hash`.

## Public order read

External systems call:

```http
GET /public/v1/orders?status=confirmed&limit=100
Authorization: Bearer omni_xxx
```

Supported scope: `orders.read`.

Response:

```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "confirmed",
      "paymentMethod": "cod",
      "customerName": "Nguyen Van A",
      "phoneE164": "+84901234567",
      "currency": "VND",
      "totalVnd": "150000",
      "createdAt": "2026-07-27T12:00:00.000Z",
      "updatedAt": "2026-07-27T12:00:00.000Z"
    }
  ]
}
```

The route is read-only and scoped to the organization that owns the API key.

## Outbound webhooks

Owners manage customer webhook endpoints:

- `POST /v1/public-api/webhooks`
  - Body:
    ```json
    {
      "url": "https://erp.example.test/webhooks/omni",
      "events": ["order.created", "order.updated"],
      "secret": "optional-customer-secret",
      "enabled": true
    }
    ```
  - `url` must be HTTPS.
  - `secret` is encrypted at rest and returned only once. If omitted, Core
    generates one.
- `GET /v1/public-api/webhooks`
- `PATCH /v1/public-api/webhooks/{webhookId}`
  - Body supports `enabled` and `events`.
- `POST /v1/public-api/webhooks/{webhookId}/test`
  - Sends a signed `webhook.test` ping to the configured URL.

## Signature verification

Each test ping uses these headers:

- `X-Omni-Event: webhook.test`
- `X-Omni-Timestamp: <unix seconds>`
- `X-Omni-Signature: sha256=<hex hmac>`

The HMAC input is:

```text
<timestamp>.<raw JSON body>
```

Verify with HMAC-SHA256 using the webhook secret. Reject old timestamps and
compare signatures in constant time in production receivers.

## Content calendar auto-post note

`content_calendar_items.auto_post_enabled` is stored for future workflow
planning only. Plan G does not implement Meta auto-post, background publishing,
or provider sends. `/calendar` and audit metadata both state that any post still
requires human action.
