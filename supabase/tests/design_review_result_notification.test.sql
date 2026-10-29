begin;
select plan(10);

select has_function(
  'public', 'notify_design_asset_owner_on_review',
  'design review result notification function exists'
);
select has_trigger(
  'public', 'design_assets', 'design_assets_notify_owner_on_review',
  'design review result notification trigger exists'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '94000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'result-boss@example.test', '', now(), '{}', '{}', now(), now()
  ),
  (
    '94000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'result-designer@example.test', '', now(), '{}', '{}', now(), now()
  );

update public.profiles
set status = 'active',
    role = case id
      when '94000000-0000-0000-0000-000000000001' then 'boss'
      when '94000000-0000-0000-0000-000000000002' then 'design'
    end
where id in (
  '94000000-0000-0000-0000-000000000001',
  '94000000-0000-0000-0000-000000000002'
);

insert into public.design_assets (
  id, file_name, file_path, region, status, owner_id
) values (
  '94000000-0000-0000-0000-000000000003',
  '审核结果素材.png',
  'design-assets/result.png',
  'US',
  'pending_review',
  '94000000-0000-0000-0000-000000000002'
);

update public.design_assets
set status = 'approved',
    reviewed_by = '94000000-0000-0000-0000-000000000001',
    reviewed_at = now()
where id = '94000000-0000-0000-0000-000000000003';

select is(
  (
    select count(*)
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and type = 'design_review'
      and record_type = 'design_asset'
      and record_id = '94000000-0000-0000-0000-000000000003'
  ),
  1::bigint,
  'approval creates one notification for the asset owner'
);
select is(
  (
    select title
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and record_id = '94000000-0000-0000-0000-000000000003'
  ),
  '设计稿已通过',
  'approval notification uses the approved title'
);
select is(
  (
    select link
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and record_id = '94000000-0000-0000-0000-000000000003'
  ),
  '/design',
  'result notification links back to the design workspace'
);

update public.design_assets
set status = 'approved'
where id = '94000000-0000-0000-0000-000000000003';

select is(
  (
    select count(*)
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and type = 'design_review'
      and record_id = '94000000-0000-0000-0000-000000000003'
  ),
  1::bigint,
  'repeating the same status does not duplicate the result notification'
);

update public.design_assets
set status = 'pending_review'
where id = '94000000-0000-0000-0000-000000000003';
update public.design_assets
set status = 'rejected',
    review_reason = '尺寸不符合投放要求',
    reviewed_by = '94000000-0000-0000-0000-000000000001',
    reviewed_at = now()
where id = '94000000-0000-0000-0000-000000000003';

select is(
  (
    select count(*)
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and type = 'design_review'
      and record_id = '94000000-0000-0000-0000-000000000003'
  ),
  2::bigint,
  'a new review cycle creates a new result notification'
);
select is(
  (
    select title
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and content like '%尺寸不符合投放要求%'
  ),
  '设计稿已驳回',
  'rejection notification uses the rejected title'
);
select is(
  (
    select content
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000002'
      and content like '%尺寸不符合投放要求%'
  ),
  '「审核结果素材.png」未通过审核，原因：尺寸不符合投放要求',
  'rejection notification includes the review reason'
);
select is(
  (
    select count(*)
    from public.notifications
    where recipient_id = '94000000-0000-0000-0000-000000000001'
      and type = 'design_review'
      and record_type = 'design_asset'
  ),
  0::bigint,
  'the reviewer does not receive an owner result notification'
);

select * from finish();
rollback;