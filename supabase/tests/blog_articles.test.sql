begin;
select plan(11);

select has_table('public', 'blog_articles', 'blog articles table exists');
select has_check('public', 'blog_articles', 'blog articles have value constraints');
select trigger_is(
  'public', 'blog_articles', 'blog_articles_set_updated_at',
  'public', 'set_updated_at'
);
select trigger_is(
  'public', 'blog_articles', 'blog_articles_sync_viral_flags',
  'public', 'sync_blog_article_viral_flags'
);
select policies_are('public', 'blog_articles', array[
  'blog collaborators can read articles',
  'business can create blog articles',
  'business can update blog articles',
  'owners can hard delete blog articles'
]);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'blog-business@example.test', '', now(), '{}', '{"name":"Business"}', now(), now()),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'blog-boss@example.test', '', now(), '{}', '{"name":"Boss"}', now(), now()),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'blog-market@example.test', '', now(), '{}', '{"name":"Market"}', now(), now());

update public.profiles
set status = 'active',
    role = case id
      when 'd0000000-0000-0000-0000-000000000001' then 'business'
      when 'd0000000-0000-0000-0000-000000000002' then 'boss'
      when 'd0000000-0000-0000-0000-000000000003' then 'market'
    end
where id::text like 'd0000000-0000-0000-0000-00000000000%';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok($$
  insert into public.blog_articles (
    title, account, publish_date, views, likes, shares, analysis_notes, source_url
  ) values
    ('普通复盘', 'TK观察', '2026-08-11 00:00:00+00', 1000, 10, 2, '基准文章', 'https://example.test/normal'),
    ('增长拆解', 'TK观察', '2026-08-12 00:00:00+00', 1200, 12, 3, '基准文章', 'https://example.test/growth'),
    ('爆款底层逻辑', 'TK观察', '2026-08-13 00:00:00+00', 5000, 90, 30, '高于均值两倍', 'https://example.test/viral')
$$, 'business can create blog articles');

select is(
  (select count(*) from public.blog_articles where is_viral),
  1::bigint,
  'viral flag is recomputed from account average'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.blog_articles), 3::bigint, 'boss can read blog articles');
select throws_ok($$
  insert into public.blog_articles (
    title, account, publish_date
  ) values (
    '老板越权录入', 'TK观察', '2026-08-14 00:00:00+00'
  )
$$, '42501', null, 'boss cannot create blog articles');

select set_config(
  'request.jwt.claims',
  '{"sub":"d0000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.blog_articles), 0::bigint, 'market cannot read blog articles');
update public.blog_articles set analysis_notes = '市场越权';
select set_config(
  'request.jwt.claims',
  '{"sub":"d0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is((select count(*) from public.blog_articles where analysis_notes = '市场越权'), 0::bigint, 'market cannot update blog articles');

select * from finish();
rollback;
