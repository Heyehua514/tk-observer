-- Supabase 商务交易核心；权限：owner/boss/business 管理，其他角色无访问权。
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 180),
  type text not null check (type in ('channel_order','event_sponsorship','creator_cooperation','other')),
  amount bigint not null default 0 check (amount >= 0),
  stage text not null default 'contact'
    check (stage in ('contact','proposal','negotiation','contract','won','lost')),
  expected_close timestamptz,
  probability integer not null default 10 check (probability between 0 and 100),
  lost_reason text constraint opportunities_lost_reason_length_check
    check (char_length(lost_reason) <= 1000),
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint opportunities_lost_stage_reason_check check (
    stage <> 'lost' or nullif(btrim(lost_reason), '') is not null
  )
);

create table public.channel_orders (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 180),
  client_id uuid not null references public.clients(id) on delete restrict,
  creator_id uuid not null references public.creators(id) on delete restrict,
  platform text not null check (platform in ('tiktok','wechat_channels','douyin','youtube')),
  content_type text not null check (content_type in ('spoken_placement','unboxing','story_placement','live_commerce','other')),
  amount bigint not null default 0 check (amount >= 0),
  status text not null default 'negotiating'
    check (status in ('negotiating','confirmed','filming','published','completed','cancelled')),
  publish_date timestamptz,
  actual_views bigint check (actual_views >= 0),
  commission bigint check (commission >= 0),
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.social_plans (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  date timestamptz not null,
  content text not null check (char_length(content) between 1 and 10000),
  target_audience text check (char_length(target_audience) <= 500),
  expected_outcome text check (char_length(expected_outcome) <= 1000),
  actual_result text check (char_length(actual_result) <= 5000),
  linked_opportunity_id uuid references public.opportunities(id) on delete set null,
  status text not null default 'planned' check (status in ('planned','published','reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index opportunities_pipeline_idx on public.opportunities (stage, expected_close)
where deleted_at is null;
create index opportunities_client_idx on public.opportunities (client_id)
where deleted_at is null;
create index channel_orders_status_date_idx on public.channel_orders (status, publish_date)
where deleted_at is null;
create index channel_orders_client_creator_idx on public.channel_orders (client_id, creator_id)
where deleted_at is null;
create index social_plans_date_status_idx on public.social_plans (date, status)
where deleted_at is null;

create or replace function public.set_opportunity_probability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.probability := case new.stage
    when 'contact' then 10
    when 'proposal' then 30
    when 'negotiation' then 50
    when 'contract' then 70
    when 'won' then 100
    when 'lost' then 0
  end;
  return new;
end;
$$;

revoke all on function public.set_opportunity_probability() from public;
grant execute on function public.set_opportunity_probability() to authenticated;

create trigger opportunities_set_probability
before insert or update of stage on public.opportunities
for each row execute function public.set_opportunity_probability();
create trigger opportunities_set_updated_at
before update on public.opportunities
for each row execute function public.set_updated_at();
create trigger channel_orders_set_updated_at
before update on public.channel_orders
for each row execute function public.set_updated_at();
create trigger social_plans_set_updated_at
before update on public.social_plans
for each row execute function public.set_updated_at();

alter table public.opportunities enable row level security;
alter table public.channel_orders enable row level security;
alter table public.social_plans enable row level security;

grant select, insert, update, delete on public.opportunities to authenticated;
grant select, insert, update, delete on public.channel_orders to authenticated;
grant select, insert, update, delete on public.social_plans to authenticated;

create policy "business collaborators can read opportunities" on public.opportunities
for select to authenticated
using (
  public.has_any_role(array['owner','boss','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owners and business can create opportunities" on public.opportunities
for insert to authenticated
with check (public.has_any_role(array['owner','boss','business']) and deleted_at is null);
create policy "owners and business can update opportunities" on public.opportunities
for update to authenticated
using (public.has_any_role(array['owner','boss','business']))
with check (public.has_any_role(array['owner','boss','business']));
create policy "owners can hard delete opportunities" on public.opportunities
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "business collaborators can read channel orders" on public.channel_orders
for select to authenticated
using (
  public.has_any_role(array['owner','boss','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owners and business can create channel orders" on public.channel_orders
for insert to authenticated
with check (public.has_any_role(array['owner','boss','business']) and deleted_at is null);
create policy "owners and business can update channel orders" on public.channel_orders
for update to authenticated
using (public.has_any_role(array['owner','boss','business']))
with check (public.has_any_role(array['owner','boss','business']));
create policy "owners can hard delete channel orders" on public.channel_orders
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "business collaborators can read social plans" on public.social_plans
for select to authenticated
using (
  public.has_any_role(array['owner','boss','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "owners and business can create social plans" on public.social_plans
for insert to authenticated
with check (public.has_any_role(array['owner','boss','business']) and deleted_at is null);
create policy "owners and business can update social plans" on public.social_plans
for update to authenticated
using (public.has_any_role(array['owner','boss','business']))
with check (public.has_any_role(array['owner','boss','business']));
create policy "owners can hard delete social plans" on public.social_plans
for delete to authenticated using (public.has_any_role(array['owner']));
