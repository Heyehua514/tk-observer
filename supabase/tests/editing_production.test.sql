begin;
select plan(20);

select has_table('public', 'video_tasks', 'video tasks table exists');
select has_table('public', 'videos', 'videos table exists');
select col_is_fk('public', 'videos', 'creator_id', 'videos reference creators');
select has_check('public', 'video_tasks', 'video tasks have value constraints');
select has_check('public', 'videos', 'videos have value constraints');
select trigger_is(
  'public', 'video_tasks', 'video_tasks_set_updated_at',
  'public', 'set_updated_at'
);
select trigger_is(
  'public', 'videos', 'videos_set_updated_at',
  'public', 'set_updated_at'
);
select policies_are('public', 'video_tasks', array[
  'editing collaborators can read video tasks',
  'editing collaborators can create video tasks',
  'editing collaborators can update video tasks',
  'owners can hard delete video tasks'
]);
select policies_are('public', 'videos', array[
  'video collaborators can read videos',
  'video editors can create videos',
  'video editors can update videos',
  'owners can hard delete videos'
]);
select is(
  (select public from storage.buckets where id = 'video-files'),
  false,
  'video files bucket is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'video-files'),
  536870912::bigint,
  'video files allow 512 MiB objects'
);
select is(
  (
    select allowed_mime_types @> array['video/mp4','video/webm','video/quicktime']
    from storage.buckets where id = 'video-files'
  ),
  true,
  'video files accept required video MIME types'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'production-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'production-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now()),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'production-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when '50000000-0000-0000-0000-000000000001' then 'business'
      when '50000000-0000-0000-0000-000000000002' then 'editing'
      when '50000000-0000-0000-0000-000000000003' then 'market'
    end
where id::text like '50000000-0000-0000-0000-00000000000%';

insert into public.creators (
  id, nickname, tiktok_url, followers, region, cooperation_status, owner_name
) values (
  '51000000-0000-0000-0000-000000000001', '成片测试达人',
  'https://www.tiktok.com/@production-test', 5000, 'US', 'signed', '谢洁'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.video_tasks (
    id, title, status, owner_name, region
  ) values (
    '52000000-0000-0000-0000-000000000001', '剪辑测试任务', 'editing', '谢洁', 'US'
  )
$$, 'editing can create video tasks');
select lives_ok($$
  insert into public.videos (
    id, title, file_path, creator_id, region
  ) values (
    '53000000-0000-0000-0000-000000000001', '测试成片',
    'videos/53000000-0000-0000-0000-000000000001/final.mp4',
    '51000000-0000-0000-0000-000000000001', 'US'
  )
$$, 'editing can create videos');

select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.videos where title = '测试成片'),
  1::bigint,
  'business can read creator videos'
);
select is(
  (select count(*) from public.video_tasks where title = '剪辑测试任务'),
  0::bigint,
  'business cannot read video tasks'
);
select lives_ok($$
  update public.videos set title = '商务越权修改'
  where id = '53000000-0000-0000-0000-000000000001'
$$, 'unauthorized update affects no visible row');
select is(
  (select title from public.videos where id = '53000000-0000-0000-0000-000000000001'),
  '测试成片',
  'business cannot update videos'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.videos), 0::bigint, 'market cannot read videos');
select is((select count(*) from public.video_tasks), 0::bigint, 'market cannot read video tasks');

select * from finish();
rollback;
