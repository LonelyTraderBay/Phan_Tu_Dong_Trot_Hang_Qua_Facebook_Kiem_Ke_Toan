# Runbook: Meta down

## Triệu chứng

- Khách nhắn DM Facebook Page nhưng hội thoại không xuất hiện trên Omni.
- Webhook Meta trả lỗi hoặc timeout khi Meta gửi sự kiện tới `/v1/webhooks/meta`.
- Log API có `meta_signature_invalid`, `meta_verify_failed`, hoặc lỗi Graph API khi đồng bộ kênh.
- Một tenant bị ảnh hưởng trong khi tenant khác vẫn nhận tin (thường do page chưa nối hoặc token hết hạn).

## Kiểm tra

1. **Meta platform status** — [Meta for Developers status](https://developers.facebook.com/status/) và trang trạng thái Facebook nếu lỗi hàng loạt.
2. **Webhook subscription** — Trong Meta App → Webhooks: Callback URL trỏ đúng `https://<host>/v1/webhooks/meta`, Verify Token khớp `META_VERIFY_TOKEN`, field `messages` đã subscribe.
3. **Chữ ký và log API** — Tìm request tới `/v1/webhooks/meta`:
   - `401` + `meta_signature_invalid` → sai `META_APP_SECRET` hoặc body bị proxy sửa.
   - `401` + `meta_verify_failed` → Verify Token không khớp khi Meta gọi GET subscribe.
   - `5xx` hoặc timeout → API/tunnel/host không reachable; Meta sẽ retry.
4. **`webhook_receipts`** — Xác nhận webhook đã vào cửa API (dedupe theo `provider` + `receipt_key`):

```sql
select id, provider, receipt_key, org_id, payload_hash, received_at
from public.webhook_receipts
where provider = 'meta'
order by received_at desc
limit 20;
```

- Có row mới sau thời điểm DM → webhook đã nhận; lỗi ở bước enqueue/persist.
- Không có row → webhook chưa tới API (tunnel, URL, subscription, hoặc page chưa map `channel_connections`).

5. **`outbox_events` unpublished** — Sau receipt, event `meta/persist_inbound` phải được publish sang Inngest:

```sql
select id, org_id, event_name, attempts, published_at, created_at
from public.outbox_events
where event_name = 'meta/persist_inbound'
  and published_at is null
order by created_at desc
limit 20;
```

- Nhiều row `published_at is null` + `attempts` tăng → Inngest dev/prod không nhận event hoặc outbox publisher lỗi.
- Kiểm tra API log `OutboxPublisher` và Inngest dashboard (runs cho `meta/persist_inbound`).

6. **Inngest DLQ** — Event hết retry được ghi `job_dead_letters`:

```sql
select id, job_name, org_id, payload_json, error_message, created_at
from public.job_dead_letters
where job_name = 'meta/persist_inbound'
order by created_at desc
limit 20;
```

- Có dead letter → xem `error_message`, sửa dữ liệu/schema/org mapping rồi replay thủ công nếu cần (chỉ sau khi hiểu nguyên nhân).

7. **Kênh đã nối** — Page ID trong webhook phải khớp `channel_connections.external_page_id`:

```sql
select org_id, provider, external_page_id, status, updated_at
from public.channel_connections
where provider = 'meta';
```

## Hành động

1. **Local dev** — Bật tunnel tới API `:3001`, không tunnel web `:3000` cho webhook. OAuth redirect vẫn là `http://127.0.0.1:3000/settings/channels/callback`.
2. **Chữ ký sai** — Đối chiếu `META_APP_SECRET` với Meta App; đảm bảo reverse proxy không parse lại body JSON.
3. **Outbox kẹt** — Restart API (outbox publisher chạy trong process), bật Inngest dev: `npx inngest-cli@latest dev -u http://localhost:3001/api/inngest`.
4. **Token/page** — Tenant reconnect kênh qua Settings → Kết nối kênh nếu token revoked hoặc page đổi.
5. **Meta outage** — Không retry mạnh phía client; để Meta retry webhook; giữ receipt/outbox để replay khi platform hồi phục.
6. **Dead letter** — Ghi nhận `org_id` + payload, sửa lỗi gốc trước khi replay; không xóa receipt để tránh duplicate ingest.

## Leo thang

- Leo thang cho owner tích hợp Meta khi: webhook verify liên tục fail sau khi đã đối chiếu secret/token; DLQ tăng nhanh; hoặc nhiều tenant mất DM > 15 phút.
- Leo thang cho owner hạ tầng nếu tunnel/host API không stable trước khi có khách thật.
- Mở incident vận hành nếu cần tạm ngắt webhook subscription hoặc thông báo khách hàng bị ảnh hưởng.
