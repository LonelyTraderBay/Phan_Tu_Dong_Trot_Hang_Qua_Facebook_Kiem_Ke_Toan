# ADR 0004 — Billing: invoice + plan flags (Phase 1 / M3 first)

**Status:** Accepted  
**Date:** 2026-07-25  
**Context:** Plan E M3.5 / P0.4 — chọn Stripe vs PayOS vs invoice+flags.

## Decision

**Phase M3 đầu:** dùng **invoice thủ công + `organizations.plan` + bảng `entitlements`** (cờ gói), không tích hợp Stripe/PayOS charge tự động.

## Why

- Free-first / YAGNI: chưa có volume thanh toán  
- Entitlements DB + AI token quota đã có  
- Invoice đủ cho pilot trả phí ít khách  
- Stripe/PayOS thêm sau khi có ≥N khách trả tiền ổn định (Plan F 2G)

## Plan catalog (initial)

| `plan` | `max_pages` | `ai_monthly_token_limit` | `auto_confirm_allowed` |
|--------|-------------|--------------------------|------------------------|
| `free` | 1 | 100_000 | false |
| `pilot` | 2 | 2_000_000 | true |
| `starter` | 5 | 10_000_000 | true |
| `enterprise` | 50 | 100_000_000 | true |

Admin/`ops` cập nhật plan → sync entitlements. Thu tiền: hóa đơn ngoài hệ thống; suspend qua admin-ops nếu quá hạn.

## Consequences

- Cần API ops đổi plan + enforce `max_pages` / `auto_confirm_allowed`  
- Portal khách / dunning tự động = Plan F 2G  
- ADR này thay thế quyết định “chưa chọn” trong P0.4
