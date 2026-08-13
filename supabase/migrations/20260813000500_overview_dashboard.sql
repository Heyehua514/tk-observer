-- Supabase 总览首页基础指标：GMV 趋势和成员任务进度。
create table public.gmv_metrics (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  metric_date timestamptz not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'CNY' check (currency in ('USD','CNY')),
  region text not null default 'US' check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  assignee_name text not null check (char_length(assignee_name) between 1 and 40),
  title text not null check (char_length(title) between 1 and 180),
  progress integer not null default 0 check (progress between 0 and 100),
  due_at timestamptz,
  region text not null default 'US' check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index gmv_metrics_date_idx on public.gmv_metrics (metric_date)
where deleted_at is null;
create index team_tasks_assignee_idx on public.team_tasks (assignee_name, due_at)
where deleted_at is null;

create trigger gmv_metrics_set_updated_at before update on public.gmv_metrics
for each row execute function public.set_updated_at();
create trigger team_tasks_set_updated_at before update on public.team_tasks
for each row execute function public.set_updated_at();

alter table public.gmv_metrics enable row level security;
alter table public.team_tasks enable row level security;

grant select, insert, update, delete on public.gmv_metrics to authenticated;
grant select, insert, update, delete on public.team_tasks to authenticated;

create policy "boss can read gmv metrics" on public.gmv_metrics
for select to authenticated using (
  public.has_any_role(array['owner','boss'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "boss can manage gmv metrics" on public.gmv_metrics
for all to authenticated
using (public.has_any_role(array['owner','boss']))
with check (public.has_any_role(array['owner','boss']));

create policy "boss can read team tasks" on public.team_tasks
for select to authenticated using (
  public.has_any_role(array['owner','boss'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "boss can manage team tasks" on public.team_tasks
for all to authenticated
using (public.has_any_role(array['owner','boss']))
with check (public.has_any_role(array['owner','boss']));

alter table public.gmv_metrics replica identity full;
alter table public.team_tasks replica identity full;

alter publication supabase_realtime add table
  public.gmv_metrics,
  public.team_tasks;
