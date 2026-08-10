-- Supabase 市场/商务共享主数据；权限：owner/boss 管理，editing 管达人，business 管客户及达人商务字段，market 只读客户。
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  nickname text not null check (char_length(nickname) between 1 and 120),
  tiktok_url text not null check (char_length(tiktok_url) between 1 and 2000),
  followers bigint not null default 0 check (followers >= 0),
  region text not null check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  cooperation_status text not null default 'pending'
    check (cooperation_status in ('pending','contacting','signed','terminated')),
  commission_rate numeric(5,2) check (commission_rate between 0 and 100),
  owner_name text not null check (char_length(owner_name) between 1 and 80),
  is_biz_available boolean not null default false,
  cooperation_price bigint check (cooperation_price >= 0),
  cooperation_notes text check (char_length(cooperation_notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 180),
  contact_name text check (char_length(contact_name) <= 80),
  contact_phone text check (char_length(contact_phone) <= 40),
  contact_wechat text check (char_length(contact_wechat) <= 80),
  company text check (char_length(company) <= 180),
  industry text not null check (industry in (
    'tiktok_service','brand','mcn','supply_chain','ad_agency','other',
    'ai_tool','creator_tool','erp','payment','finance_tax'
  )),
  source text not null check (source in ('social','referral','event','outbound','other')),
  level text not null check (level in ('S','A','B','C')),
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index creators_nickname_idx on public.creators (nickname);
create index creators_region_status_idx on public.creators (region, cooperation_status)
where deleted_at is null;
create index clients_name_idx on public.clients (name);
create index clients_industry_level_idx on public.clients (industry, level)
where deleted_at is null;

create trigger creators_set_updated_at
before update on public.creators
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create or replace function public.enforce_creator_business_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() = 'business' and (
    new.id is distinct from old.id
    or new.legacy_id is distinct from old.legacy_id
    or new.nickname is distinct from old.nickname
    or new.tiktok_url is distinct from old.tiktok_url
    or new.followers is distinct from old.followers
    or new.region is distinct from old.region
    or new.cooperation_status is distinct from old.cooperation_status
    or new.commission_rate is distinct from old.commission_rate
    or new.owner_name is distinct from old.owner_name
    or new.created_at is distinct from old.created_at
    or new.deleted_at is distinct from old.deleted_at
  ) then
    raise exception using
      errcode = '42501',
      message = 'business may only update creator business fields';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_creator_business_update() from public;
grant execute on function public.enforce_creator_business_update() to authenticated;

create trigger creators_enforce_business_update
before update on public.creators
for each row execute function public.enforce_creator_business_update();

alter table public.creators enable row level security;
alter table public.clients enable row level security;

grant select, insert, update, delete on public.creators to authenticated;
grant select, insert, update, delete on public.clients to authenticated;

create policy "creator collaborators can read creators" on public.creators
for select to authenticated
using (
  public.has_any_role(array['owner','boss','business','editing'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "creator owners and editors can create creators" on public.creators
for insert to authenticated
with check (public.has_any_role(array['owner','boss','editing']) and deleted_at is null);

create policy "creator owners and editors can update creators" on public.creators
for update to authenticated
using (public.has_any_role(array['owner','boss','editing']))
with check (public.has_any_role(array['owner','boss','editing']));

create policy "business can update creator business fields" on public.creators
for update to authenticated
using (deleted_at is null and public.has_any_role(array['business']))
with check (deleted_at is null and public.has_any_role(array['business']));

create policy "owners can hard delete creators" on public.creators
for delete to authenticated
using (public.has_any_role(array['owner']));

create policy "client collaborators can read clients" on public.clients
for select to authenticated
using (
  public.has_any_role(array['owner','boss','business','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "owners and business can create clients" on public.clients
for insert to authenticated
with check (public.has_any_role(array['owner','boss','business']) and deleted_at is null);

create policy "owners and business can update clients" on public.clients
for update to authenticated
using (public.has_any_role(array['owner','boss','business']))
with check (public.has_any_role(array['owner','boss','business']));

create policy "owners can hard delete clients" on public.clients
for delete to authenticated
using (public.has_any_role(array['owner']));
