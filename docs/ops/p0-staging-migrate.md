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
| | | | **PENDING** — no staging project credentials in agent env |
