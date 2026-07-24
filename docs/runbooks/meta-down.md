# Runbook: Meta down

## Trạng thái

Stub cho giai đoạn sau.

## Triệu chứng

- Webhook, Graph API, hoặc luồng đồng bộ Facebook/Meta bị lỗi hàng loạt.

## Kiểm tra

- Kiểm tra Meta status page, log webhook, và tỷ lệ lỗi API theo tenant.

## Hành động

- Tạm dừng retry mạnh để tránh vượt rate limit.
- Ghi nhận tenant bị ảnh hưởng và giữ dữ liệu chờ xử lý để replay sau.

## Leo thang

- Leo thang cho owner tích hợp Meta khi bắt đầu triển khai connector thực tế.
