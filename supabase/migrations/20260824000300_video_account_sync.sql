-- 微信视频号多账号同步基础：一个微信登录可管理多个 video_accounts。
-- 采集端只提交批次，不在数据库保存微信密码或设备凭据。
create table if not exists public.video_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 160),
  platform text not null default '微信视频号' check (platform = '微信视频号'),
  external_account_id text,
  wechat_owner_label text,
  status text not null default 'active' check (status in ('active','paused','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists public.video_account_snapshots (
  id uuid primary key default gen_random_uuid(),
  video_account_id uuid not null references public.video_accounts(id) on delete cascade,
  snapshot_date date not null,
  follower_count bigint not null check (follower_count >= 0),
  captured_at timestamptz not null default now(),
  unique (video_account_id, snapshot_date)
);
create table if not exists public.video_sync_runs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  source text not null default 'wechat_channels_android',
  status text not null default 'running' check (status in ('running','completed','partial','failed')),
  started_at timestamptz not null default now(), finished_at timestamptz,
  total_rows integer not null default 0 check (total_rows >= 0),
  inserted_rows integer not null default 0 check (inserted_rows >= 0),
  updated_rows integer not null default 0 check (updated_rows >= 0),
  error_message text, metadata jsonb not null default '{}'::jsonb
);
alter table public.video_ideas add column if not exists video_account_id uuid references public.video_accounts(id) on delete set null;
alter table public.video_ideas add column if not exists external_video_id text;
alter table public.video_ideas add column if not exists sync_source text;
alter table public.video_ideas add column if not exists last_synced_at timestamptz;
create unique index if not exists video_ideas_external_account_key
  on public.video_ideas (video_account_id, external_video_id)
  where deleted_at is null and external_video_id is not null;
create index if not exists video_account_snapshots_account_date_idx on public.video_account_snapshots (video_account_id, snapshot_date desc);
create index if not exists video_sync_runs_started_idx on public.video_sync_runs (started_at desc);
drop trigger if exists video_accounts_set_updated_at on public.video_accounts;
create trigger video_accounts_set_updated_at before update on public.video_accounts for each row execute function public.set_updated_at();
create or replace view public.video_account_daily_stats with (security_invoker = true) as
with ranked as (
  select s.video_account_id, a.name, s.snapshot_date, s.follower_count,
    lag(s.follower_count) over (partition by s.video_account_id order by s.snapshot_date) as previous_follower_count
  from public.video_account_snapshots s join public.video_accounts a on a.id = s.video_account_id
  where a.deleted_at is null
)
select video_account_id, name, snapshot_date, follower_count,
  coalesce(previous_follower_count, follower_count)::bigint as previous_follower_count,
  (follower_count - coalesce(previous_follower_count, follower_count))::bigint as follower_gain
from ranked;
alter table public.video_accounts enable row level security;
alter table public.video_account_snapshots enable row level security;
alter table public.video_sync_runs enable row level security;
grant select, insert, update on public.video_accounts to authenticated;
grant select, insert, update on public.video_account_snapshots, public.video_sync_runs to authenticated;
grant select on public.video_account_daily_stats to authenticated;
create policy "editing collaborators can read video accounts" on public.video_accounts for select to authenticated using (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);
create policy "editing collaborators can manage video accounts" on public.video_accounts for all to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "editing collaborators can manage video snapshots" on public.video_account_snapshots for all to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));
create policy "editing collaborators can manage video sync runs" on public.video_sync_runs for all to authenticated using (public.has_any_role(array['owner','boss','editing'])) with check (public.has_any_role(array['owner','boss','editing']));

drop view if exists public.video_idea_account_stats;
create view public.video_idea_account_stats with (security_invoker = true) as
with accounts(account) as (values ('跨境TK磊哥'::text), ('TK观察磊哥'::text), ('磊哥出海笔记'::text))
select accounts.account, coalesce(sum(ideas.views), 0)::bigint as views,
  coalesce(avg(ideas.completion_rate), 0)::numeric as average_completion_rate,
  coalesce(sum(ideas.likes), 0)::bigint as likes, coalesce(sum(ideas.comments), 0)::bigint as comments,
  coalesce(sum(ideas.follower_gain), 0)::bigint as follower_gain,
  count(ideas.id) filter (where ideas.is_viral)::bigint as viral_count
from accounts left join public.video_ideas ideas on ideas.account = accounts.account and ideas.deleted_at is null
  and public.has_any_role(array['owner','boss','editing']) group by accounts.account;
grant select on public.video_idea_account_stats to authenticated;
