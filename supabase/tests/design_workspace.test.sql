begin;
select plan(23);

select has_table('public', 'design_assets', 'design assets table exists');
select has_table('public', 'design_tasks', 'design tasks table exists');
select has_table('public', 'design_requirements', 'design requirements table exists');
select has_table('public', 'design_references', 'design references table exists');
select has_table('public', 'design_deliverables', 'design deliverables table exists');
select col_is_fk('public', 'design_requirements', 'requester_id', 'requirements reference requester profiles');
select col_is_fk('public', 'design_references', 'requirement_id', 'references point to requirements');
select col_is_fk('public', 'design_deliverables', 'asset_id', 'deliverables point to assets');
select has_check('public', 'design_assets', 'assets have status and rejection checks');
select has_check('public', 'design_requirements', 'requirements have status and priority checks');
select trigger_is(
  'public', 'design_requirements', 'design_requirements_enforce_status_update',
  'public', 'enforce_design_requirement_status_update'
);
select policies_are('public', 'design_requirements', array[
  'requirement collaborators can read requirements',
  'requesters can create requirements',
  'requirement collaborators can update requirements',
  'owners can hard delete requirements'
]);
select policies_are('public', 'design_assets', array[
  'design collaborators can read assets',
  'design can create assets',
  'design collaborators can update assets',
  'owners can hard delete assets'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'design-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'design-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'design-user@example.test', '', now(), '{}', '{"name":"Design"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '60000000-0000-0000-0000-000000000001' then 'owner'
      when '60000000-0000-0000-0000-000000000002' then 'business'
      when '60000000-0000-0000-0000-000000000003' then 'design'
    end
where id::text like '60000000-0000-0000-0000-00000000000%';

set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.design_requirements (
    id, title, description, requester_id, target_size, usage_scene,
    copy_content, delivery_format, priority, due_date, status
  ) values (
    '61000000-0000-0000-0000-000000000001',
    '活动海报', '需要活动主视觉', '60000000-0000-0000-0000-000000000002',
    '1080x1920', '朋友圈宣发', '金鳞会闭门沙龙', 'png', '高',
    now() + interval '3 days', 'pending'
  )
$$, 'business can create pending requirement for self');
select throws_ok($$
  insert into public.design_requirements (
    title, description, requester_id, target_size, usage_scene,
    copy_content, delivery_format, priority, due_date, status
  ) values (
    '越权需求', '错误状态', '60000000-0000-0000-0000-000000000002',
    '1080x1920', '朋友圈宣发', '内容', 'png', '中',
    now() + interval '3 days', 'delivered'
  )
$$, '42501', null, 'business cannot create non-pending requirement');

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.design_requirements set status = 'in_progress'
  where id = '61000000-0000-0000-0000-000000000001'
$$, 'design can accept pending requirement');
select throws_ok($$
  update public.design_requirements set title = '设计修改标题'
  where id = '61000000-0000-0000-0000-000000000001'
$$, '42501', 'design may only update requirement status',
  'design cannot change requirement content');
select lives_ok($$
  insert into public.design_assets (
    id, file_name, file_path, dimensions, region, status, owner_id
  ) values (
    '62000000-0000-0000-0000-000000000001',
    '活动海报.png', 'design-assets/activity.png', '1080x1920', 'US', 'draft',
    '60000000-0000-0000-0000-000000000003'
  )
$$, 'design can create design asset draft');
select throws_ok($$
  update public.design_assets set status = 'rejected', review_reason = ''
  where id = '62000000-0000-0000-0000-000000000001'
$$, '23514', null, 'rejected asset requires review reason');
select lives_ok($$
  update public.design_requirements set status = 'delivered'
  where id = '61000000-0000-0000-0000-000000000001'
$$, 'design can deliver in-progress requirement');
select lives_ok($$
  insert into public.design_deliverables (
    requirement_id, asset_id, exported_size, exported_format, checklist_ok, delivered_at
  ) values (
    '61000000-0000-0000-0000-000000000001',
    '62000000-0000-0000-0000-000000000001',
    '1080x1920', 'png', true, now()
  )
$$, 'design can create deliverable');

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select lives_ok($$
  update public.design_requirements set status = 'revised'
  where id = '61000000-0000-0000-0000-000000000001'
$$, 'requester can return delivered requirement for revision');
select is((select count(*) from public.design_deliverables), 1::bigint, 'business can read deliverables');

select * from finish();
rollback;
