-- Supabase 总览团队记忆：日报、周报、失败案例和自动化审计。
create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  date timestamptz not null,
  stats_json text not null check (char_length(stats_json) between 1 and 50000),
  highlights text not null check (char_length(highlights) between 1 and 5000),
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  week_start timestamptz not null,
  comparison_json text not null check (char_length(comparison_json) between 1 and 50000),
  trends text not null check (char_length(trends) between 1 and 5000),
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.failed_cases (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  source_type text not null check (source_type in ('opportunity','event_task')),
  source_id text not null check (char_length(source_id) between 1 and 80),
  reason text not null check (char_length(reason) between 1 and 2000),
  lessons text check (char_length(lessons) <= 5000),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint failed_cases_source_unique unique (source_type, source_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  actor_name text not null check (char_length(actor_name) between 1 and 80),
  action text not null check (char_length(action) between 1 and 240),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text check (char_length(entity_id) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index daily_reports_date_idx on public.daily_reports (date)
where deleted_at is null;
create unique index weekly_reports_start_idx on public.weekly_reports (week_start)
where deleted_at is null;
create index failed_cases_recorded_idx on public.failed_cases (recorded_at desc)
where deleted_at is null;
create index audit_logs_entity_created_idx on public.audit_logs (entity_type, created_at desc)
where deleted_at is null;

create trigger daily_reports_set_updated_at before update on public.daily_reports
for each row execute function public.set_updated_at();
create trigger weekly_reports_set_updated_at before update on public.weekly_reports
for each row execute function public.set_updated_at();
create trigger failed_cases_set_updated_at before update on public.failed_cases
for each row execute function public.set_updated_at();
create trigger audit_logs_set_updated_at before update on public.audit_logs
for each row execute function public.set_updated_at();

alter table public.daily_reports enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.failed_cases enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert, update, delete on public.daily_reports to authenticated;
grant select, insert, update, delete on public.weekly_reports to authenticated;
grant select, insert, update, delete on public.failed_cases to authenticated;
grant select, insert, update, delete on public.audit_logs to authenticated;

create policy "boss can read daily reports" on public.daily_reports
for select to authenticated using (
  public.has_any_role(array['owner','boss'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owner can manage daily reports" on public.daily_reports
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create policy "boss can read weekly reports" on public.weekly_reports
for select to authenticated using (
  public.has_any_role(array['owner','boss'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owner can manage weekly reports" on public.weekly_reports
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create policy "boss can read failed cases" on public.failed_cases
for select to authenticated using (
  public.has_any_role(array['owner','boss'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owner can manage failed cases" on public.failed_cases
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create policy "boss can read audit logs" on public.audit_logs
for select to authenticated using (
  public.has_any_role(array['owner','boss'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owner can manage audit logs" on public.audit_logs
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

alter table public.daily_reports replica identity full;
alter table public.weekly_reports replica identity full;
alter table public.failed_cases replica identity full;
alter table public.audit_logs replica identity full;

alter publication supabase_realtime add table
  public.daily_reports,
  public.weekly_reports,
  public.failed_cases,
  public.audit_logs;
