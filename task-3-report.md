Task 3 report
- Added `GET /v1/orders/export?format=csv|xlsx|pdf` before `:orderId`; requires `orders.export` and `X-Org-Id`.
- Optional filters: `status`, `createdFrom`, `createdTo` (ISO datetime); export cap 5000 rows.
- CSV native; XLSX via exceljs; PDF minimal Helvetica text (no extra dep).
- Shared `fetchOrderRows`; list still capped at 100.
- OpenAPI stub for export download responses.
- Test: CSV export returns non-empty buffer with order data (98/98 API tests pass).
