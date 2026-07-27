# Shipping carrier fallback runbook

Use this when GHN sandbox/mock shipment creation fails, carrier credentials are missing, or the carrier connection is disabled.

## Fallback path

1. In **Orders**, filter confirmed orders and export the current list as Excel (`XLSX`).
2. Hand the export to the warehouse/carrier operator.
3. Create a manual shipment from the order action **Tạo vận đơn**.
4. Record the manual tracking code (`MANUAL-{order}`) in the carrier handoff notes.

## Operational notes

- Money remains integer VND (`fee_vnd`, `shipping_fee_vnd`).
- Carrier secrets must be stored only through carrier connections; API responses must not include credentials.
- If GHN returns `carrier_not_configured`, the connection is missing either `credentials.token` or `config.sandboxUrl`. Add them, or use the manual provider.
- If GHN returns `carrier_disabled`, re-enable the connection only after confirming the carrier path is safe.

## GHN mock mode (`config.allowMock`) — dev/demo only

The GHN provider **fails closed**. Without `config.sandboxUrl` it refuses to create
a shipment rather than fabricating one.

`config.allowMock: true` re-enables a fabricated `GHN-MOCK-*` shipment for local
demos. When that path is taken the shipment row is still written for
traceability, but the flow deliberately stops there:

| Side effect | Real / sandbox shipment | `allowMock` shipment |
|---|---|---|
| `shipments` row | written | written (`raw_json.mode = 'mock'`) |
| `orders.shipping_fee_vnd` | updated | **not touched** |
| `ship_order` RPC (`confirmed` → `shipped`) | called | **not called** |
| COD expectation | created | **not created** |
| Audit action | `shipment.created` | `shipment.created_mock` |

Rationale: a mock fee is *unknown*, not zero. Writing `0` used to flow straight
into P&L and COD reconciliation, so a demo shipment silently corrupted the shop's
books. **Never set `allowMock` on a production org.**

Export remains the supported fallback while carrier integrations are unavailable.
