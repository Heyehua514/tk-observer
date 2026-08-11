begin;
select plan(15);

select has_view('public', 'video_idea_summary', 'summary view exists');
select has_view('public', 'video_idea_account_stats', 'account stats view exists');
select has_view('public', 'video_idea_type_stats', 'type stats view exists');
select has_view('public', 'video_idea_viral_features', 'viral features view exists');
select columns_are('public', 'video_idea_summary', array[
  'total_videos','monthly_new','viral_count','viral_rate',
  'average_completion_rate','average_views','total_follower_gain'
]);
select columns_are('public', 'video_idea_account_stats', array[
  'account','views','average_completion_rate','viral_count'
]);
select columns_are('public', 'video_idea_type_stats', array[
  'video_type','average_completion_rate'
]);
select columns_are('public', 'video_idea_viral_features', array[
  'feature_type','value','count','feature_rank'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'analytics-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'analytics-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now());
update public.profiles set status = 'active', role = case id
  when '80000000-0000-0000-0000-000000000001' then 'business'
  when '80000000-0000-0000-0000-000000000002' then 'editing'
end where id::text like '80000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.video_ideas (
  account, video_type, title, tags, publish_date, views, completion_rate, follower_gain
) values
  ('跨境TK磊哥', '口播', 'TikTok 增长 方法', '增长,运营', '2026-08-01 00:00:00+00', 1000, 70, 100),
  ('跨境TK磊哥', '口播', '普通 运营 记录', '日常,运营', '2026-08-02 00:00:00+00', 100, 30, 5),
  ('TK观察磊哥', '专访正片', '品牌 出海 增长', '品牌,增长', '2026-08-03 00:00:00+00', 2000, 65, 200);

reset role;
insert into public.video_ideas (
  account, video_type, title, publish_date, views, completion_rate, deleted_at
) values (
  '磊哥出海笔记', '茶话会', '已删除样本', '2026-08-04 00:00:00+00', 99999, 99, now()
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is((select total_videos from public.video_idea_summary), 3::bigint, 'summary excludes soft-deleted videos');
select is((select viral_count from public.video_idea_summary), 2::bigint, 'summary counts derived viral videos');
select is((select count(*) from public.video_idea_account_stats), 3::bigint, 'account view always returns three accounts');
select is((select count(*) from public.video_idea_type_stats), 8::bigint, 'type view always returns eight video types');
select isnt_empty($$ select 1 from public.video_idea_viral_features $$, 'viral features are generated');
select is(
  (select max(feature_rank) <= 5 from public.video_idea_viral_features),
  true,
  'viral features retain only the top five per category'
);

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select total_videos from public.video_idea_summary), 0::bigint, 'business receives no editing analytics');

select * from finish();
rollback;
