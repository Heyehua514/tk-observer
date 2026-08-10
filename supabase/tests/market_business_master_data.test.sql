begin;
select plan(20);

select has_table('public', 'creators', 'creators table exists');
select has_table('public', 'clients', 'clients table exists');
select col_is_pk('public', 'creators', 'id', 'creators use uuid primary keys');
select col_is_unique('public', 'creators', 'legacy_id', 'creator legacy ids are unique');
select col_is_unique('public', 'clients', 'legacy_id', 'client legacy ids are unique');
select has_check('public', 'creators', 'creators have value constraints');
select has_check('public', 'clients', 'clients have value constraints');
select trigger_is(
  'public', 'creators', 'creators_set_updated_at',
  'public', 'set_updated_at'
);
select trigger_is(
  'public', 'creators', 'creators_enforce_business_update',
  'public', 'enforce_creator_business_update'
);
select trigger_is(
  'public', 'clients', 'clients_set_updated_at',
  'public', 'set_updated_at'
);
select policies_are('public', 'creators', array[
  'creator collaborators can read creators',
  'creator owners and editors can create creators',
  'creator owners and editors can update creators',
  'business can update creator business fields',
  'owners can hard delete creators'
]);
select policies_are('public', 'clients', array[
  'client collaborators can read clients',
  'owners and business can create clients',
  'owners and business can update clients',
  'owners can hard delete clients'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'core-owner@example.test', '', now(), '{}', '{"name":"Owner"}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'core-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'core-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'core-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '10000000-0000-0000-0000-000000000001' then 'owner'
      when '10000000-0000-0000-0000-000000000002' then 'business'
      when '10000000-0000-0000-0000-000000000003' then 'market'
      when '10000000-0000-0000-0000-000000000004' then 'editing'
    end
where id::text like '10000000-0000-0000-0000-00000000000%';

insert into public.creators (
  nickname, tiktok_url, followers, region, cooperation_status, owner_name
) values ('测试达人', 'https://www.tiktok.com/@test', 1000, 'US', 'pending', '谢洁');

insert into public.clients (name, industry, source, level)
values ('测试客户', 'brand', 'outbound', 'A');

set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.creators), 1::bigint, 'business can read creators');
select lives_ok(
  $$ update public.creators set cooperation_notes = '可合作' where nickname = '测试达人' $$,
  'business can update creator business fields'
);
select throws_ok(
  $$ update public.creators set nickname = '越权修改' where nickname = '测试达人' $$,
  '42501',
  'business may only update creator business fields',
  'business cannot update editing-owned creator fields'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select lives_ok(
  $$ update public.creators set nickname = '剪辑已更新' where nickname = '测试达人' $$,
  'editing can update creator master data'
);
select is((select count(*) from public.clients), 0::bigint, 'editing cannot read clients');

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.clients), 1::bigint, 'market can read clients for sponsorship expansion');

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok(
  $$ update public.clients set deleted_at = now() where name = '测试客户' $$,
  'owner can soft delete clients'
);
select is((select count(*) from public.clients where deleted_at is not null), 1::bigint, 'owner can inspect soft-deleted clients');

select * from finish();
rollback;
