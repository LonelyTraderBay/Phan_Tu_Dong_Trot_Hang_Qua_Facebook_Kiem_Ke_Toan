# Thỏa thuận xử lý dữ liệu (DPA) — bản mẫu pilot

**Phiên bản:** 2026-07-25  
**Bên cung cấp (Processor):** Omni Commerce AI SaaS (“Nhà cung cấp”)  
**Bên kiểm soát (Controller):** Khách hàng shop (“Khách hàng”)

> Đây là **mẫu nội bộ** để ký pilot — chưa thay thế tư vấn luật sư. Điền chỗ trống trước khi dùng.

## 1. Phạm vi

Nhà cung cấp xử lý dữ liệu cá nhân thay mặt Khách hàng để cung cấp dịch vụ: hội thoại Messenger/Instagram, catalog, đơn hàng, AI hỗ trợ bán hàng, xuất dữ liệu.

## 2. Loại dữ liệu

- Định danh liên hệ (tên hiển thị, page/IG scoped id, SĐT E.164 nếu có)  
- Nội dung tin nhắn và metadata kênh  
- Đơn hàng, địa chỉ giao hàng, ghi chú  
- Nhật ký kỹ thuật (request id, org id), `ai_runs`, audit  

## 3. Mục đích xử lý

Cung cấp, bảo trì, bảo mật dịch vụ; không bán dữ liệu; không dùng nội dung tin nhắn khách để huấn luyện mô hình bên thứ ba ngoài cấu hình LLM đã công bố (xem subprocessors).

## 4. Nghĩa vụ Nhà cung cấp

- Chỉ xử lý theo chỉ thị hợp đồng / tài liệu sản phẩm  
- Áp dụng biện pháp kỹ thuật tổ chức phù hợp (mã hóa token kênh, RLS đa thuê bao, kiểm soát truy cập)  
- Thông báo sự cố bảo mật trong thời hạn thỏa thuận (mặc định đề xuất: 72 giờ sau khi biết)  
- Hỗ trợ quyền của chủ thể dữ liệu theo PDPA / chính sách Khách hàng trong phạm vi sản phẩm (export / delete-request)  

## 5. Sub-processors

Danh sách tại [subprocessors.md](./subprocessors.md). Thay đổi material sẽ được thông báo trước khi dùng cho pilot trả phí.

## 6. Lưu trữ & xóa

- Dữ liệu thuộc `org_id` của Khách hàng  
- Khi chấm dứt / yêu cầu xóa: theo runbook PDPA (`docs/runbooks/pdpa-delete.md`) trong thời hạn thỏa thuận (đề xuất: 30 ngày sau xác nhận)

## 7. Chuyển dữ liệu xuyên biên giới

Nếu dùng nhà cung cấp hạ tầng ngoài Việt Nam, Khách hàng được thông báo qua danh sách subprocessors.

## 8. Kiểm tra

Khách hàng có quyền yêu cầu báo cáo kiểm soát hợp lý (questionnaire) trong giờ làm việc; pen-test / SOC2 thuộc lộ trình M4.

## 9. Hiệu lực

Có hiệu lực từ ngày ký đến khi dịch vụ chấm dứt hoặc được thay bằng DPA chính thức.

---

**Chữ ký**

| | Khách hàng | Nhà cung cấp |
|--|------------|--------------|
| Tên | | |
| Chức danh | | |
| Ngày | | |
| Ký | | |
