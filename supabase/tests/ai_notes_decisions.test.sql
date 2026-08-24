begin;
select plan(10);

select has_column('public', 'ai_notes', 'decision', 'AI note decision exists');
select has_column('public', 'ai_notes', 'decided_at', 'AI note decision time exists');
select ok(exists(
  select 1
  from pg_constraint constraint_entry
  join pg_class table_entry on table_entry.oid = constraint_entry.conrelid
  join pg_namespace schema_entry on schema_entry.oid = table_entry.relnamespace
  where schema_entry.nspname = 'public'
    and table_entry.relname = 'ai_notes'
    and constraint_entry.conname = 'ai_notes_decision_check'
    and constraint_entry.contype = 'c'
), 'decision values are constrained');
select ok(exists(
  select 1
  from pg_constraint constraint_entry
  join pg_class table_entry on table_entry.oid = constraint_entry.conrelid
  join pg_namespace schema_entry on schema_entry.oid = table_entry.relnamespace
  where schema_entry.nspname = 'public'
    and table_entry.relname = 'ai_notes'
    and constraint_entry.conname = 'ai_notes_decision_time_check'
    and constraint_entry.contype = 'c'
), 'decision state and timestamp are constrained together');
select has_index(
  'public', 'ai_notes', 'ai_notes_owner_decision_created_idx',
  'owner decision lookup index exists'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('97000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai-note-owner@example.test', '', now(), '{}', '{"name":"AI Note Owner"}', now(), now()),
  ('97000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai-note-other@example.test', '', now(), '{}', '{"name":"AI Note Other"}', now(), now());

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.ai_notes (scope, task_type, prompt, result, owner_id)
  values (
    '设计工作台', '分析', '检查设计优先级', '先处理首页改版。',
    '97000000-0000-0000-0000-000000000001'
  )
$$, 'owner can save a pending AI note');
select is(
  (select decision from public.ai_notes where owner_id = '97000000-0000-0000-0000-000000000001'),
  'pending',
  'saved note defaults to pending'
);
select throws_ok($$
  insert into public.ai_notes (scope, task_type, prompt, result, owner_id, decision)
  values (
    '设计工作台', '分析', '非法采用状态', '不应保存。',
    '97000000-0000-0000-0000-000000000001', 'adopted'
  )
$$, '23514', null, 'adopted note requires a decision timestamp');

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.ai_notes
  set decision = 'adopted', decided_at = now()
  where owner_id = '97000000-0000-0000-0000-000000000001'
$$, 'other member decision update is filtered by row-level security');

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select decision from public.ai_notes where owner_id = '97000000-0000-0000-0000-000000000001'),
  'pending',
  'owner note remains pending after cross-account attack'
);
select * from finish();
rollback;
