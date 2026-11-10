begin;
select plan(15);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '95100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'memory-lifecycle-eval@example.test', '', now(),
  '{}', '{"name":"Memory Lifecycle Evaluator"}', now(), now()
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"95100000-0000-0000-0000-000000000003","role":"authenticated"}', true);

-- Four assertions: each supported source accepts the inclusive field limits.
select lives_ok(format(
  'insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value, confidence, source)
   values (%L::uuid, %L, %L, %L, %L::numeric, %L)',
  '95100000-0000-0000-0000-000000000003', memory_type, memory_key, memory_value, confidence, source
), source || ' accepts valid field boundaries')
from (values
  ('manual', 'p', 'a', 'v', 0::numeric),
  ('accepted_ai', repeat('t', 40), repeat('k', 120), repeat('v', 2000), 1::numeric),
  ('review', 'review', 'review-key', 'review-value', 0.5::numeric),
  ('auto_cut_diagnosis', 'video_cut_style', 'auto-cut-key', 'auto-cut-value', 0.9::numeric)
) as cases(source, memory_type, memory_key, memory_value, confidence);

-- Nine assertions: exercise constraints, rather than just checking their names.
select throws_ok(format(
  'insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value, confidence, source)
   values (%L::uuid, %L, %L, %L, %L::numeric, %L)
   on conflict (owner_id, memory_key) do update
   set memory_type = excluded.memory_type, memory_value = excluded.memory_value,
       confidence = excluded.confidence, source = excluded.source, deleted_at = null',
  '95100000-0000-0000-0000-000000000003', memory_type, memory_key, memory_value, confidence, source
), '23514', null, description)
from (values
  ('reject empty memory type', '', 'a', 'changed', 0.5::numeric, 'manual'),
  ('reject memory type above 40 characters', repeat('t', 41), 'a', 'changed', 0.5::numeric, 'manual'),
  ('reject empty memory key', 'preference', '', 'changed', 0.5::numeric, 'manual'),
  ('reject memory key above 120 characters', 'preference', repeat('k', 121), 'changed', 0.5::numeric, 'manual'),
  ('reject empty memory value', 'preference', 'a', '', 0.5::numeric, 'manual'),
  ('reject memory value above 2000 characters', 'preference', 'a', repeat('v', 2001), 0.5::numeric, 'manual'),
  ('reject negative confidence', 'preference', 'a', 'changed', -0.001::numeric, 'manual'),
  ('reject confidence above one', 'preference', 'a', 'changed', 1.001::numeric, 'manual'),
  ('reject unknown source', 'preference', 'a', 'changed', 0.5::numeric, 'unknown')
) as cases(description, memory_type, memory_key, memory_value, confidence, source);

select is((select count(*) from public.ai_memory), 4::bigint, 'invalid upserts neither add nor remove memories');
select is((select memory_value from public.ai_memory where memory_key = 'a'), 'v', 'rejected updates preserve the previous valid value');

select * from finish();
rollback;
