begin;
select plan(26);

select has_table('public', 'opportunities', 'opportunities table exists');
select has_table('public', 'channel_orders', 'channel orders table exists');
select has_table('public', 'social_plans', 'social plans table exists');
select col_is_fk('public', 'opportunities', 'client_id', 'opportunities reference clients');
select col_is_fk('public', 'channel_orders', 'creator_id', 'orders reference creators');
select has_check('public', 'opportunities', 'opportunities have business constraints');
select has_check('public', 'channel_orders', 'orders have business constraints');
select has_check('public', 'social_plans', 'social plans have business constraints');
select trigger_is(
  'public', 'opportunities', 'opportunities_set_probability',
  'public', 'set_opportunity_probability'
);
select trigger_is(
  'public', 'opportunities', 'opportunities_set_updated_at',
  'public', 'set_updated_at'
);
select trigger_is(
  'public', 'channel_orders', 'channel_orders_set_updated_at',
  'public', 'set_updated_at'
);
select trigger_is(
  'public', 'social_plans', 'social_plans_set_updated_at',
  'public', 'set_updated_at'
);
select policies_are('public', 'opportunities', array[
  'business collaborators can read opportunities',
  'owners and business can create opportunities',
  'owners and business can update opportunities',
  'owners can hard delete opportunities'
]);
select policies_are('public', 'channel_orders', array[
  'business collaborators can read channel orders',
  'owners and business can create channel orders',
  'owners and business can update channel orders',
  'owners can hard delete channel orders'
]);
select policies_are('public', 'social_plans', array[
  'business collaborators can read social plans',
  'owners and business can create social plans',
  'owners and business can update social plans',
  'owners can hard delete social plans'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'business-tx-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'business-tx-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'business-tx-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '20000000-0000-0000-0000-000000000001' then 'boss'
      when '20000000-0000-0000-0000-000000000002' then 'business'
      when '20000000-0000-0000-0000-000000000003' then 'market'
    end
where id::text like '20000000-0000-0000-0000-00000000000%';

insert into public.clients (id, name, industry, source, level)
values ('21000000-0000-0000-0000-000000000001', '商务测试客户', 'brand', 'outbound', 'A');
insert into public.creators (
  id, nickname, tiktok_url, followers, region, cooperation_status,
  owner_name, is_biz_available
) values (
  '22000000-0000-0000-0000-000000000001', '商务测试达人',
  'https://www.tiktok.com/@business-test', 2000, 'US', 'signed', '谢洁', true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select lives_ok($$
  insert into public.opportunities (
    id, client_id, title, type, amount, stage, expected_close
  ) values (
    '23000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    '测试商机', 'channel_order', 100000, 'contact', now() + interval '7 days'
  )
$$, 'business can create opportunities');
select is(
  (select probability from public.opportunities where title = '测试商机'),
  10,
  'contact probability is server-derived'
);
select lives_ok($$
  update public.opportunities set stage = 'won'
  where id = '23000000-0000-0000-0000-000000000001'
$$, 'business can close opportunities');
select is(
  (select probability from public.opportunities where title = '测试商机'),
  100,
  'won probability is server-derived'
);
select throws_ok($$
  update public.opportunities set stage = 'lost', lost_reason = ' '
  where id = '23000000-0000-0000-0000-000000000001'
$$, '23514', 'new row for relation "opportunities" violates check constraint "opportunities_lost_stage_reason_check"',
  'lost opportunities require a reason');
select lives_ok($$
  insert into public.channel_orders (
    title, client_id, creator_id, platform, content_type, amount, status
  ) values (
    '测试商单', '21000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001', 'tiktok', 'spoken_placement',
    80000, 'confirmed'
  )
$$, 'business can create channel orders');
select lives_ok($$
  insert into public.social_plans (
    date, content, linked_opportunity_id, status
  ) values (
    now(), '朋友圈测试内容', '23000000-0000-0000-0000-000000000001', 'planned'
  )
$$, 'business can link social plans to opportunities');

select lives_ok($$
  update public.opportunities
  set deleted_at = now()
  where id = '23000000-0000-0000-0000-000000000001'
$$, 'business can soft delete opportunities');

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.opportunities where title = '测试商机'), 0::bigint, 'market cannot read opportunities');

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is((select count(*) from public.opportunities where title = '测试商机' and deleted_at is null), 0::bigint, 'boss sees no live rows after soft delete');
select is(
  (select count(*) from public.opportunities where title = '测试商机' and deleted_at is not null),
  1::bigint,
  'boss can inspect soft-deleted business records'
);

select * from finish();
rollback;
