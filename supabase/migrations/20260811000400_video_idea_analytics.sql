-- Supabase 剪辑选题分析视图；权限：security-invoker 继承 video_ideas RLS，仅 owner/boss/editing 获得数据。
create view public.video_idea_summary with (security_invoker = true) as
select
  count(*)::bigint as total_videos,
  count(*) filter (
    where date_trunc('month', created_at) = date_trunc('month', now())
  )::bigint as monthly_new,
  count(*) filter (where is_viral)::bigint as viral_count,
  coalesce(100.0 * count(*) filter (where is_viral) / nullif(count(*), 0), 0)::numeric as viral_rate,
  coalesce(avg(completion_rate), 0)::numeric as average_completion_rate,
  coalesce(avg(views), 0)::numeric as average_views,
  coalesce(sum(follower_gain), 0)::bigint as total_follower_gain
from public.video_ideas
where deleted_at is null
  and public.has_any_role(array['owner','boss','editing']);

create view public.video_idea_account_stats with (security_invoker = true) as
with accounts(account) as (
  values ('跨境TK磊哥'::text), ('TK观察磊哥'::text), ('磊哥出海笔记'::text)
)
select
  accounts.account,
  coalesce(sum(ideas.views), 0)::bigint as views,
  coalesce(avg(ideas.completion_rate), 0)::numeric as average_completion_rate,
  count(ideas.id) filter (where ideas.is_viral)::bigint as viral_count
from accounts
left join public.video_ideas ideas
  on ideas.account = accounts.account
  and ideas.deleted_at is null
  and public.has_any_role(array['owner','boss','editing'])
group by accounts.account;

create view public.video_idea_type_stats with (security_invoker = true) as
with types(video_type) as (
  values
    ('口播'::text), ('专访预热'::text), ('专访正片'::text), ('专访花絮'::text),
    ('快问快答'::text), ('茶话会'::text), ('饭局交流'::text), ('饭局感受'::text)
)
select
  types.video_type,
  coalesce(avg(ideas.completion_rate), 0)::numeric as average_completion_rate
from types
left join public.video_ideas ideas
  on ideas.video_type = types.video_type
  and ideas.deleted_at is null
  and public.has_any_role(array['owner','boss','editing'])
group by types.video_type;

create view public.video_idea_viral_features with (security_invoker = true) as
with viral as (
  select id, title, coalesce(tags, '') as tags, video_type,
    case
      when extract(day from publish_date) <= 7 then '月初 1-7 日'
      when extract(day from publish_date) <= 14 then '月中 8-14 日'
      when extract(day from publish_date) <= 21 then '下旬 15-21 日'
      else '月底 22-31 日'
    end as date_segment
  from public.video_ideas
  where is_viral and deleted_at is null
    and public.has_any_role(array['owner','boss','editing'])
),
title_tokens as (
  select viral.id, trim(token) as token
  from viral
  cross join lateral regexp_split_to_table(
    regexp_replace(viral.title, '[，。！？、/|]+', ',', 'g'),
    '[,[:space:]]+'
  ) token
),
tag_tokens as (
  select viral.id, trim(token) as token
  from viral
  cross join lateral regexp_split_to_table(
    regexp_replace(viral.tags, '，', ',', 'g'), ','
  ) token
),
raw_features as (
  select 'title_word'::text as feature_type, token as value, count(*)::bigint as count
  from title_tokens
  where char_length(token) > 1
    and token not in ('我们','这个','那个','视频','一个','怎么','为什么','以及','可以')
  group by token
  union all
  select 'video_type', video_type, count(*)::bigint from viral group by video_type
  union all
  select 'tag', token, count(*)::bigint from tag_tokens where token <> '' group by token
  union all
  select 'date_segment', date_segment, count(*)::bigint from viral group by date_segment
),
ranked as (
  select feature_type, value, count,
    row_number() over (partition by feature_type order by count desc, value asc)::bigint as feature_rank
  from raw_features
)
select feature_type, value, count, feature_rank
from ranked
where feature_rank <= 5;

grant select on public.video_idea_summary to authenticated;
grant select on public.video_idea_account_stats to authenticated;
grant select on public.video_idea_type_stats to authenticated;
grant select on public.video_idea_viral_features to authenticated;
