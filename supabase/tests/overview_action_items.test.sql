begin;
select plan(13);

select has_function(
  'public', 'get_overview_action_items', array['integer'],
  'overview action items function exists'
);
select ok(
  has_function_privilege('authenticated', p.oid, 'execute'),
  'authenticated users can execute overview action items'
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_overview_action_items'
  and p.pronargs = 1;
select ok(
  not has_function_privilege('anon', p.oid, 'execute'),
  'anon cannot execute overview action items'
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_overview_action_items'
  and p.pronargs = 1;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('99000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'overview-actions-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('99000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'overview-actions-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '99000000-0000-0000-0000-000000000001' then 'boss'
      when '99000000-0000-0000-0000-000000000002' then 'business'
    end
where id in (
  '99000000-0000-0000-0000-000000000001',
  '99000000-0000-0000-0000-000000000002'
);

insert into public.intelligence_items (
  id, title, source_name, source_type, source_url, captured_at,
  dedupe_key, created_by
) values (
  '99100000-0000-0000-0000-000000000001',
  '待转团队任务情报',
  '官方公告',
  'official',
  'https://example.com/overview-actions/intelligence',
  now(),
  'overview-actions-intelligence',
  '99000000-0000-0000-0000-000000000001'
);

insert into public.clients (
  id, name, industry, source, level
) values (
  '99200000-0000-0000-0000-000000000001',
  '总览待办测试客户',
  'brand',
  'other',
  'B'
);

insert into public.design_tasks (
  id, title, status, due_at, region, deleted_at
) values
  ('99300000-0000-0000-0000-000000000001', '设计待办', 'todo', '2026-01-01T00:00:00Z', 'US', null),
  ('99300000-0000-0000-0000-000000000002', '设计已完成', 'done', '2025-12-31T00:00:00Z', 'US', null),
  ('99300000-0000-0000-0000-000000000003', '设计已删除', 'doing', '2025-12-30T00:00:00Z', 'US', now());

insert into public.video_tasks (
  id, title, status, due_at, owner_name, region, deleted_at
) values
  ('99400000-0000-0000-0000-000000000001', '剪辑待办', 'editing', '2026-01-02T00:00:00Z', '谢洁', 'US', null),
  ('99400000-0000-0000-0000-000000000002', '剪辑已完成', 'done', '2025-12-31T00:00:00Z', '谢洁', 'US', null);

insert into public.opportunities (
  id, client_id, title, type, amount, stage, expected_close, deleted_at
) values
  ('99500000-0000-0000-0000-000000000001', '99200000-0000-0000-0000-000000000001', '商机待跟进', 'other', 100, 'negotiation', '2026-01-03T00:00:00Z', null),
  ('99500000-0000-0000-0000-000000000002', '99200000-0000-0000-0000-000000000001', '商机已赢单', 'other', 100, 'won', '2025-12-31T00:00:00Z', null);

insert into public.team_tasks (
  id, assignee_name, title, progress, due_at, region,
  source_intelligence_id, deleted_at
) values
  ('99600000-0000-0000-0000-000000000001', '董雨辰', '团队待办', 40, '2026-01-04T00:00:00Z', 'US', '99100000-0000-0000-0000-000000000001', null),
  ('99600000-0000-0000-0000-000000000002', '董雨辰', '团队已完成', 100, '2026-01-05T00:00:00Z', 'US', null, null),
  ('99600000-0000-0000-0000-000000000003', '韩素云', '团队已删除', 20, '2026-01-06T00:00:00Z', 'US', null, now());

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"99000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.get_overview_action_items(50)),
  4::bigint,
  'boss sees one open item from each workspace'
);
select is(
  (select assignee_name
   from public.get_overview_action_items(50)
   where workspace = 'team'),
  '董雨辰',
  'team action item keeps its assignee'
);
select is(
  (select count(*)
   from public.get_overview_action_items(50)
   where title in ('设计已完成', '剪辑已完成', '商机已赢单', '团队已完成')),
  0::bigint,
  'terminal items are excluded'
);
select is(
  (select count(*)
   from public.get_overview_action_items(50)
   where title in ('设计已删除', '团队已删除')),
  0::bigint,
  'soft deleted items are excluded'
);
select is(
  (select workspace
   from public.get_overview_action_items(50)
   order by due_at
   limit 1),
  'design',
  'earliest due item is returned first'
);
select is(
  (select source_intelligence_id
   from public.get_overview_action_items(50)
   where workspace = 'team'),
  '99100000-0000-0000-0000-000000000001'::uuid,
  'team action item keeps source intelligence id'
);
select is(
  (select count(*) from public.get_overview_action_items(2)),
  2::bigint,
  'overview action items honors the requested limit'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"99000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.get_overview_action_items(50)),
  1::bigint,
  'business user only sees business-scoped items'
);
select is(
  (select min(workspace) from public.get_overview_action_items(50)),
  'business',
  'business user cannot read team or cross-domain tasks'
);
select is(
  (select count(*)
   from public.get_overview_action_items(50)
   where workspace = 'team'),
  0::bigint,
  'team task RLS is preserved through the function'
);

select * from finish();
rollback;