begin;
select plan(13);

select has_column(
  'public', 'team_tasks', 'source_intelligence_id',
  'team tasks retain source intelligence id'
);
select has_index(
  'public', 'team_tasks', 'team_tasks_source_intelligence_id_idx',
  'source intelligence conversion is unique'
);
select has_function(
  'public', 'convert_intelligence_item_to_task',
  array['uuid', 'text', 'timestamp with time zone', 'text'],
  'intelligence conversion function exists'
);
select ok(
  has_function_privilege('authenticated', p.oid, 'execute'),
  'authenticated users can execute conversion'
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'convert_intelligence_item_to_task'
  and p.pronargs = 4;
select ok(
  not has_function_privilege('anon', p.oid, 'execute'),
  'anon cannot execute conversion'
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'convert_intelligence_item_to_task'
  and p.pronargs = 4;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('98000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intel-task-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('98000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intel-task-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '98000000-0000-0000-0000-000000000001' then 'boss'
      when '98000000-0000-0000-0000-000000000002' then 'market'
    end
where id in (
  '98000000-0000-0000-0000-000000000001',
  '98000000-0000-0000-0000-000000000002'
);

insert into public.intelligence_items (
  id, title, source_name, source_type, source_url, captured_at,
  dedupe_key, created_by, deleted_at
) values
  (
    '98100000-0000-0000-0000-000000000001',
    repeat('A', 190),
    '官方公告',
    'official',
    'https://example.com/intelligence/task-success',
    now(),
    'intel-task-success',
    '98000000-0000-0000-0000-000000000001',
    null
  ),
  (
    '98100000-0000-0000-0000-000000000002',
    '字段校验情报',
    '官方公告',
    'official',
    'https://example.com/intelligence/task-validation',
    now(),
    'intel-task-validation',
    '98000000-0000-0000-0000-000000000001',
    null
  ),
  (
    '98100000-0000-0000-0000-000000000003',
    '已删除情报',
    '官方公告',
    'official',
    'https://example.com/intelligence/task-deleted',
    now(),
    'intel-task-deleted',
    '98000000-0000-0000-0000-000000000001',
    now()
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"98000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok($$
  select public.convert_intelligence_item_to_task(
    '98100000-0000-0000-0000-000000000001',
    '董雨辰',
    '2026-11-15 18:00:00+08',
    'US'
  )
$$, 'boss converts intelligence into a team task');

select is(
  (select status from public.intelligence_items
   where id = '98100000-0000-0000-0000-000000000001'),
  'tasked',
  'successful conversion marks intelligence as tasked'
);

select ok(exists(
  select 1
  from public.team_tasks
  where source_intelligence_id = '98100000-0000-0000-0000-000000000001'
    and assignee_name = '董雨辰'
    and progress = 0
    and region = 'US'
    and due_at = '2026-11-15 10:00:00+00'::timestamptz
    and char_length(title) = 180
), 'conversion creates the linked team task with normalized fields');

select throws_ok($$
  select public.convert_intelligence_item_to_task(
    '98100000-0000-0000-0000-000000000001',
    '董雨辰',
    null,
    'US'
  )
$$, '23505', 'intelligence item already converted to a task',
  'duplicate conversion fails closed');

select set_config(
  'request.jwt.claims',
  '{"sub":"98000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select throws_ok($$
  select public.convert_intelligence_item_to_task(
    '98100000-0000-0000-0000-000000000002',
    '韩素云',
    null,
    'US'
  )
$$, '42501', 'team task management role required',
  'non manager cannot convert intelligence');

select set_config(
  'request.jwt.claims',
  '{"sub":"98000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select throws_ok($$
  select public.convert_intelligence_item_to_task(
    '98100000-0000-0000-0000-000000000003',
    '董雨辰',
    null,
    'US'
  )
$$, 'P0002', 'intelligence item not found',
  'soft-deleted intelligence cannot be converted');

select throws_ok($$
  select public.convert_intelligence_item_to_task(
    '98100000-0000-0000-0000-000000000002',
    '   ',
    null,
    'US'
  )
$$, '22023', 'assignee name must contain 1 to 40 characters',
  'blank assignee is rejected');

select ok(
  (select status from public.intelligence_items
   where id = '98100000-0000-0000-0000-000000000002') = 'unread'
  and not exists (
    select 1 from public.team_tasks
    where source_intelligence_id = '98100000-0000-0000-0000-000000000002'
  ),
  'failed conversion leaves intelligence and tasks unchanged'
);

select * from finish();
rollback;