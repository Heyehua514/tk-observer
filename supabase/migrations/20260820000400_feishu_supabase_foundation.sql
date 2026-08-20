-- 飞书 Supabase 基础：所属系统设置；权限：token 仅 Edge Function/service_role 写入，成员只能读取本人脱敏连接状态与同步文档。
create table public.feishu_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  open_id text not null check (char_length(open_id) between 1 and 255),
  access_token_encrypted text not null check (char_length(access_token_encrypted) > 0),
  refresh_token_encrypted text not null check (char_length(refresh_token_encrypted) > 0),
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  sync_enabled boolean not null default true,
  consecutive_failures integer not null default 0 check (consecutive_failures between 0 and 5),
  updated_at timestamptz not null default now()
);

create table public.feishu_documents (
  id uuid primary key default gen_random_uuid(),
  owner_user uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('doc', 'wiki', 'bitable')),
  source_url text not null check (char_length(source_url) between 1 and 2000),
  source_title text not null default '' check (char_length(source_title) <= 500),
  raw_content text not null default '' check (char_length(raw_content) <= 50000),
  author_name text not null default '' check (char_length(author_name) <= 255),
  feishu_updated_at timestamptz,
  access_scope text not null default 'internal' check (access_scope in ('public', 'internal', 'restricted')),
  sync_status text not null default 'pending' check (sync_status in ('pending', 'processed', 'failed')),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user, source_url)
);

create table public.feishu_sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('doc', 'wiki', 'bitable')),
  last_cursor text not null default '' check (char_length(last_cursor) <= 2000),
  last_synced_at timestamptz,
  consecutive_failures integer not null default 0 check (consecutive_failures between 0 and 5),
  updated_at timestamptz not null default now(),
  unique (user_id, source_type)
);

create index feishu_documents_owner_updated_idx
on public.feishu_documents (owner_user, feishu_updated_at desc);

create trigger feishu_connections_set_updated_at
before update on public.feishu_connections
for each row execute function public.set_updated_at();

create trigger feishu_documents_set_updated_at
before update on public.feishu_documents
for each row execute function public.set_updated_at();

create trigger feishu_sync_state_set_updated_at
before update on public.feishu_sync_state
for each row execute function public.set_updated_at();

alter table public.feishu_connections enable row level security;
alter table public.feishu_documents enable row level security;
alter table public.feishu_sync_state enable row level security;

revoke all on public.feishu_connections, public.feishu_documents, public.feishu_sync_state from anon, authenticated;
grant all on public.feishu_connections, public.feishu_documents, public.feishu_sync_state to service_role;

create policy "members can read own feishu documents" on public.feishu_documents
for select to authenticated using (owner_user = auth.uid());

create policy "members can read own feishu sync state" on public.feishu_sync_state
for select to authenticated using (user_id = auth.uid());

create or replace function public.get_my_feishu_connection()
returns table (
  connected boolean,
  open_id text,
  connected_at timestamptz,
  last_synced_at timestamptz,
  sync_enabled boolean,
  consecutive_failures integer
)
language sql stable security definer set search_path = ''
as $$
  select
    c.user_id is not null,
    c.open_id,
    c.connected_at,
    c.last_synced_at,
    coalesce(c.sync_enabled, true),
    coalesce(c.consecutive_failures, 0)
  from (select auth.uid() as user_id) current_identity
  left join public.feishu_connections c on c.user_id = current_identity.user_id
$$;

revoke all on function public.get_my_feishu_connection() from public;
grant execute on function public.get_my_feishu_connection() to authenticated;
