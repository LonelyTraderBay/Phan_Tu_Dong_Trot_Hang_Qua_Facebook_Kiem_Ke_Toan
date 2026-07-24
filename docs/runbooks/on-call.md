# E3 — On-call tối thiểu

## Monitors (UptimeRobot / Better Stack)

| Check | URL | Interval | Alert |
|-------|-----|----------|-------|
| API health | `https://<api>/health` | 1–5 min | email/SMS |
| AI health | `https://<ai>/health` | 1–5 min | email/SMS |
| Web | `https://<web>/` | 5 min | email |
| Optional webhook probe | GET verify or synthetic | 5 min | email |

## Rotation

| Week | Primary | Backup |
|------|---------|--------|
| (điền) | | |

## Escalate

1. Alert fire → check [meta-down](./meta-down.md) / [ai-down](./ai-down.md) / [db-failover](./db-failover.md)  
2. Nếu webhook miss: always-on + Inngest DLQ  
3. Thông báo khách pilot nếu downtime > 15 phút (template tạm: email owner)

## Status

| Field | Value |
|-------|-------|
| Monitors configured | **NOT RUN** — no uptime account in agent env |
| Test alert fired | |
| On-call named | Owner mặc định đến khi có team |
