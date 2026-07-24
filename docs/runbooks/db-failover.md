# Runbook: DB failover

## Triệu chứng

- API trả 5xx cho nhiều endpoint dùng Supabase.
- Log có lỗi kết nối Postgres, timeout, hoặc auth token không xác minh được.
- Supabase dashboard báo database degraded, unavailable, hoặc maintenance ngoài kế hoạch.

## Kiểm tra

1. Kiểm tra Supabase status page và dashboard project.
2. Gọi health endpoint API và kiểm tra log lỗi Supabase gần nhất.
3. Xác nhận lỗi chỉ ở database hay cả Auth/Storage/Edge.
4. Kiểm tra migration hoặc seed gần nhất có đang chạy dở không.

## Hành động

1. Dừng các job nền có nguy cơ ghi lặp nếu database chập chờn.
2. Không chạy migration thủ công trong lúc failover chưa xác nhận xong.
3. Nếu Supabase hỗ trợ failover trên gói hiện tại, thực hiện theo hướng dẫn Supabase và ghi lại thời điểm chuyển.
4. Sau khi database ổn định, chạy smoke test đọc/ghi tối thiểu cho tenant thử nghiệm.
5. Bật lại job nền theo từng nhóm và theo dõi outbox/inbox backlog.

## Leo thang

- Leo thang cho owner database nếu downtime quá 10 phút hoặc có nguy cơ mất dữ liệu.
- Liên hệ Supabase support nếu dashboard xác nhận sự cố hạ tầng.
- Leo thang cho owner sản phẩm nếu cần tạm dừng luồng bán hàng hoặc thông báo khách hàng.
