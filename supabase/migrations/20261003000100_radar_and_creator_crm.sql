-- Migration: Add product radar table and enrich creator CRM contacts & categories
-- Date: 2026-10-03

-- 1. Create product radar table for viral product tracking and discovery
create table if not exists public.product_radars (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  category text not null check (char_length(category) between 1 and 80),
  region text not null default 'US' check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  source_platform text not null default 'tiktok_shop' check (source_platform in ('tiktok_shop', 'amazon', 'shopee', 'lazada', 'other')),
  source_url text check (char_length(source_url) <= 2000),
  sales_volume bigint not null default 0 check (sales_volume >= 0),
  sales_amount_minor bigint not null default 0 check (sales_amount_minor >= 0),
  currency text not null default 'USD' check (currency in ('USD','CNY','GBP','EUR','IDR','THB','VND','MYR','PHP','SGD')),
  heat_score integer not null default 50 check (heat_score between 0 and 100),
  growth_rate numeric(6, 2) not null default 0.0,
  tags text[] not null default '{}'::text[],
  is_added_to_products boolean not null default false,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists product_radars_region_category_idx on public.product_radars (region, category)
  where deleted_at is null;
create index if not exists product_radars_heat_score_idx on public.product_radars (heat_score desc)
  where deleted_at is null;

create trigger product_radars_set_updated_at before update on public.product_radars
for each row execute function public.set_updated_at();

alter table public.product_radars enable row level security;
grant select, insert, update, delete on public.product_radars to authenticated;

create policy "market and boss can read product radars" on public.product_radars
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "market can manage product radars" on public.product_radars
for all to authenticated
using (public.has_any_role(array['owner','market']))
with check (public.has_any_role(array['owner','market']));

comment on table public.product_radars is '市场选品爆品雷达：监测全网爆款销售、热度与增长率指标';

-- 2. Enrich creators table for structured contact information and category tagging
alter table public.creators add column if not exists contact_email text;
alter table public.creators add column if not exists contact_phone text;
alter table public.creators add column if not exists category text default '通用';
alter table public.creators add column if not exists last_contacted_at timestamptz;

comment on column public.creators.contact_email is '达人联系邮箱';
comment on column public.creators.contact_phone is '达人联系手机/WhatsApp';
comment on column public.creators.category is '达人内容垂类（美妆护肤、数码3C、居家日用、时尚服饰等）';
comment on column public.creators.last_contacted_at is '最近一次建联跟进时间戳';
