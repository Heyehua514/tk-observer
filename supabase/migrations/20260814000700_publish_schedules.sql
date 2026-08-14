-- 剪辑工作台：视频发布排期表（PRD 297 行「发布排期和平台发布闭环」）。
-- 用途：谢洁按视频号账号 + 目标站点安排发布时间，状态机 scheduled→publishing→published/failed/cancelled；
--       与 videos / video_tasks 关联展示成片，前端按北京时间和站点当地时间双重标注。
-- 权限：editing 制作读写；boss/owner 监督读写；business 无需访问（排期属内部制作数据）。

create table public.publish_schedules (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  video_id uuid references public.videos(id) on delete set null,
  video_task_id uuid references public.video_tasks(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  account text not null check (account in ('跨境TK磊哥','TK观察磊哥','磊哥出海笔记')),
  region text not null default 'CN',
  platform text not null default '微信视频号' check (platform in ('微信视频号','TikTok','抖音','YouTube')),
  publish_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled','publishing','published','failed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index publish_schedules_account_date_idx
  on public.publish_schedules (account, publish_at desc)
  where deleted_at is null;
create index publish_schedules_status_idx
  on public.publish_schedules (status)
  where deleted_at is null;

create trigger publish_schedules_set_updated_at
  before update on public.publish_schedules
  for each row execute function public.set_updated_at();

alter table public.publish_schedules enable row level security;

create policy "editing collaborators can read publish schedules" on public.publish_schedules
for select to authenticated using (
  public.has_any_role(array['owner','boss','editing'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "editing collaborators can create publish schedules" on public.publish_schedules
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','editing']) and deleted_at is null
);
create policy "editing collaborators can update publish schedules" on public.publish_schedules
for update to authenticated
using (public.has_any_role(array['owner','boss','editing']))
with check (public.has_any_role(array['owner','boss','editing']));
create policy "owners can hard delete publish schedules" on public.publish_schedules
for delete to authenticated using (public.has_any_role(array['owner']));
