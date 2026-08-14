-- 软删除 SELECT 策略第四轮收口测试（20 张表）
-- 用途：验证 20260814000300_soft_delete_select_rls_round4.sql 已将非 owner 角色可 UPDATE/ALL 的
--       软删除表 SELECT 策略放宽为按角色可见；非 owner 角色 update({ deleted_at }) 不再被 RLS 403。
-- 所属工作台：商务（董雨辰）/ 市场（韩素云）/ 剪辑（谢洁）/ 设计（孙铭泽）/ 总览（磊哥）
-- 权限：owner/boss/business/market/editing 各角色按原矩阵验证；通知验证 recipient 本人。

begin;
select plan(37);

-- ---------- 策略层：SELECT 策略不再携带 deleted_at 门槛 ----------

select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'venues'
      and cmd = 'SELECT' and policyname = 'market collaborators can read venues'
      and qual::text ilike '%deleted_at is null%'),
  'venues read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_templates'
      and cmd = 'SELECT' and policyname = 'market collaborators can read templates'
      and qual::text ilike '%deleted_at is null%'),
  'event_templates read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_materials'
      and cmd = 'SELECT' and policyname = 'market collaborators can read materials'
      and qual::text ilike '%deleted_at is null%'),
  'event_materials read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_finances'
      and cmd = 'SELECT' and policyname = 'market collaborators can read finances'
      and qual::text ilike '%deleted_at is null%'),
  'event_finances read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_phases'
      and cmd = 'SELECT' and policyname = 'event coordinators can read phases'
      and qual::text ilike '%deleted_at is null%'),
  'event_phases read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_registrations'
      and cmd = 'SELECT' and policyname = 'event coordinators can read registrations'
      and qual::text ilike '%deleted_at is null%'),
  'event_registrations read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_sponsorships'
      and cmd = 'SELECT' and policyname = 'sponsorship collaborators can read sponsorships'
      and qual::text ilike '%deleted_at is null%'),
  'event_sponsorships read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_tasks'
      and cmd = 'SELECT' and policyname = 'event coordinators can read tasks'
      and qual::text ilike '%deleted_at is null%'),
  'event_tasks coordinator read policy is role-scoped without deleted_at gate'
);
select ok(
  exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_tasks'
      and cmd = 'SELECT' and policyname = 'assigned collaborators can read tasks'
      and qual::text ilike '%deleted_at is null%'),
  'event_tasks assignee read policy keeps deleted_at gate (trigger guards soft delete)'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and cmd = 'SELECT' and policyname = 'market collaborators can read products'
      and qual::text ilike '%deleted_at is null%'),
  'products read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'blog_articles'
      and cmd = 'SELECT' and policyname = 'blog collaborators can read articles'
      and qual::text ilike '%deleted_at is null%'),
  'blog_articles read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'competitor_accounts'
      and cmd = 'SELECT' and policyname = 'competitor collaborators can read competitor accounts'
      and qual::text ilike '%deleted_at is null%'),
  'competitor_accounts read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'competitor_style_analysis'
      and cmd = 'SELECT' and policyname = 'editing collaborators can read style analyses'
      and qual::text ilike '%deleted_at is null%'),
  'competitor_style_analysis read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'competitor_videos'
      and cmd = 'SELECT' and policyname = 'editing collaborators can read competitor videos'
      and qual::text ilike '%deleted_at is null%'),
  'competitor_videos read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'import_history'
      and cmd = 'SELECT' and policyname = 'editing collaborators can read import history'
      and qual::text ilike '%deleted_at is null%'),
  'import_history read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'trending_topics'
      and cmd = 'SELECT' and policyname = 'editing collaborators can read trending topics'
      and qual::text ilike '%deleted_at is null%'),
  'trending_topics read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'video_tasks'
      and cmd = 'SELECT' and policyname = 'editing collaborators can read video tasks'
      and qual::text ilike '%deleted_at is null%'),
  'video_tasks read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'videos'
      and cmd = 'SELECT' and policyname = 'video collaborators can read videos'
      and qual::text ilike '%deleted_at is null%'),
  'videos read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gmv_metrics'
      and cmd = 'SELECT' and policyname = 'boss can read gmv metrics'
      and qual::text ilike '%deleted_at is null%'),
  'gmv_metrics read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_tasks'
      and cmd = 'SELECT' and policyname = 'boss can read team tasks'
      and qual::text ilike '%deleted_at is null%'),
  'team_tasks read policy is role-scoped without deleted_at gate'
);
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications'
      and cmd = 'SELECT' and policyname = 'members can read own notifications'
      and qual::text ilike '%deleted_at is null%'),
  'notifications read policy is recipient-scoped without deleted_at gate'
);

-- ---------- 角色实测：非 owner 软删除不再 403 ----------

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'round4-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'round4-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'round4-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'round4-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now()),
  ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'round4-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '70000000-0000-0000-0000-000000000001' then 'boss'
      when '70000000-0000-0000-0000-000000000002' then 'market'
      when '70000000-0000-0000-0000-000000000003' then 'business'
      when '70000000-0000-0000-0000-000000000004' then 'editing'
      when '70000000-0000-0000-0000-000000000005' then 'owner'
    end
where id::text like '70000000-0000-0000-0000-00000000000%';

set local role authenticated;

-- market：软删 venues / products / event_tasks（assignee=design 供后续验证）
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
insert into public.venues (
  id, name, type, city, capacity_min, capacity_max, is_verified
) values (
  '71000000-0000-0000-0000-000000000001', '四轮测试场地', 'hotel', '厦门', 20, 80, true
);
select lives_ok($$
  update public.venues set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000001'
$$, 'market can soft delete venues');
select is(
  (select count(*) from public.venues
   where id = '71000000-0000-0000-0000-000000000001' and deleted_at is not null),
  1::bigint,
  'market can inspect soft-deleted venue'
);
select is(
  (select count(*) from public.venues
   where id = '71000000-0000-0000-0000-000000000001' and deleted_at is null),
  0::bigint,
  'market sees no live rows after soft delete'
);

insert into public.products (
  id, name, category, price_minor, cost_minor, region
) values (
  '71000000-0000-0000-0000-000000000002', '四轮测试品', '家居', 9900, 4200, 'US'
);
select lives_ok($$
  update public.products set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000002'
$$, 'market can soft delete products');

-- market 建 event + phase + task（assignee=design），后续 design 验证 assigned 策略
insert into public.events (
  id, name, type, start_date, location_city, created_by
) values (
  '71000000-0000-0000-0000-000000000010', '四轮测试活动', 'closed_salon', now() + interval '7 days', '厦门',
  '70000000-0000-0000-0000-000000000002'
);
insert into public.event_phases (
  id, event_id, name, phase_order, status
) values (
  '71000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000010', 'P0 立项定档', 0, 'in_progress'
);
insert into public.event_tasks (
  id, event_id, phase_id, title, assignee_role, assignee_id, status, priority
) values (
  '71000000-0000-0000-0000-000000000012', '71000000-0000-0000-0000-000000000010',
  '71000000-0000-0000-0000-000000000011', '四轮测试任务', 'design',
  '70000000-0000-0000-0000-000000000004', 'todo', 'high'
);

-- business：软删 blog_articles
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
insert into public.blog_articles (
  id, title, account, publish_date, views
) values (
  '71000000-0000-0000-0000-000000000003', '四轮测试文章', 'TK观察', now(), 500
);
select lives_ok($$
  update public.blog_articles set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000003'
$$, 'business can soft delete blog articles');
select is(
  (select count(*) from public.blog_articles
   where id = '71000000-0000-0000-0000-000000000003' and deleted_at is not null),
  1::bigint,
  'business can inspect soft-deleted article'
);

-- editing：软删 videos / competitor_accounts
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
insert into public.videos (
  id, title, file_path, region
) values (
  '71000000-0000-0000-0000-000000000004', '四轮测试成片', 'video-files/round4.mp4', 'US'
);
select lives_ok($$
  update public.videos set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000004'
$$, 'editing can soft delete videos');
select is(
  (select count(*) from public.videos
   where id = '71000000-0000-0000-0000-000000000004' and deleted_at is not null),
  1::bigint,
  'editing can inspect soft-deleted video'
);

insert into public.competitor_accounts (
  id, name, platform, category
) values (
  '71000000-0000-0000-0000-000000000005', '四轮测试对标', 'TikTok', '出海跨境'
);
select lives_ok($$
  update public.competitor_accounts set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000005'
$$, 'editing can soft delete competitor accounts');

-- market coordinator：软删活动任务（assigned 角色由触发器禁止软删，不在此验证）
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.event_tasks set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000012'
$$, 'market coordinator can soft delete event tasks');
select is(
  (select count(*) from public.event_tasks
   where id = '71000000-0000-0000-0000-000000000012' and deleted_at is not null),
  1::bigint,
  'market can inspect soft-deleted event task'
);

-- boss：软删 gmv_metrics / team_tasks
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
insert into public.gmv_metrics (
  id, metric_date, amount_minor, currency, region
) values (
  '71000000-0000-0000-0000-000000000006', now(), 888800, 'CNY', 'US'
);
select lives_ok($$
  update public.gmv_metrics set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000006'
$$, 'boss can soft delete gmv metrics');
select is(
  (select count(*) from public.gmv_metrics
   where id = '71000000-0000-0000-0000-000000000006' and deleted_at is not null),
  1::bigint,
  'boss can inspect soft-deleted gmv metrics'
);

insert into public.team_tasks (
  id, assignee_name, title, progress, region
) values (
  '71000000-0000-0000-0000-000000000007', '磊哥', '四轮测试任务', 0, 'US'
);
select lives_ok($$
  update public.team_tasks set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000007'
$$, 'boss can soft delete team tasks');

-- 通知：owner 创建系统通知 → recipient 本人软删自己的通知
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
insert into public.notifications (
  id, recipient_id, type, title, content
) values (
  '71000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000003',
  'deadline', '四轮测试通知', '任务即将到期'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.notifications set deleted_at = now()
  where id = '71000000-0000-0000-0000-000000000008'
$$, 'recipient can soft delete own notification');
select is(
  (select count(*) from public.notifications
   where id = '71000000-0000-0000-0000-000000000008' and deleted_at is not null),
  1::bigint,
  'recipient can inspect soft-deleted notification'
);

select * from finish();
rollback;
