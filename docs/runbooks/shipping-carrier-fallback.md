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
- If GHN returns `carrier_not_configured`, add a token to the GHN connection or use the manual provider.
- If GHN returns `carrier_disabled`, re-enable the connection only after confirming the carrier path is safe.

Export remains the supported fallback while carrier integrations are unavailable.
