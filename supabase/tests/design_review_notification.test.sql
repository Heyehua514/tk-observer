begin;
select plan(5);

select has_function('public', 'notify_boss_on_design_review', 'design review notification function exists');
select has_trigger(
  'public', 'design_assets', 'design_assets_notify_boss_on_review',
  'design review notification trigger exists'
);
select col_has_check(
  'public', 'notifications', 'record_type',
  'notifications record type supports design assets'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '92000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'review-boss@example.test', '', now(), '{}', '{}', now(), now()
);
update public.profiles set status = 'active', role = 'boss'
where id = '92000000-0000-0000-0000-000000000001';

insert into public.design_assets (id, file_name, file_path, region, status)
values ('92000000-0000-0000-0000-000000000002', '审核素材.png', 'design-assets/review.png', 'US', 'draft');
update public.design_assets
set status = 'pending_review'
where id = '92000000-0000-0000-0000-000000000002';

select is(
  (select count(*) from public.notifications
   where recipient_id = '92000000-0000-0000-0000-000000000001'
     and type = 'design_review'
     and record_id = '92000000-0000-0000-0000-000000000002'),
  1::bigint,
  'pending review creates one boss notification'
);

update public.design_assets
set status = 'pending_review'
where id = '92000000-0000-0000-0000-000000000002';
select is(
  (select count(*) from public.notifications
   where recipient_id = '92000000-0000-0000-0000-000000000001'
     and type = 'design_review'
     and record_id = '92000000-0000-0000-0000-000000000002'),
  1::bigint,
  'repeated pending review does not duplicate notification'
);

select * from finish();
rollback;
