begin;
select plan(4);

select has_function('public', 'notify_boss_on_design_review', 'design review evaluator can find notification function');
select trigger_is(
  'public', 'design_assets', 'design_assets_notify_boss_on_review',
  'public', 'notify_boss_on_design_review'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '93000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'eval-review-boss@example.test', '', now(), '{}', '{}', now(), now()
);
update public.profiles set status = 'active', role = 'boss'
where id = '93000000-0000-0000-0000-000000000001';

insert into public.design_assets (id, file_name, file_path, region, status)
values ('93000000-0000-0000-0000-000000000002', '评估素材.png', 'design-assets/eval.png', 'US', 'draft');
update public.design_assets
set status = 'pending_review'
where id = '93000000-0000-0000-0000-000000000002';

select is(
  (select title from public.notifications
   where recipient_id = '93000000-0000-0000-0000-000000000001'
     and record_id = '93000000-0000-0000-0000-000000000002'),
  '设计稿待审核',
  'boss receives the review title'
);
select is(
  (select link from public.notifications
   where recipient_id = '93000000-0000-0000-0000-000000000001'
     and record_id = '93000000-0000-0000-0000-000000000002'),
  '/design',
  'notification links back to design workspace'
);

select * from finish();
rollback;
