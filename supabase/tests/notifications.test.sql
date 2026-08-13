begin;
select plan(10);

select has_table('public', 'notifications', 'notifications table exists');
select col_is_fk('public', 'notifications', 'recipient_id', 'notifications recipient references profiles');
select has_check('public', 'notifications', 'notifications have type and content checks');
select policies_are('public', 'notifications', array[
  'members can read own notifications',
  'members can mark own notifications read',
  'owner can manage notifications'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'notice-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'notice-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'notice-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '90000000-0000-0000-0000-000000000001' then 'owner'
      when '90000000-0000-0000-0000-000000000002' then 'boss'
      when '90000000-0000-0000-0000-000000000003' then 'business'
    end
where id::text like '90000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"90000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.notifications (
    recipient_id, type, title, content, link
  ) values (
    '90000000-0000-0000-0000-000000000002', 'deadline',
    '任务到期', '今天有 1 条任务到期', '/overview'
  )
$$, 'owner can create notification');

select set_config(
  'request.jwt.claims',
  '{"sub":"90000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.notifications), 1::bigint, 'recipient can read own notification');
select lives_ok($$
  update public.notifications set is_read = true
  where recipient_id = '90000000-0000-0000-0000-000000000002'
$$, 'recipient can mark notification read');
select throws_ok($$
  insert into public.notifications (
    recipient_id, type, title, content
  ) values (
    '90000000-0000-0000-0000-000000000002', 'comment',
    '越权创建', '普通成员不能创建通知'
  )
$$, '42501', null, 'recipient cannot create notification');

select set_config(
  'request.jwt.claims',
  '{"sub":"90000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.notifications), 0::bigint, 'other member cannot read notification');
update public.notifications set is_read = false
where recipient_id = '90000000-0000-0000-0000-000000000002';
select set_config(
  'request.jwt.claims',
  '{"sub":"90000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.notifications where is_read), 1::bigint, 'other member cannot update notification');

select * from finish();
rollback;
