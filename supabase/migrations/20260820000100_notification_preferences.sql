-- 通知偏好：按用户控制到期、审核和商务跟进提醒；所属：全局通知中心；权限：本人读写。
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  deadline_enabled boolean not null default true,
  review_enabled boolean not null default true,
  follow_up_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
grant select, insert, update on public.notification_preferences to authenticated;

create policy "members can read own notification preferences"
on public.notification_preferences for select to authenticated
using (user_id = auth.uid());

create policy "members can insert own notification preferences"
on public.notification_preferences for insert to authenticated
with check (user_id = auth.uid());

create policy "members can update own notification preferences"
on public.notification_preferences for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
