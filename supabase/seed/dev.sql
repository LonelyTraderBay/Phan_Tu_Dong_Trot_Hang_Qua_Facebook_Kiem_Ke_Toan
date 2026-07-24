insert into public.feature_flags (id, key, org_id, enabled, payload_json)
values
  (gen_random_uuid(), 'kill_ai_outbound', null, false, '{}'),
  (gen_random_uuid(), 'kill_ai_all', null, false, '{}'),
  (gen_random_uuid(), 'kill_auto_confirm', null, false, '{}')
on conflict (key) where org_id is null
do update set
  enabled = excluded.enabled,
  payload_json = excluded.payload_json;
