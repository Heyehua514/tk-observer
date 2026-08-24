begin;
select plan(12);

select has_table('public', 'intelligence_items', 'intelligence pool exists');
select has_column('public', 'intelligence_items', 'dedupe_key', 'dedupe key exists');
select has_column('public', 'intelligence_items', 'workspaces', 'workspace tags exist');
select ok(exists(
  select 1 from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relname = 'intelligence_items'
    and c.conname = 'intelligence_items_source_type_check'
), 'source type is constrained');
select ok(exists(
  select 1 from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relname = 'intelligence_items'
    and c.conname = 'intelligence_items_status_check'
), 'status is constrained');
select ok(exists(
  select 1 from pg_indexes
  where schemaname = 'public'
    and tablename = 'intelligence_items'
    and indexname = 'intelligence_items_active_dedupe_key_idx'
), 'active dedupe index exists');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('97000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intelligence-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('97000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intelligence-other@example.test', '', now(), '{}', '{"name":"Other"}', now(), now());
update public.profiles
set status = 'active', role = 'business'
where id in ('97000000-0000-0000-0000-000000000001', '97000000-0000-0000-0000-000000000002');

select lives_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, captured_at,
    dedupe_key, created_by
  ) values (
    '情报测试', '官方公告', 'official', 'https://example.com/news', now(),
    'test-dedupe-key', '97000000-0000-0000-0000-000000000001'
  )
$$, 'valid intelligence item can be inserted');
select throws_ok($$
  insert into public.intelligence_items (
    title, source_name, source_type, source_url, captured_at,
    dedupe_key, created_by
  ) values (
    '重复情报', '官方公告', 'official', 'https://example.com/other', now(),
    'test-dedupe-key', '97000000-0000-0000-0000-000000000001'
  )
$$, '23505', null, 'active dedupe key rejects duplicates');

select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.intelligence_items),
  1,
  'active member can read shared intelligence'
);
select is(
  (select count(*)::integer from public.intelligence_items
   where created_by = '97000000-0000-0000-0000-000000000001'),
  1,
  'shared item keeps its owner attribution'
);
select lives_ok($$
  update public.intelligence_items
  set title = '越权修改'
  where dedupe_key = 'test-dedupe-key'
$$, 'non owner update is filtered by RLS');
select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select isnt(
  (select title from public.intelligence_items),
  '越权修改',
  'non owner cannot change shared item'
);

rollback;
