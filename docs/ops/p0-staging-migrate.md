# P0.5 — Apply migrations on staging

## Order

All files under `supabase/migrations/` apply in filename order. After Plan D, critical ones include:

- `20260725*` meta / catalog / AI / draft orders  
- `20260726*` orders lifecycle / RPCs  

## Commands (local / CI-like)

```bash
# Link staging project (once)
npx supabase link --project-ref <STAGING_PROJECT_REF>

# Dry review
npx supabase db push --dry-run

# Apply
npx supabase db reset   # destructive, staging only — OR
npx supabase db push    # forward migrations
```

## Verify

```sql
select tablename from pg_tables where schemaname = 'public'
  and tablename in ('orders','order_items','idempotency_keys','knowledge_chunks','ai_runs');
```

## Status log

| Date | Operator | Command | Result |
|------|----------|---------|--------|
| 2026-07-25 | agent | GitHub **Migrate Check** (`supabase start` + `db reset` on CI) | **GREEN** — SQL migrations apply cleanly in CI |
| 2026-07-25 | agent | Remote staging `db push` → `lrcsbrmqlyvkxxspbezi` (`Phan_mem_ban_hang_online-staging`) | **GREEN** — repaired orphan remote history then pushed 26 local migrations; verified `public.organizations/orders/stock_movements/warehouses` |
| 2026-07-25 | agent | Note | Staging still has legacy schema `app.*` from prior product (left intact; new app uses `public.*`) |
