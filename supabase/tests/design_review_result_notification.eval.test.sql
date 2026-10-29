begin;
select plan(4);

select has_function(
  'public', 'notify_design_asset_owner_on_review',
  'design review result evaluator can find the notification function'
);
select trigger_is(
  'public', 'design_assets', 'design_assets_notify_owner_on_review',
  'public', 'notify_design_asset_owner_on_review'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '95000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'eval-result-boss@example.test', '', now(), '{}', '{}', now(), now()
  ),
  (
    '95000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'eval-result-designer@example.test', '', now(), '{}', '{}', now(), now()
  );

update public.profiles
set status = 'active',
    role = case id
      when '95000000-0000-0000-0000-000000000001' then 'boss'
      when '95000000-0000-0000-0000-000000000002' then 'design'
    end
where id in (
  '95000000-0000-0000-0000-000000000001',
  '95000000-0000-0000-0000-000000000002'
);

insert into public.design_assets (
  id, file_name, file_path, region, status, owner_id
) values (
  '95000000-0000-0000-0000-000000000003',
  '评估结果素材.png',
  'design-assets/eval-result.png',
  'US',
  'pending_review',
  '95000000-0000-0000-0000-000000000002'
);

update public.design_assets
set status = 'approved',
    reviewed_by = '95000000-0000-0000-0000-000000000001',
    reviewed_at = now()
where id = '95000000-0000-0000-0000-000000000003';

select is(
  (
    select title
    from public.notifications
    where recipient_id = '95000000-0000-0000-0000-000000000002'
      and record_id = '95000000-0000-0000-0000-000000000003'
  ),
  '设计稿已通过',
  'owner receives the approval result title'
);
select is(
  (
    select record_type || ':' || link
    from public.notifications
    where recipient_id = '95000000-0000-0000-0000-000000000002'
      and record_id = '95000000-0000-0000-0000-000000000003'
  ),
  'design_asset:/design',
  'owner result notification carries the design asset deep link'
);

select * from finish();
rollback;