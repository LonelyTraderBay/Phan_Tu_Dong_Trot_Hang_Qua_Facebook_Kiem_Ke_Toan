Task 2 report
- Added OrdersModule under /v1/orders: list/get/create draft/confirm/cancel/ship.
- Confirm/cancel/ship use service-role SQL RPCs; confirm decrements stock atomically and cancel restores confirmed unshipped stock.
- Create/confirm persist Idempotency-Key responses via idempotency_keys.
- Staff create validates E.164 phones and returns VND bigint money as strings.
- org settings_json auto_confirm triggers confirm with audit meta.
- Added order lifecycle audit for confirm/cancel/ship.
- Added orders.confirm permission and OpenAPI order stubs.
- Tests: API 96/96, authz 7/7, workspace typecheck clean.

Review fixes:
- @HttpCode(200) on confirm/cancel/ship POSTs.
- Confirm uses orders.approve (removed orders.confirm).
- Idempotency claims key (status 102 pending) before side effects; concurrent same-key returns 409, single audit.
- Tests: authz orders.approve matrix; idempotency concurrent confirm spec.
