begin;
select plan(36);

select has_table('public', 'video_ideas', 'video ideas table exists');
select has_table('public', 'import_history', 'import history table exists');
select has_table('public', 'competitor_accounts', 'competitor accounts table exists');
select has_table('public', 'competitor_videos', 'competitor videos table exists');
select has_table('public', 'trending_topics', 'trending topics table exists');
select has_table('public', 'competitor_style_analysis', 'competitor style analysis table exists');
select col_is_fk('public', 'competitor_videos', 'competitor_id', 'competitor videos reference accounts');
select col_is_fk('public', 'competitor_style_analysis', 'competitor_id', 'style analyses reference accounts');
select col_is_unique('public', 'video_ideas', array['title','publish_date'], 'video idea title and date are unique');
select has_check('public', 'video_ideas', 'video ideas have metric constraints');
select has_check('public', 'import_history', 'import history has count constraints');
select has_check('public', 'competitor_accounts', 'competitor accounts have value constraints');
select has_check('public', 'competitor_videos', 'competitor videos have metric constraints');
select has_check('public', 'trending_topics', 'trending topics have value constraints');
select has_check('public', 'competitor_style_analysis', 'style analyses have value constraints');
select trigger_is('public', 'video_ideas', 'video_ideas_set_updated_at', 'public', 'set_updated_at');
select trigger_is('public', 'competitor_accounts', 'competitor_accounts_set_updated_at', 'public', 'set_updated_at');
select trigger_is('public', 'import_history', 'import_history_enforce_immutable', 'public', 'enforce_import_history_immutable');
select policies_are('public', 'video_ideas', array[
  'editing collaborators can read video ideas', 'editing collaborators can create video ideas',
  'editing collaborators can update video ideas', 'owners can hard delete video ideas'
]);
select policies_are('public', 'import_history', array[
  'editing collaborators can read import history', 'editing collaborators can create import history',
  'editing collaborators can invalidate import history', 'owners can hard delete import history'
]);
select policies_are('public', 'competitor_accounts', array[
  'competitor collaborators can read competitor accounts', 'competitor collaborators can create competitor accounts',
  'competitor collaborators can update competitor accounts', 'owners can hard delete competitor accounts'
]);
select policies_are('public', 'competitor_videos', array[
  'editing collaborators can read competitor videos', 'editing collaborators can create competitor videos',
  'editing collaborators can update competitor videos', 'owners can hard delete competitor videos'
]);
select policies_are('public', 'trending_topics', array[
  'editing collaborators can read trending topics', 'editing collaborators can create trending topics',
  'editing collaborators can update trending topics', 'owners can hard delete trending topics'
]);
select policies_are('public', 'competitor_style_analysis', array[
  'editing collaborators can read style analyses', 'editing collaborators can create style analyses',
  'editing collaborators can update style analyses', 'owners can hard delete style analyses'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'research-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'research-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now()),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'research-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles set status = 'active', role = case id
  when '60000000-0000-0000-0000-000000000001' then 'business'
  when '60000000-0000-0000-0000-000000000002' then 'editing'
  when '60000000-0000-0000-0000-000000000003' then 'market'
end where id::text like '60000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok($$
  insert into public.video_ideas (
    account, video_type, title, publish_date, views, completion_rate
  ) values ('跨境TK磊哥', '口播', '研究测试选题', now(), 1000, 50)
$$, 'editing can create video ideas');
select lives_ok($$
  insert into public.import_history (
    id, imported_at, file_name, total_rows, new_count, updated_count, snapshot
  ) values (
    '61000000-0000-0000-0000-000000000001', now(), 'ideas.csv', 1, 1, 0,
    '{"totalVideos":1}'::jsonb
  )
$$, 'editing can create import history');
select lives_ok($$
  insert into public.competitor_accounts (
    id, name, platform, category, follower_count, avg_views
  ) values (
    '62000000-0000-0000-0000-000000000001', '研究对标账号', '微信视频号', '出海跨境', 10000, 2000
  )
$$, 'editing can create competitor accounts');
select lives_ok($$
  insert into public.competitor_videos (
    competitor_id, title, views, likes
  ) values ('62000000-0000-0000-0000-000000000001', '对标爆款', 100000, 5000)
$$, 'editing can create competitor videos');
select lives_ok($$
  insert into public.trending_topics (
    topic, heat_level, discovered_at
  ) values ('TikTok 新趋势', '高', now())
$$, 'editing can create trending topics');
select lives_ok($$
  insert into public.competitor_style_analysis (
    competitor_id, content_style, analyzed_at
  ) values ('62000000-0000-0000-0000-000000000001', '专业口播', now())
$$, 'editing can create style analyses');

select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.competitor_accounts), 1::bigint, 'business can read competitor accounts');
select is((select count(*) from public.video_ideas), 0::bigint, 'business cannot read video ideas');
select lives_ok($$
  update public.competitor_accounts set notes = '商务补充'
  where id = '62000000-0000-0000-0000-000000000001'
$$, 'business can update competitor accounts');

select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.competitor_accounts), 0::bigint, 'market cannot read competitor research');

select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_ok($$
  update public.import_history set file_name = 'rewritten.csv'
  where id = '61000000-0000-0000-0000-000000000001'
$$, '42501', 'import history is immutable', 'import history payload cannot be rewritten');
select lives_ok($$
  select public.invalidate_import_history('61000000-0000-0000-0000-000000000001')
$$, 'editing can invalidate import history');

select * from finish();
rollback;
