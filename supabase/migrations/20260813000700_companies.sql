-- Supabase 商务客户与供应商名录：business 维护，boss 只读。
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  company_name text not null check (char_length(company_name) between 1 and 160),
  kind text not null check (kind in ('client','supplier')),
  contact_name text check (char_length(contact_name) <= 80),
  contact_email text,
  region text not null default 'US' check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index companies_region_kind_idx on public.companies (region, kind)
where deleted_at is null;
create index companies_name_contact_idx on public.companies using gin (
  to_tsvector('simple', company_name || ' ' || coalesce(contact_name, '') || ' ' || coalesce(contact_email, ''))
) where deleted_at is null;

create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;

grant select, insert, update, delete on public.companies to authenticated;

create policy "business collaborators can read companies" on public.companies
for select to authenticated using (
  public.has_any_role(array['owner','boss','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "business can manage companies" on public.companies
for all to authenticated
using (public.has_any_role(array['owner','business']))
with check (public.has_any_role(array['owner','business']));

alter table public.companies replica identity full;

alter publication supabase_realtime add table public.companies;
