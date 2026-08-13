-- 团队记忆自动化测试：日报/周报生成、失败沉淀、截止提醒、规则校验、模板计数、cron 调度。
-- 所属工作台：总览 / 商务 / 市场 / 设计。
-- 权限：自动化函数仅服务端调用；本测试以 postgres 角色验证触发器与函数行为。

begin;
select plan(51);

-- ---------- 结构与触发器存在性 ----------
select has_extension('pg_cron', 'pg_cron extension is available');
select has_column('public', 'social_plans', 'usage_count', 'social plans track usage count');
select has_column('public', 'social_plans', 'last_used_at', 'social plans track last used time');
select has_column('public', 'opportunities', 'created_by', 'opportunities track creator for reminders');
select trigger_is(
  'public', 'opportunities', 'opportunities_audit_stage_change',
  'public', 'audit_opportunity_stage_change',
  'stage changes are audited'
);
select trigger_is(
  'public', 'opportunities', 'opportunities_record_failed_case',
  'public', 'record_lost_opportunity_case',
  'lost opportunities are recorded as failed cases'
);
select trigger_is(
  'public', 'opportunities', 'opportunities_sponsorship_level_check',
  'public', 'enforce_sponsorship_client_level',
  'sponsorship opportunities require B+ clients'
);
select trigger_is(
  'public', 'event_tasks', 'event_tasks_audit_done',
  'public', 'audit_event_task_done',
  'task completion is audited'
);
select trigger_is(
  'public', 'event_tasks', 'event_tasks_record_failed_case',
  'public', 'record_overdue_event_task_case',
  'overdue tasks are recorded as failed cases'
);
select trigger_is(
  'public', 'design_assets', 'design_assets_review_file_check',
  'public', 'enforce_design_review_file',
  'review submission requires a file'
);
select trigger_is(
  'public', 'event_templates', 'event_templates_bump_usage',
  'public', 'bump_event_template_usage',
  'template usage count bumps on use'
);
select trigger_is(
  'public', 'social_plans', 'social_plans_bump_usage',
  'public', 'bump_social_plan_usage',
  'social plan usage count bumps on publish or link'
);
select is(
  (select count(*) from cron.job),
  4::bigint,
  'four team-memory cron jobs are scheduled'
);

-- ---------- 数据准备 ----------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'memory-auto-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'memory-auto-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '70000000-0000-0000-0000-000000000001' then 'boss'
      when '70000000-0000-0000-0000-000000000002' then 'business'
    end
where id::text like '70000000-0000-0000-0000-00000000000%';

insert into public.clients (id, name, industry, source, level)
values
  ('71000000-0000-0000-0000-000000000001', '自动化A客户', 'brand', 'outbound', 'A'),
  ('71000000-0000-0000-0000-000000000002', '自动化C客户', 'brand', 'outbound', 'C');

insert into public.events (
  id, name, type, start_date, location_city
) values (
  '72000000-0000-0000-0000-000000000001', '自动化测试活动', 'closed_salon',
  now() + interval '30 days', '上海'
);

insert into public.event_phases (
  id, event_id, name, phase_order, status
) values (
  '73000000-0000-0000-0000-000000000001',
  '72000000-0000-0000-0000-000000000001', 'P1 资源锁定', 1, 'in_progress'
);

insert into public.opportunities (
  id, client_id, title, type, amount, stage, expected_close, created_by
) values (
  '74000000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000001',
  '自动化招商商机', 'event_sponsorship', 200000, 'contact',
  now() + interval '7 days', '70000000-0000-0000-0000-000000000002'
);

-- ---------- 模板使用计数 ----------
select lives_ok($$
  insert into public.event_templates (
    id, name, type, event_type, content
  ) values (
    '75000000-0000-0000-0000-000000000001', '自动化邀约模板',
    'invitation', 'closed_salon', '{{活动名称}} 邀约文案'
  )
$$, 'template can be created');
select is(
  (select usage_count from public.event_templates where id = '75000000-0000-0000-0000-000000000001'),
  0,
  'unused template starts at zero'
);
select lives_ok($$
  update public.event_templates set last_used_at = now()
  where id = '75000000-0000-0000-0000-000000000001'
$$, 'template can be marked used once');
select is(
  (select usage_count from public.event_templates where id = '75000000-0000-0000-0000-000000000001'),
  1,
  'first use bumps usage to one'
);
select lives_ok($$
  update public.event_templates set last_used_at = now() + interval '1 second'
  where id = '75000000-0000-0000-0000-000000000001'
$$, 'template can be used again');
select is(
  (select usage_count from public.event_templates where id = '75000000-0000-0000-0000-000000000001'),
  2,
  'second use bumps usage to two'
);

-- ---------- 朋友圈计划使用计数 ----------
select lives_ok($$
  insert into public.social_plans (
    id, date, content, status
  ) values (
    '76000000-0000-0000-0000-000000000001',
    now() + interval '1 day', '自动化朋友圈内容', 'planned'
  )
$$, 'social plan can be created as planned');
select is(
  (select usage_count from public.social_plans where id = '76000000-0000-0000-0000-000000000001'),
  0,
  'planned social plan starts at zero'
);
select lives_ok($$
  update public.social_plans set status = 'published'
  where id = '76000000-0000-0000-0000-000000000001'
$$, 'social plan can be published');
select is(
  (select usage_count from public.social_plans where id = '76000000-0000-0000-0000-000000000001'),
  1,
  'publishing bumps social plan usage'
);
select ok(
  (select last_used_at is not null from public.social_plans where id = '76000000-0000-0000-0000-000000000001'),
  'publishing stamps last_used_at'
);
select lives_ok($$
  update public.social_plans
  set status = 'reviewed',
      linked_opportunity_id = '74000000-0000-0000-0000-000000000001'
  where id = '76000000-0000-0000-0000-000000000001'
$$, 'social plan can link an opportunity');
select is(
  (select usage_count from public.social_plans where id = '76000000-0000-0000-0000-000000000001'),
  2,
  'linking an opportunity bumps usage again'
);

-- ---------- 招商客户重要度校验 ----------
select throws_ok($$
  insert into public.opportunities (
    client_id, title, type, amount, stage
  ) values (
    '71000000-0000-0000-0000-000000000002',
    '不合格招商商机', 'event_sponsorship', 100000, 'contact'
  )
$$, NULL, '活动招商只能关联重要度 B 及以上的客户',
  'level C client cannot sponsor');
select lives_ok($$
  insert into public.opportunities (
    client_id, title, type, amount, stage
  ) values (
    '71000000-0000-0000-0000-000000000001',
    '合格招商商机', 'event_sponsorship', 100000, 'contact'
  )
$$, 'level A client can sponsor');

-- ---------- 失败沉淀：商机流失 ----------
select lives_ok($$
  update public.opportunities
  set stage = 'lost', lost_reason = '预算不足'
  where id = '74000000-0000-0000-0000-000000000001'
$$, 'opportunity can be marked lost');
select is(
  (select count(*) from public.failed_cases where source_type = 'opportunity'),
  1::bigint,
  'lost opportunity creates one failed case'
);
select lives_ok($$
  update public.opportunities
  set stage = 'won'
  where id = '74000000-0000-0000-0000-000000000001'
$$, 'opportunity can move out of lost');
select lives_ok($$
  update public.opportunities
  set stage = 'lost', lost_reason = '再次流失'
  where id = '74000000-0000-0000-0000-000000000001'
$$, 'opportunity can be lost again');
select is(
  (select count(*) from public.failed_cases where source_type = 'opportunity'),
  1::bigint,
  'repeated loss does not duplicate failed case'
);

-- ---------- 失败沉淀：任务到期未完成 ----------
select lives_ok($$
  insert into public.event_tasks (
    id, event_id, phase_id, title, assignee_role, assignee_id,
    status, priority, due_date
  ) values (
    '77000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000001',
    '73000000-0000-0000-0000-000000000001',
    '自动化过期任务', 'business',
    '70000000-0000-0000-0000-000000000002',
    'todo', 'high', now() - interval '1 day'
  )
$$, 'overdue task can be inserted');
select is(
  (select count(*) from public.failed_cases where source_type = 'event_task'),
  1::bigint,
  'overdue task creates one failed case'
);
select is(
  (select public.sweep_overdue_event_tasks()),
  0,
  'sweep does not duplicate existing failed cases'
);
select lives_ok($$
  update public.event_tasks set status = 'done'
  where id = '77000000-0000-0000-0000-000000000001'
$$, 'overdue task can still be completed');

-- ---------- 截止提醒 ----------
select lives_ok($$
  insert into public.event_tasks (
    id, event_id, phase_id, title, assignee_role, assignee_id,
    status, priority, due_date
  ) values (
    '77000000-0000-0000-0000-000000000002',
    '72000000-0000-0000-0000-000000000001',
    '73000000-0000-0000-0000-000000000001',
    '自动化今日任务', 'business',
    '70000000-0000-0000-0000-000000000002',
    'todo', 'high',
    (now() at time zone 'Asia/Shanghai')::date::timestamp at time zone 'Asia/Shanghai' + interval '2 hours'
  )
$$, 'task due today can be inserted');
select lives_ok($$
  insert into public.opportunities (
    id, client_id, title, type, amount, stage, expected_close, created_by
  ) values (
    '74000000-0000-0000-0000-000000000002',
    '71000000-0000-0000-0000-000000000001',
    '自动化今日商机', 'channel_order', 300000, 'contact',
    (now() at time zone 'Asia/Shanghai')::date::timestamp at time zone 'Asia/Shanghai' + interval '3 hours',
    '70000000-0000-0000-0000-000000000002'
  )
$$, 'opportunity due today can be inserted');
select lives_ok($$
  select public.run_deadline_checks()
$$, 'deadline check can run');
select is(
  (select count(*) from public.notifications),
  2::bigint,
  'deadline check creates task and opportunity notifications'
);
select lives_ok($$
  select public.run_deadline_checks()
$$, 'deadline check can run again');
select is(
  (select count(*) from public.notifications),
  2::bigint,
  'deadline check does not duplicate notifications'
);

-- ---------- 日报 / 周报生成 ----------
select ok(
  (select public.generate_daily_report((now() at time zone 'Asia/Shanghai')::date) is not null),
  'daily report can be generated'
);
select is(
  (select count(*) from public.daily_reports),
  1::bigint,
  'daily report is persisted'
);
select ok(
  (select (stats_json::jsonb ->> 'newClients')::int >= 1
   from public.daily_reports limit 1),
  'daily report counts new clients'
);
select ok(
  (select (stats_json::jsonb ->> 'opportunityStageChanges')::int >= 1
   from public.daily_reports limit 1),
  'daily report counts opportunity stage changes'
);
select ok(
  (select (stats_json::jsonb ->> 'completedEventTasks')::int >= 1
   from public.daily_reports limit 1),
  'daily report counts completed event tasks'
);
select ok(
  (select public.generate_weekly_report((now() at time zone 'Asia/Shanghai')::date) is not null),
  'weekly report can be generated'
);
select is(
  (select count(*) from public.weekly_reports),
  1::bigint,
  'weekly report is persisted'
);
select ok(
  (select trends like '%成交%' from public.weekly_reports limit 1),
  'weekly report contains deal trends'
);

select * from finish();
rollback;
