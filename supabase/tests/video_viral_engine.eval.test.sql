begin;
select plan(12);

select has_function('public', 'recalculate_video_idea_viral', array['text']);
select has_function('public', 'handle_video_idea_viral_recalculation', array[]::text[]);
select trigger_is(
  'public', 'video_ideas', 'video_ideas_recalculate_viral',
  'public', 'handle_video_idea_viral_recalculation'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'viral-editing@example.test', '', now(), '{}', '{"name":"Editing"}', now(), now()
);
update public.profiles set status = 'active', role = 'editing'
where id = '70000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
insert into public.video_ideas (
  account, video_type, title, publish_date, views, completion_rate
) values
  ('跨境TK磊哥', '口播', '完播边界 60', '2026-08-01 00:00:00+00', 10, 60),
  ('跨境TK磊哥', '口播', '完播边界 59', '2026-08-02 00:00:00+00', 0, 59);
select is((select is_viral from public.video_ideas where title = '完播边界 60'), true, 'completion rate 60 is viral');
select is((select is_viral from public.video_ideas where title = '完播边界 59'), false, 'completion rate 59 without enough views is not viral');

insert into public.video_ideas (
  account, video_type, title, publish_date, views, completion_rate
) values
  ('TK观察磊哥', '专访正片', '高播放样本', '2026-08-03 00:00:00+00', 100, 20),
  ('TK观察磊哥', '专访正片', '零播放同伴', '2026-08-04 00:00:00+00', 0, 20);
select is((select is_viral from public.video_ideas where title = '高播放样本'), true, 'twice-account-average views is viral');

update public.video_ideas set views = 100 where title = '零播放同伴';
select is((select is_viral from public.video_ideas where title = '高播放样本'), false, 'peer metric changes recalculate the account');
update public.video_ideas set views = 0 where title = '零播放同伴';
select is((select is_viral from public.video_ideas where title = '高播放样本'), true, 'restoring the threshold recalculates viral state');

reset role;
update public.video_ideas set deleted_at = now() where title = '零播放同伴';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is((select is_viral from public.video_ideas where title = '高播放样本'), false, 'soft-deleting a peer recalculates remaining ideas');

select throws_ok($$
  update public.video_ideas set is_viral = true where title = '完播边界 59'
$$, '42501', 'permission denied for table video_ideas', 'authenticated users cannot forge viral state');
select throws_ok($$
  update public.video_ideas set ai_analysis = '伪造分析' where title = '完播边界 59'
$$, '42501', 'permission denied for table video_ideas', 'authenticated users cannot forge AI analysis');
select lives_ok($$
  update public.video_ideas set description = '正常业务更新' where title = '完播边界 59'
$$, 'editing can still update business input fields');

select * from finish();
rollback;
