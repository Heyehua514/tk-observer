begin;
select plan(19);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('95100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'memory-lifecycle-owner@example.test', '', now(), '{}', '{"name":"Memory Lifecycle Owner"}', now(), now()),
  ('95100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'memory-lifecycle-other@example.test', '', now(), '{}', '{"name":"Memory Lifecycle Other"}', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"95100000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok($$
  insert into public.ai_memory (id, owner_id, memory_type, memory_key, memory_value)
  values ('95110000-0000-0000-0000-000000000001', '95100000-0000-0000-0000-000000000001', 'preference', 'shared-key', 'original')
$$, 'owner creates a memory');

-- Match the service contract: the conflict target excludes id and includes owner.
select lives_ok($$
  insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value, deleted_at)
  values ('95100000-0000-0000-0000-000000000001', 'preference', 'shared-key', 'updated', null)
  on conflict (owner_id, memory_key) do update
  set memory_value = excluded.memory_value, deleted_at = excluded.deleted_at
$$, 'same owner and key can be saved again');
select is((select count(*) from public.ai_memory where memory_key = 'shared-key'), 1::bigint, 'repeated save retains one row');
select is((select id from public.ai_memory where memory_key = 'shared-key'), '95110000-0000-0000-0000-000000000001'::uuid, 'repeated save preserves identity');
select is((select memory_value from public.ai_memory where memory_key = 'shared-key'), 'updated', 'repeated save updates the stored value');

select lives_ok($$
  update public.ai_memory set deleted_at = now()
  where id = '95110000-0000-0000-0000-000000000001'
    and owner_id = '95100000-0000-0000-0000-000000000001'
$$, 'owner soft deletes memory without an RLS visibility error');
select is((select count(*) from public.ai_memory where memory_key = 'shared-key' and deleted_at is null), 0::bigint, 'active list excludes deleted memory');
select is((select count(*) from public.ai_memory where memory_key = 'shared-key'), 1::bigint, 'owner retains access to the row for restoration');

select lives_ok($$
  insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value, deleted_at)
  values ('95100000-0000-0000-0000-000000000001', 'preference', 'shared-key', 'restored', null)
  on conflict (owner_id, memory_key) do update
  set memory_value = excluded.memory_value, deleted_at = excluded.deleted_at
$$, 'saving the deleted key restores the existing memory');
select is((select id from public.ai_memory where memory_key = 'shared-key'), '95110000-0000-0000-0000-000000000001'::uuid, 'restoration preserves identity');
select is((select memory_value from public.ai_memory where memory_key = 'shared-key'), 'restored', 'restoration persists the new value');
select is((select count(*) from public.ai_memory where memory_key = 'shared-key' and deleted_at is null), 1::bigint, 'restored memory returns to active list');

select set_config('request.jwt.claims', '{"sub":"95100000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.ai_memory where memory_key = 'shared-key'), 0::bigint, 'another owner cannot read restored memory');
select lives_ok($$
  insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value, deleted_at)
  values ('95100000-0000-0000-0000-000000000002', 'preference', 'shared-key', 'other-owner-value', null)
  on conflict (owner_id, memory_key) do update
  set memory_value = excluded.memory_value, deleted_at = excluded.deleted_at
$$, 'different owners can independently save the same key');
select is((select memory_value from public.ai_memory where memory_key = 'shared-key'), 'other-owner-value', 'second owner reads only their own value');
select throws_ok($$
  insert into public.ai_memory (owner_id, memory_type, memory_key, memory_value, deleted_at)
  values ('95100000-0000-0000-0000-000000000001', 'preference', 'shared-key', 'forged', null)
  on conflict (owner_id, memory_key) do update
  set memory_value = excluded.memory_value, deleted_at = excluded.deleted_at
$$, '42501', null, 'upsert cannot overwrite another owner through the unique key');
select is((select count(*) from public.ai_memory where owner_id = '95100000-0000-0000-0000-000000000001'), 0::bigint, 'forged upsert does not expose the other owner');

select set_config('request.jwt.claims', '{"sub":"95100000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select memory_value from public.ai_memory where memory_key = 'shared-key'), 'restored', 'original owner value survives the forged upsert');
select is((select count(*) from public.ai_memory where memory_key = 'shared-key'), 1::bigint, 'original owner still sees exactly one own memory');

select * from finish();
rollback;
