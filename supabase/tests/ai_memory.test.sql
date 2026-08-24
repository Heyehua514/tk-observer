begin;
select plan(11);
select has_table('public', 'ai_memory', 'ai memory table exists');
select has_column('public', 'ai_memory', 'owner_id', 'memory owner exists');
select has_column('public', 'ai_memory', 'memory_value', 'memory value exists');
select col_is_pk('public', 'ai_memory', 'id', 'memory id is primary key');
select policies_are('public', 'ai_memory', array[
  'members can read own ai memory',
  'members can create own ai memory',
  'members can update own ai memory'
], 'memory policies are owner scoped');
select has_index(
  'public', 'ai_memory', 'ai_memory_owner_recent_idx',
  'memory recent index exists'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('95000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai-memory-owner@example.test', '', now(), '{}', '{"name":"Memory Owner"}', now(), now()),
  ('95000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai-memory-other@example.test', '', now(), '{}', '{"name":"Memory Other"}', now(), now());

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"95000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value)
  values (
    '95000000-0000-0000-0000-000000000001',
    'preference',
    'workspace-language',
    '中文'
  )
$$, 'owner can create own memory');

select set_config(
  'request.jwt.claims',
  '{"sub":"95000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.ai_memory),
  0::bigint,
  'other member cannot read memory'
);
select lives_ok($$
  update public.ai_memory
  set memory_value = '越权修改'
  where owner_id = '95000000-0000-0000-0000-000000000001'
$$, 'other member update is filtered by row-level security');
select throws_ok($$
  insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value)
  values (
    '95000000-0000-0000-0000-000000000001',
    'preference',
    'forged-owner-memory',
    '越权创建'
  )
$$, '42501', null, 'other member cannot create memory for owner');

select set_config(
  'request.jwt.claims',
  '{"sub":"95000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select memory_value from public.ai_memory where memory_key = 'workspace-language'),
  '中文',
  'owner memory remains unchanged after attack'
);
select * from finish();
rollback;
