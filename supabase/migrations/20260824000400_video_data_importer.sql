-- 视频数据导入员能力：与业务角色解耦，只开放视频指标导入/更新。
create table public.video_data_importers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id) on delete set null
);

alter table public.video_data_importers enable row level security;
grant select on public.video_data_importers to authenticated;

create or replace function public.can_manage_video_data()
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.has_any_role(array['owner','boss','editing'])
    or exists (
      select 1 from public.video_data_importers i
      where i.profile_id = auth.uid()
    )
$$;
revoke all on function public.can_manage_video_data() from public;
grant execute on function public.can_manage_video_data() to authenticated;

create policy "video data importers can read capability" on public.video_data_importers
for select to authenticated using (profile_id = auth.uid() or public.has_any_role(array['owner']));
create policy "owners can manage video data importers" on public.video_data_importers
for all to authenticated using (public.has_any_role(array['owner'])) with check (public.has_any_role(array['owner']));

-- 兼容已存在的成员：若远程 profile 已创建，则杨振康获得导入能力。
insert into public.video_data_importers (profile_id)
select id from public.profiles where name = '杨振康'
on conflict (profile_id) do nothing;

drop policy if exists "editing collaborators can read video ideas" on public.video_ideas;
create policy "video data importers can read video ideas" on public.video_ideas for select to authenticated
using (public.can_manage_video_data() and (deleted_at is null or public.has_any_role(array['owner'])));
drop policy if exists "editing collaborators can create video ideas" on public.video_ideas;
create policy "video data importers can create video ideas" on public.video_ideas for insert to authenticated
with check (public.can_manage_video_data() and deleted_at is null);
drop policy if exists "editing collaborators can update video ideas" on public.video_ideas;
create policy "video data importers can update video ideas" on public.video_ideas for update to authenticated
using (public.can_manage_video_data()) with check (public.can_manage_video_data());

drop policy if exists "editing collaborators can read import history" on public.import_history;
create policy "video data importers can read import history" on public.import_history for select to authenticated
using (public.can_manage_video_data() and (deleted_at is null or public.has_any_role(array['owner'])));
drop policy if exists "editing collaborators can create import history" on public.import_history;
create policy "video data importers can create import history" on public.import_history for insert to authenticated
with check (public.can_manage_video_data() and deleted_at is null);
drop policy if exists "editing collaborators can invalidate import history" on public.import_history;
create policy "video data importers can invalidate import history" on public.import_history for update to authenticated
using (public.can_manage_video_data()) with check (public.can_manage_video_data());

drop policy if exists "editing collaborators can read video accounts" on public.video_accounts;
create policy "video data importers can read video accounts" on public.video_accounts for select to authenticated
using (public.can_manage_video_data() and deleted_at is null);
drop policy if exists "editing collaborators can manage video accounts" on public.video_accounts;
create policy "video data importers can manage video accounts" on public.video_accounts for all to authenticated
using (public.can_manage_video_data()) with check (public.can_manage_video_data());
drop policy if exists "editing collaborators can manage video snapshots" on public.video_account_snapshots;
create policy "video data importers can manage video snapshots" on public.video_account_snapshots for all to authenticated
using (public.can_manage_video_data()) with check (public.can_manage_video_data());
drop policy if exists "editing collaborators can manage video sync runs" on public.video_sync_runs;
create policy "video data importers can manage video sync runs" on public.video_sync_runs for all to authenticated
using (public.can_manage_video_data()) with check (public.can_manage_video_data());
