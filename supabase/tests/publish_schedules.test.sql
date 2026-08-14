-- 剪辑工作台发布排期表测试：结构、RLS 权限、必填与状态约束、软删除可见性。
-- 覆盖：editing 可读写排期、business 无读取权限、owner/boss/editing 角色收口可见（含软删行，
--       前端统一过滤 deleted_at，与项目软删除 SELECT 策略修正轮同模式）。
begin;
select plan(20);

select has_table('public', 'publish_schedules', 'publish schedules table exists');
select col_is_pk('public', 'publish_schedules', 'id', 'publish schedules use uuid primary keys');
select col_is_fk('public', 'publish_schedules', 'video_id', 'publish schedules reference videos');
select col_is_fk('public', 'publish_schedules', 'video_task_id', 'publish schedules reference video tasks');
select col_not_null('public', 'publish_schedules', 'title', 'title is required');
select col_not_null('public', 'publish_schedules', 'account', 'account is required');
select col_not_null('public', 'publish_schedules', 'publish_at', 'publish time is required');
select has_check('public', 'publish_schedules', 'publish schedules have value constraints');
select trigger_is(
  'public', 'publish_schedules', 'publish_schedules_set_updated_at',
  'public', 'set_updated_at'
);
select policies_are('public', 'publish_schedules', array[
  'editing collaborators can read publish schedules',
  'editing collaborators can create publish schedules',
  'editing collaborators can update publish schedules',
  'owners can hard delete publish schedules'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('52000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'publish-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'publish-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('52000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'publish-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '52000000-0000-0000-0000-000000000001' then 'owner'
      when '52000000-0000-0000-0000-000000000002' then 'business'
      when '52000000-0000-0000-0000-000000000003' then 'editing'
    end
where id::text like '52000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"52000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

-- editing 可新建排期
select lives_ok($$
  insert into public.publish_schedules (title, account, region, platform, publish_at)
  values ('厦门切片', 'TK观察磊哥', 'CN', '微信视频号', now() + interval '1 day')
$$, 'editing can create a publish schedule');

-- editing 可更新状态
select lives_ok($$
  update public.publish_schedules
  set status = 'published'
  where title = '厦门切片'
$$, 'editing can update schedule status');

-- 必填约束：缺 title 拒绝写入
select throws_ok($$
  insert into public.publish_schedules (account, publish_at)
  values ('TK观察磊哥', now() + interval '1 day')
$$, '23502', null, 'missing title is rejected');

-- 状态枚举约束
select throws_ok($$
  insert into public.publish_schedules (title, account, publish_at, status)
  values ('非法状态', 'TK观察磊哥', now() + interval '1 day', 'archived')
$$, '23514', null, 'invalid status is rejected');

-- 账号枚举约束
select throws_ok($$
  insert into public.publish_schedules (title, account, publish_at)
  values ('非法账号', '不存在账号', now() + interval '1 day')
$$, '23514', null, 'invalid account is rejected');

-- editing 可见非软删行
select is(
  (select count(*) from public.publish_schedules where title = '厦门切片'),
  1::bigint,
  'editing can read active schedules'
);

-- 软删除后 editing 仍可读（RLS 角色收口，前端统一过滤 deleted_at）
select lives_ok($$
  update public.publish_schedules
  set deleted_at = now()
  where title = '厦门切片'
$$, 'editing can soft delete via update');
select is(
  (select count(*) from public.publish_schedules where title = '厦门切片'),
  1::bigint,
  'editing can read soft deleted schedules at RLS level'
);

-- owner 可见软删行
select set_config(
  'request.jwt.claims',
  '{"sub":"52000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.publish_schedules where title = '厦门切片'),
  1::bigint,
  'owner can see soft deleted schedules'
);

-- business 无读取权限
select set_config(
  'request.jwt.claims',
  '{"sub":"52000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.publish_schedules),
  0::bigint,
  'business cannot read publish schedules'
);

select * from finish();
rollback;
