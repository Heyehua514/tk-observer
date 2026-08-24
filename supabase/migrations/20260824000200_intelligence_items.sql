-- 每日情报中心第一期：公开/授权来源的可追溯人工情报池。
-- 不抓取外部页面，不触发 AI 或业务任务自动写入。
create table public.intelligence_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  summary text not null default '' check (char_length(summary) <= 5000),
  source_name text not null check (char_length(source_name) between 1 and 255),
  source_type text not null
    constraint intelligence_items_source_type_check
    check (source_type in ('official','rss','authorized','public','manual','csv')),
  source_url text not null check (
    char_length(source_url) between 1 and 2000
    and source_url ~* '^https?://'
  ),
  captured_at timestamptz not null default now(),
  region text not null default '' check (char_length(region) <= 120),
  language text not null default 'zh-CN' check (char_length(language) between 2 and 20),
  topic text not null default '' check (char_length(topic) <= 255),
  heat_score integer not null default 0 check (heat_score between 0 and 100),
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 255),
  workspaces text[] not null default '{}'::text[],
  status text not null default 'unread'
    constraint intelligence_items_status_check
    check (status in ('unread','read','saved','ignored','tasked')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index intelligence_items_active_dedupe_key_idx
  on public.intelligence_items (dedupe_key)
  where deleted_at is null;
create index intelligence_items_active_captured_idx
  on public.intelligence_items (captured_at desc)
  where deleted_at is null;
create index intelligence_items_active_status_idx
  on public.intelligence_items (status, captured_at desc)
  where deleted_at is null;

create trigger intelligence_items_set_updated_at
before update on public.intelligence_items
for each row execute function public.set_updated_at();

alter table public.intelligence_items enable row level security;
grant select, insert, update on public.intelligence_items to authenticated;

create policy "members can read active intelligence"
on public.intelligence_items for select to authenticated
using (
  public.current_user_status() = 'active'
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "members can create own intelligence"
on public.intelligence_items for insert to authenticated
with check (
  public.current_user_status() = 'active'
  and created_by = auth.uid()
  and deleted_at is null
);

create policy "members can update own intelligence"
on public.intelligence_items for update to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());
