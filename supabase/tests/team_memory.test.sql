begin;
select plan(15);

select has_table('public', 'daily_reports', 'daily reports table exists');
select has_table('public', 'weekly_reports', 'weekly reports table exists');
select has_table('public', 'failed_cases', 'failed cases table exists');
select has_table('public', 'audit_logs', 'audit logs table exists');
select has_check('public', 'failed_cases', 'failed cases have source and reason checks');
select policies_are('public', 'daily_reports', array[
  'boss can read daily reports',
  'owner can manage daily reports'
]);
select policies_are('public', 'failed_cases', array[
  'boss can read failed cases',
  'owner can manage failed cases'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team-memory-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team-memory-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team-memory-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '80000000-0000-0000-0000-000000000001' then 'owner'
      when '80000000-0000-0000-0000-000000000002' then 'boss'
      when '80000000-0000-0000-0000-000000000003' then 'business'
    end
where id::text like '80000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.daily_reports (
    date, stats_json, highlights, generated_at
  ) values (
    '2026-08-13 10:00:00+00', '{"clients":2}', '今日新增客户 2 个', now()
  )
$$, 'owner can insert daily report');
select lives_ok($$
  insert into public.failed_cases (
    source_type, source_id, reason, lessons, recorded_at
  ) values (
    'opportunity', 'opp-1', '报价过高', '先确认预算', now()
  )
$$, 'owner can insert failed case');
select throws_ok($$
  insert into public.failed_cases (
    source_type, source_id, reason, recorded_at
  ) values (
    'opportunity', 'opp-1', '重复', now()
  )
$$, '23505', null, 'failed case source is deduped');
select lives_ok($$
  insert into public.audit_logs (
    actor_name, action, entity_type, entity_id
  ) values (
    '系统', 'daily-report', 'cron_run', 'daily-report'
  )
$$, 'owner can insert audit log');

select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.daily_reports), 1::bigint, 'boss can read daily reports');
select is((select count(*) from public.failed_cases), 1::bigint, 'boss can read failed cases');

select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.daily_reports), 0::bigint, 'business cannot read daily reports');
select is((select count(*) from public.audit_logs), 0::bigint, 'business cannot read audit logs');

select * from finish();
rollback;
