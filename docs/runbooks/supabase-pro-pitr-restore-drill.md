# E0 — Supabase Pro + PITR + restore drill

## Upgrade checklist

1. [ ] Production project → **Pro**  
2. [ ] Enable **PITR**  
3. [ ] Confirm staging project is separate  
4. [ ] Record project refs in private ops vault (not git)

## Restore drill (bắt buộc 1 lần)

1. Chọn timestamp PITR (hoặc backup) trên **staging clone** hoặc project phụ — **không** overwrite prod lần đầu.  
2. Restore vào project tạm.  
3. Verify: `organizations` count, 1 order sample, RLS still on.  
4. Ghi log dưới đây + đính kèm screenshot private.

## Drill log

| Field | Value |
|-------|-------|
| Date | **NOT RUN** — no Supabase Pro credentials in agent env |
| Operator | |
| Source project | |
| Target project | |
| PITR timestamp | |
| Verify SQL result | |
| RPO/RTO observed | |
| Issues | |

## Gate

Plan E DoD yêu cầu dòng Date ≠ NOT RUN trước khi claim M3.1 xanh.
