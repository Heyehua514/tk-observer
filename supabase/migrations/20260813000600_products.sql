-- Supabase 市场选品库：市场侧维护，boss 只读总览。
create table public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 160),
  category text not null check (char_length(category) between 1 and 80),
  price_minor bigint not null check (price_minor >= 0),
  cost_minor bigint not null check (cost_minor >= 0),
  currency text not null default 'CNY' check (currency in ('USD','CNY')),
  region text not null default 'US' check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  status text not null default 'draft' check (status in ('draft','testing','active','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index products_region_status_idx on public.products (region, status)
where deleted_at is null;
create index products_name_category_idx on public.products using gin (
  to_tsvector('simple', name || ' ' || category || ' ' || region)
) where deleted_at is null;

create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

grant select, insert, update, delete on public.products to authenticated;

create policy "market collaborators can read products" on public.products
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "market can manage products" on public.products
for all to authenticated
using (public.has_any_role(array['owner','market']))
with check (public.has_any_role(array['owner','market']));

alter table public.products replica identity full;

alter publication supabase_realtime add table public.products;
