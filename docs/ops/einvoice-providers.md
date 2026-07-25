# E-invoice providers (R2.5 eng)

Engineering path only — **not** live VN tax compliance.

| Env | Required | Default | Meaning |
| --- | --- | --- | --- |
| `EINVOICE_PROVIDER` | no | `stub` | Default provider when `POST /v1/einvoice/issue` omits `provider` |
| `EINVOICE_SANDBOX_URL` | no | unset | POST target for `http_sandbox` (~10s timeout). Unset → deterministic success with note |

## Select provider

1. **Per request:** `POST /v1/einvoice/issue` body `{ "orderId": "<uuid>", "provider": "stub" | "http_sandbox" }`.
2. **Env default:** set `EINVOICE_PROVIDER=http_sandbox` and omit `provider` in the body.
3. **UI:** `/einvoice` issue form can pass `provider` via API client (defaults to stub unless env/UI selects sandbox).

## Behavior

- `stub` — always succeeds (unchanged).
- `http_sandbox` + URL set — POST JSON (order/invoice fields); 2xx → `sent`; non-2xx → `failed`/`dead` with HTTP status in `last_error`.
- `http_sandbox` + URL unset — `sent` with `payload.result.note` that URL was not configured.
