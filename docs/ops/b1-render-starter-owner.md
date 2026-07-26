# B1 — Nâng Render Starter ×3 (Owner)

**Mục tiêu:** Always-on staging (R0.2 GREEN) để webhook Meta không miss vì cold-start.  
**Ai làm:** Owner (có thể thanh toán). Agent **không** thêm thẻ / payment.  
**SoT liên quan:** [deploy-staging-render.md](./deploy-staging-render.md) · [SDD B1](../superpowers/plans/2026-07-27-sdd-b1-render-starter.md) · [post-audit](../superpowers/plans/2026-07-27-completion-priority-post-audit.md)

## Dịch vụ staging hiện tại

| App | Service | URL | Plan blueprint |
|-----|---------|-----|----------------|
| API | `omni-api-staging` | https://omni-api-staging-cs2w.onrender.com | `free` trong `render.yaml` |
| AI | `omni-ai-staging` | https://omni-ai-staging.onrender.com | `free` |
| Web | `omni-web-staging` | https://omni-web-staging.onrender.com | `free` |

**Lưu ý:** Workflow keep-warm ping mỗi ~10 phút chỉ giúp **AMBER** (còn sleep/cold-start). **Không** đủ để đánh GREEN R0.2.

## Checklist owner (thứ tự)

| # | Bước | Chi tiết | Xong khi |
|---|------|----------|----------|
| 1 | Thêm payment | https://dashboard.render.com/u/billing → **Add payment method** | Thẻ/billing OK |
| 2 | Starter API | https://dashboard.render.com/web/srv-d9i2sjbeo5us7394purg → Settings → Instance Type → **Starter** → Save | Plan = Starter |
| 3 | Starter AI | https://dashboard.render.com/web/srv-d9i2skbrjlhs73e95lsg → tương tự | Plan = Starter |
| 4 | Starter Web | https://dashboard.render.com/web/srv-d9i2sl3h2c0s73823lqg → tương tự | Plan = Starter |
| 5 | (Tuỳ chọn) Đồng bộ blueprint | Trong repo: `render.yaml` đổi `plan: free` → `plan: starter` cho cả 3 service, commit/PR | Blueprint khớp Dashboard |
| 6 | Chứng minh no cold-start | Sau 15–30 phút idle, từ mạng ngoài: `curl` 3 URL (dưới) — HTTP 200 nhanh, không trang "Application loading" dài | Bằng chứng ghi evidence |
| 7 | Báo eng | Gửi screenshot plan Starter + kết quả curl (hoặc comment PR) | Eng đánh R0.2 **GREEN** |

## Lệnh verify (sau khi Starter)

```powershell
curl.exe -sS -o NUL -w "api %{http_code} %{time_total}s`n" https://omni-api-staging-cs2w.onrender.com/health
curl.exe -sS -o NUL -w "ai  %{http_code} %{time_total}s`n" https://omni-ai-staging.onrender.com/health
curl.exe -sS -o NUL -w "web %{http_code} %{time_total}s`n" https://omni-web-staging.onrender.com/
```

Kỳ vọng sau Starter: lần gọi sau idle vẫn nhanh (không 30–90s cold-start như Free).

## Khi nào R0.2 = GREEN

- Bước 2–4 xong **và**
- Bước 6 có bằng chứng no-cold-start **và**
- Evidence ledger cập nhật (eng)

## Khi nào vẫn BLOCKED

- Chưa payment / còn `plan: free` trên Dashboard
- Chỉ có keep-warm 3/3 mà chưa Starter
- Probe local TLS fail mà không có bằng chứng mạng ngoài sau Starter

## Bước tiếp theo sau B1 GREEN

→ **B2** `META_*` thật trên staging + App Review submit  
→ **B3** Walkthrough staging §12.1 → Gate R0
