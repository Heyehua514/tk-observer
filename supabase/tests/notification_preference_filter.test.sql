begin;
select plan(4);

select has_function('public', 'filter_disabled_notification', 'preference filter function exists');
select has_trigger(
  'public', 'notifications', 'notifications_filter_disabled_preference',
  'notification preference filter trigger exists'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'preference-filter@example.test', '', now(), '{}', '{}', now(), now()
);
update public.profiles set status = 'active', role = 'business'
where id = '91000000-0000-0000-0000-000000000001';
insert into public.notification_preferences (user_id, deadline_enabled)
values ('91000000-0000-0000-0000-000000000001', false);

select is(
  (select count(*) from public.notifications where recipient_id = '91000000-0000-0000-0000-000000000001'),
  0::bigint,
  'disabled deadline notification is filtered'
);

insert into public.notifications (recipient_id, type, title, content)
values ('91000000-0000-0000-0000-000000000001', 'comment', '偏好默认提醒', '跟进提醒');
select is(
  (select count(*) from public.notifications where recipient_id = '91000000-0000-0000-0000-000000000001'),
  1::bigint,
  'enabled categories remain available'
);

select * from finish();
rollback;
