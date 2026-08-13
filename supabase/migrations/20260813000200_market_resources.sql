-- Supabase 市场资源库：场地、文案模板、活动物料、财务复盘。
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 180),
  type text not null check (type in ('hotel','club','industrial_park','creative_space','study_destination')),
  city text not null check (char_length(city) between 1 and 80),
  address text check (char_length(address) <= 500),
  capacity_min integer not null default 0 check (capacity_min >= 0),
  capacity_max integer not null default 0 check (capacity_max >= 0),
  price_range text check (char_length(price_range) <= 120),
  scene_tags text check (char_length(scene_tags) <= 1000),
  pros text check (char_length(pros) <= 5000),
  cons text check (char_length(cons) <= 5000),
  contact_name text check (char_length(contact_name) <= 80),
  contact_phone text check (char_length(contact_phone) <= 40),
  site_visit_date timestamptz,
  site_visit_notes text check (char_length(site_visit_notes) <= 5000),
  photo_paths text[] not null default '{}',
  is_verified boolean not null default false,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint venues_capacity_range_check check (capacity_max >= capacity_min)
);

alter table public.events
add column if not exists venue_id uuid references public.venues(id) on delete set null;

create table public.event_templates (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 180),
  type text not null check (type in ('invitation','external_copy','poster_copy','review_report','sop')),
  event_type text not null check (event_type in ('closed_salon','private_dinner','annual_summit','global_study_tour','general')),
  content text not null check (char_length(content) between 1 and 50000),
  tags text check (char_length(tags) <= 1000),
  usage_count integer not null default 0 check (usage_count >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.event_materials (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  event_id uuid references public.events(id) on delete set null,
  type text not null check (type in ('key_visual','poster','invitation','check_in','table_card','agenda','thank_you')),
  name text not null check (char_length(name) between 1 and 180),
  file_path text check (char_length(file_path) <= 2000),
  status text not null check (status in ('designing','pending_review','confirmed','printed')),
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.event_finances (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  event_id uuid not null references public.events(id) on delete restrict,
  category text not null check (category in ('sponsorship_income','ticket_income','venue','setup','catering','printing','travel','other')),
  type text not null check (type in ('income','expense')),
  amount bigint not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 500),
  paid_by text check (char_length(paid_by) <= 80),
  paid_at timestamptz,
  receipt_path text check (char_length(receipt_path) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint event_finances_category_type_check check (
    (category in ('sponsorship_income','ticket_income') and type = 'income')
    or (category not in ('sponsorship_income','ticket_income') and type = 'expense')
  )
);

create index venues_city_type_idx on public.venues (city, type) where deleted_at is null;
create index events_venue_idx on public.events (venue_id) where deleted_at is null;
create index event_templates_type_idx on public.event_templates (type, event_type) where deleted_at is null;
create index event_materials_event_status_idx on public.event_materials (event_id, status) where deleted_at is null;
create index event_finances_event_paid_idx on public.event_finances (event_id, paid_at) where deleted_at is null;

create trigger venues_set_updated_at before update on public.venues
for each row execute function public.set_updated_at();
create trigger event_templates_set_updated_at before update on public.event_templates
for each row execute function public.set_updated_at();
create trigger event_materials_set_updated_at before update on public.event_materials
for each row execute function public.set_updated_at();
create trigger event_finances_set_updated_at before update on public.event_finances
for each row execute function public.set_updated_at();

alter table public.venues enable row level security;
alter table public.event_templates enable row level security;
alter table public.event_materials enable row level security;
alter table public.event_finances enable row level security;

grant select, insert, update, delete on public.venues to authenticated;
grant select, insert, update, delete on public.event_templates to authenticated;
grant select, insert, update, delete on public.event_materials to authenticated;
grant select, insert, update, delete on public.event_finances to authenticated;

create policy "market collaborators can read venues" on public.venues
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "market can manage venues" on public.venues
for all to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));

create policy "market collaborators can read templates" on public.event_templates
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "market can manage templates" on public.event_templates
for all to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));

create policy "market collaborators can read materials" on public.event_materials
for select to authenticated using (
  public.has_any_role(array['owner','boss','market','design'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "market can manage materials" on public.event_materials
for all to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));

create policy "market collaborators can read finances" on public.event_finances
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "market can manage finances" on public.event_finances
for all to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));

alter table public.venues replica identity full;
alter table public.event_templates replica identity full;
alter table public.event_materials replica identity full;
alter table public.event_finances replica identity full;

alter publication supabase_realtime add table
  public.venues,
  public.event_templates,
  public.event_materials,
  public.event_finances;
