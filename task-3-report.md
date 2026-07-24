Task 3 report
- Added `GET /v1/orders/export?format=csv|xlsx|pdf` before `:orderId`; requires `orders.export` and `X-Org-Id`.
- Optional filters: `status`, `createdFrom`, `createdTo` (ISO datetime); export cap 5000 rows.
- CSV native; XLSX via exceljs; PDF minimal Helvetica text (no extra dep).
- Shared `fetchOrderRows`; list still capped at 100.
- OpenAPI stub for export download responses.
- Test: CSV export returns non-empty buffer with order data (98/98 API tests pass).

Follow-up (Important findings)
- Export headers switched to Vietnamese (`Mã đơn`, `Địa chỉ`, `Mã SKU`, `Số lượng`, `Tên sản phẩm`, …).
- Export rows now one line per order item (order fields repeated); includes `address_text`, SKU, qty, title for fulfillment.
- Export fetch uses `ORDER_WITH_ITEMS_SELECT`; orders without items still emit one row.
- PDF paginates (~50 lines/page) instead of truncating at one page.
- Test asserts VI header line plus address and line-item columns in CSV output.
