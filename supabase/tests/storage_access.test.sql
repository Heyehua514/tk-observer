-- Storage 角色化访问测试：验证各工作台 bucket 的 RLS 读写边界与头像自助目录。
-- 所属工作台：全局。权限：只读断言 + 事务内模拟，不触碰真实数据。
begin;
select plan(12);

select policies_are('storage', 'objects', array[
  'owners can read private workspace files',
  'owners can upload private workspace files',
  'owners can update private workspace files',
  'owners can delete private workspace files',
  'video collaborators can read video files',
  'video editors can upload video files',
  'video editors can update video files',
  'video editors can delete video files',
  'design collaborators can read design files',
  'design can upload design files',
  'design collaborators can update design files',
  'design can delete design files',
  'market collaborators can read venue files',
  'market can upload venue files',
  'market collaborators can update venue files',
  'market can delete venue files',
  'material collaborators can read material files',
  'market can upload material files',
  'material collaborators can update material files',
  'market can delete material files',
  'market collaborators can read finance files',
  'market can upload finance files',
  'market collaborators can update finance files',
  'market can delete finance files',
  'members can read avatars',
  'members can upload own avatars',
  'members can update own avatars',
  'members can delete own avatars'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'st-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now()),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'st-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'st-design@example.test', '', now(), '{}', '{"name":"Design"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '70000000-0000-0000-0000-000000000001' then 'market'
      when '70000000-0000-0000-0000-000000000002' then 'business'
      when '70000000-0000-0000-0000-000000000003' then 'design'
    end
where id::text like '70000000-0000-0000-0000-00000000000%';

set local role authenticated;

-- 市场角色：venue-photos / finance-receipts 可写，design-assets 不可写。
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('venue-photos', 'market/venue-a.png', '70000000-0000-0000-0000-000000000001')
$$, 'market can upload venue photos');
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('finance-receipts', 'market/receipt-a.png', '70000000-0000-0000-0000-000000000001')
$$, 'market can upload finance receipts');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('design-assets', 'market/poster.png', '70000000-0000-0000-0000-000000000001')
$$, '42501', null, 'market cannot upload into design-assets');
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('avatars', '70000000-0000-0000-0000-000000000001/me.png', '70000000-0000-0000-0000-000000000001')
$$, 'member can upload own avatar');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('avatars', '70000000-0000-0000-0000-000000000002/other.png', '70000000-0000-0000-0000-000000000001')
$$, '42501', null, 'member cannot upload into another member avatar folder');

-- 商务角色：venue-photos 只读，不可写；design-assets 不可写。
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok($$
  select name from storage.objects where bucket_id = 'venue-photos'
$$, 'business can read venue photos');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('venue-photos', 'business/venue-b.png', '70000000-0000-0000-0000-000000000002')
$$, '42501', null, 'business cannot upload venue photos');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('design-assets', 'business/poster.png', '70000000-0000-0000-0000-000000000002')
$$, '42501', null, 'business cannot upload into design-assets');

-- 设计角色：design-assets 可写，venue-photos 不可写。
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('design-assets', 'design/poster.png', '70000000-0000-0000-0000-000000000003')
$$, 'design can upload design assets');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('venue-photos', 'design/venue-c.png', '70000000-0000-0000-0000-000000000003')
$$, '42501', null, 'design cannot upload venue photos');

-- 全员可读头像目录（任意成员可读）。
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$
  select name from storage.objects where bucket_id = 'avatars'
$$, 'any member can read avatar files');

select * from finish();
rollback;
