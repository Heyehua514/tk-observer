-- Migration: Video metrics feedback & performance tracking for production videos
-- Date: 2026-10-10
-- Purpose: 建立成片发布后的播放、完播、点赞与带货转化真实数据回流体系，闭环视频矩阵从生产到表现复盘全链路。

-- 1. 扩展成片表 public.videos 的数据表现与关联字段
alter table public.videos add column if not exists views integer not null default 0 check (views >= 0);
alter table public.videos add column if not exists likes integer not null default 0 check (likes >= 0);
alter table public.videos add column if not exists comments integer not null default 0 check (comments >= 0);
alter table public.videos add column if not exists shares integer not null default 0 check (shares >= 0);
alter table public.videos add column if not exists completion_rate numeric(5, 2) not null default 0 check (completion_rate >= 0 and completion_rate <= 100);
alter table public.videos add column if not exists conversion_gmv_cents bigint not null default 0 check (conversion_gmv_cents >= 0);
alter table public.videos add column if not exists order_count integer not null default 0 check (order_count >= 0);
alter table public.videos add column if not exists external_url text;

comment on column public.videos.views is '视频实际播放量/播放数';
comment on column public.videos.likes is '视频点赞数';
comment on column public.videos.comments is '视频评论数';
comment on column public.videos.shares is '视频分享/转发数';
comment on column public.videos.completion_rate is '视频完播率百分比 (0.00 ~ 100.00)';
comment on column public.videos.conversion_gmv_cents is '该视频引导成交金额 (以分/cents为单位)';
comment on column public.videos.order_count is '该视频引导出单量';
comment on column public.videos.external_url is '平台发布后在线地址或外链';

-- 2. 新建成片效果回流打卡与历史快照表 public.video_metrics_logs
create table if not exists public.video_metrics_logs (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  shares integer not null default 0 check (shares >= 0),
  completion_rate numeric(5, 2) not null default 0 check (completion_rate >= 0 and completion_rate <= 100),
  conversion_gmv_cents bigint not null default 0 check (conversion_gmv_cents >= 0),
  order_count integer not null default 0 check (order_count >= 0),
  logged_at timestamptz not null default now(),
  operator_name text not null default '谢洁' check (char_length(operator_name) between 1 and 80),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists video_metrics_logs_video_logged_idx
  on public.video_metrics_logs (video_id, logged_at desc)
  where deleted_at is null;

create trigger video_metrics_logs_set_updated_at
  before update on public.video_metrics_logs
  for each row execute function public.set_updated_at();

-- 3. 自动同步触发器：录入数据表现日志后，原子更新 public.videos 上的最新指标
create or replace function public.sync_video_on_metrics_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as \$\$
begin
  update public.videos
  set
    views = new.views,
    likes = new.likes,
    comments = new.comments,
    shares = new.shares,
    completion_rate = new.completion_rate,
    conversion_gmv_cents = new.conversion_gmv_cents,
    order_count = new.order_count,
    updated_at = now()
  where id = new.video_id;
  return new;
end;
\$\$;

create trigger video_metrics_logs_sync_video
  after insert on public.video_metrics_logs
  for each row execute function public.sync_video_on_metrics_log();

-- 4. 权限与行级安全 (RLS)
alter table public.video_metrics_logs enable row level security;
grant select, insert, update, delete on public.video_metrics_logs to authenticated;

create policy "video collaborators can read metrics logs" on public.video_metrics_logs
for select to authenticated
using (
  public.has_any_role(array['owner', 'boss', 'editing', 'business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "editing and owners can manage metrics logs" on public.video_metrics_logs
for all to authenticated
using (public.has_any_role(array['owner', 'boss', 'editing']))
with check (public.has_any_role(array['owner', 'boss', 'editing']));

comment on table public.video_metrics_logs is '视频成片数据表现回流打卡表：记录各阶段播放量、点赞、完播率与带货GMV变化';
