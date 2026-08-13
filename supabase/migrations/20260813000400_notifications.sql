-- Supabase 全局通知：当前用户只读/更新自己的通知，owner 可创建系统通知。
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('design_review','gmv_target','comment','deadline')),
  title text not null check (char_length(title) between 1 and 160),
  content text not null check (char_length(content) between 1 and 1000),
  link text check (char_length(link) <= 500),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index notifications_recipient_read_created_idx
on public.notifications (recipient_id, is_read, created_at desc)
where deleted_at is null;

create trigger notifications_set_updated_at before update on public.notifications
for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;

grant select, insert, update, delete on public.notifications to authenticated;

create policy "members can read own notifications" on public.notifications
for select to authenticated using (
  recipient_id = auth.uid()
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "members can mark own notifications read" on public.notifications
for update to authenticated
using (recipient_id = auth.uid())
with check (
  recipient_id = auth.uid()
  and title is not null
  and content is not null
);

create policy "owner can manage notifications" on public.notifications
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

alter table public.notifications replica identity full;

alter publication supabase_realtime add table public.notifications;
