-- Migration: Recompute video metrics projection from the latest active metrics log
-- Date: 2026-11-05
-- Purpose: 修复 video_metrics_logs 仅处理 INSERT 导致的投影漂移；UPDATE、软删除与硬删除后
--          必须按最新有效日志重算 videos 指标，无有效日志时安全归零。

create index if not exists video_metrics_logs_latest_projection_idx
  on public.video_metrics_logs (video_id, logged_at desc, created_at desc, id desc)
  where deleted_at is null;

create or replace function public.refresh_video_metrics_projection(p_video_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest public.video_metrics_logs%rowtype;
begin
  select *
  into latest
  from public.video_metrics_logs
  where video_id = p_video_id
    and deleted_at is null
  order by logged_at desc, created_at desc, id desc
  limit 1;

  if found then
    update public.videos
    set
      views = latest.views,
      likes = latest.likes,
      comments = latest.comments,
      shares = latest.shares,
      completion_rate = latest.completion_rate,
      conversion_gmv_cents = latest.conversion_gmv_cents,
      order_count = latest.order_count
    where id = p_video_id;
  else
    update public.videos
    set
      views = 0,
      likes = 0,
      comments = 0,
      shares = 0,
      completion_rate = 0,
      conversion_gmv_cents = 0,
      order_count = 0
    where id = p_video_id;
  end if;
end;
$$;

create or replace function public.sync_video_on_metrics_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_video_metrics_projection(old.video_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.video_id is distinct from new.video_id then
    perform public.refresh_video_metrics_projection(old.video_id);
  end if;

  perform public.refresh_video_metrics_projection(new.video_id);
  return new;
end;
$$;

drop trigger if exists video_metrics_logs_sync_video on public.video_metrics_logs;
create trigger video_metrics_logs_sync_video
  after insert or update or delete on public.video_metrics_logs
  for each row execute function public.sync_video_on_metrics_log();

-- 修复历史上因更新/删除日志而留下的投影漂移；无任何日志的视频保持原值。
with latest as (
  select distinct on (video_id)
    video_id,
    views,
    likes,
    comments,
    shares,
    completion_rate,
    conversion_gmv_cents,
    order_count
  from public.video_metrics_logs
  where deleted_at is null
  order by video_id, logged_at desc, created_at desc, id desc
),
projected as (
  select
    v.id as video_id,
    coalesce(l.views, 0) as views,
    coalesce(l.likes, 0) as likes,
    coalesce(l.comments, 0) as comments,
    coalesce(l.shares, 0) as shares,
    coalesce(l.completion_rate, 0) as completion_rate,
    coalesce(l.conversion_gmv_cents, 0::bigint) as conversion_gmv_cents,
    coalesce(l.order_count, 0) as order_count
  from public.videos v
  left join latest l on l.video_id = v.id
  where exists (
    select 1
    from public.video_metrics_logs m
    where m.video_id = v.id
  )
)
update public.videos v
set
  views = p.views,
  likes = p.likes,
  comments = p.comments,
  shares = p.shares,
  completion_rate = p.completion_rate,
  conversion_gmv_cents = p.conversion_gmv_cents,
  order_count = p.order_count
from projected p
where v.id = p.video_id
  and (
    v.views,
    v.likes,
    v.comments,
    v.shares,
    v.completion_rate,
    v.conversion_gmv_cents,
    v.order_count
  ) is distinct from (
    p.views,
    p.likes,
    p.comments,
    p.shares,
    p.completion_rate,
    p.conversion_gmv_cents,
    p.order_count
  );

-- 投影刷新函数只允许触发器内部调用，避免通过 PostgREST 暴露为公开 RPC。
revoke all on function public.refresh_video_metrics_projection(uuid) from public;
revoke all on function public.refresh_video_metrics_projection(uuid) from anon;
revoke all on function public.refresh_video_metrics_projection(uuid) from authenticated;

comment on function public.refresh_video_metrics_projection(uuid)
  is '按指定视频的最新有效数据日志重算 videos 指标投影；无有效日志时归零';
comment on function public.sync_video_on_metrics_log()
  is '在 video_metrics_logs 新增、修改、软删除或硬删除后原子刷新视频指标投影';