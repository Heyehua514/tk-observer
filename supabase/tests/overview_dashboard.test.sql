begin;
select plan(12);

select has_table('public', 'gmv_metrics', 'gmv metrics table exists');
select has_table('public', 'team_tasks', 'team tasks table exists');
select has_check('public', 'gmv_metrics', 'gmv metrics have amount and enum checks');
select has_check('public', 'team_tasks', 'team tasks have progress and region checks');
select policies_are('public', 'gmv_metrics', array[
  'boss can read gmv metrics',
  'boss can manage gmv metrics'
]);
select policies_are('public', 'team_tasks', array[
  'boss can read team tasks',
  'boss can manage team tasks'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'overview-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'overview-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when 'a0000000-0000-0000-0000-000000000001' then 'boss'
      when 'a0000000-0000-0000-0000-000000000002' then 'market'
    end
where id::text like 'a0000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.gmv_metrics (
    metric_date, amount_minor, currency, region
  ) values (
    now(), 1280000, 'CNY', 'US'
  )
$$, 'boss can create gmv metric');
select lives_ok($$
  insert into public.team_tasks (
    assignee_name, title, progress, due_at, region
  ) values (
    '董雨辰', '推进商务商机', 60, now() + interval '1 day', 'US'
  )
$$, 'boss can create team task');
select is(
  (select count(*) from public.gmv_metrics
   where amount_minor = 1280000 and currency = 'CNY'),
  1::bigint,
  'boss can read gmv metrics'
);
select is(
  (select count(*) from public.team_tasks where title = '推进商务商机'),
  1::bigint,
  'boss can read team tasks'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.gmv_metrics), 0::bigint, 'market cannot read gmv metrics');
select throws_ok($$
  insert into public.team_tasks (
    assignee_name, title, progress, region
  ) values (
    '韩素云', '越权任务', 10, 'US'
  )
$$, '42501', null, 'market cannot create team task');

select * from finish();
rollback;
