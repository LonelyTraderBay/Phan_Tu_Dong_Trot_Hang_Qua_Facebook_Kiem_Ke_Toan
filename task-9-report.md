Task 9 complete.

- Fixed `docs/runbooks/meta-down.md` SQL to match schema and outbox naming.
- `outbox_events`: filter `event_name = 'meta.inbound'` (Inngest dashboard: `meta/persist_inbound`).
- `job_dead_letters`: `job_name = 'meta.inbound'`, column `error_text`, org via `payload_json->>'orgId'`.
- `channel_connections`: `provider in ('meta_page','meta_ig')`.
- Added one-line note: run SQL in Supabase SQL Editor or with `service_role`.
