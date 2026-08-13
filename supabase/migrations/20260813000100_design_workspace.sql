-- Supabase 设计工作台核心表；权限：design 处理，boss/business 提需求和验收，owner/boss 监督。
create table public.design_assets (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  file_name text not null check (char_length(file_name) between 1 and 180),
  file_path text not null check (char_length(file_path) between 1 and 2000),
  dimensions text check (char_length(dimensions) <= 40),
  region text not null check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  status text not null default 'draft'
    check (status in ('draft','pending_review','approved','rejected')),
  owner_id uuid references public.profiles(id) on delete set null,
  review_reason text check (char_length(review_reason) <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint design_assets_rejection_reason_check check (
    status <> 'rejected' or nullif(btrim(review_reason), '') is not null
  )
);

create table public.design_tasks (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 180),
  status text not null default 'todo' check (status in ('todo','doing','review','done')),
  due_at timestamptz,
  region text not null check (region in ('US','UK','ID','TH','VN','MY','PH','SG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.design_requirements (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 5000),
  requester_id uuid not null references public.profiles(id) on delete restrict,
  target_size text not null check (char_length(target_size) between 1 and 80),
  usage_scene text not null check (char_length(usage_scene) between 1 and 200),
  copy_content text not null check (char_length(copy_content) between 1 and 5000),
  delivery_format text not null check (char_length(delivery_format) between 1 and 80),
  reference_urls text check (char_length(reference_urls) <= 2000),
  status text not null default 'pending'
    check (status in ('pending','in_progress','delivered','revised')),
  priority text not null check (priority in ('高','中','低')),
  due_date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.design_references (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  requirement_id uuid not null references public.design_requirements(id) on delete restrict,
  image_url text not null check (char_length(image_url) <= 2000),
  source text check (char_length(source) <= 200),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.design_deliverables (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  requirement_id uuid not null references public.design_requirements(id) on delete restrict,
  asset_id uuid not null references public.design_assets(id) on delete restrict,
  exported_size text not null check (char_length(exported_size) between 1 and 40),
  exported_format text not null check (char_length(exported_format) between 1 and 20),
  checklist_ok boolean not null default false,
  delivered_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index design_assets_status_owner_idx on public.design_assets (status, owner_id)
where deleted_at is null;
create index design_tasks_status_due_idx on public.design_tasks (status, due_at)
where deleted_at is null;
create index design_requirements_status_due_idx on public.design_requirements (status, due_date)
where deleted_at is null;
create index design_references_requirement_idx on public.design_references (requirement_id)
where deleted_at is null;
create index design_deliverables_requirement_idx on public.design_deliverables (requirement_id)
where deleted_at is null;

create trigger design_assets_set_updated_at before update on public.design_assets
for each row execute function public.set_updated_at();
create trigger design_tasks_set_updated_at before update on public.design_tasks
for each row execute function public.set_updated_at();
create trigger design_requirements_set_updated_at before update on public.design_requirements
for each row execute function public.set_updated_at();
create trigger design_references_set_updated_at before update on public.design_references
for each row execute function public.set_updated_at();
create trigger design_deliverables_set_updated_at before update on public.design_deliverables
for each row execute function public.set_updated_at();

create or replace function public.enforce_design_requirement_status_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() = 'design' then
    if (
      new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.requester_id is distinct from old.requester_id
      or new.target_size is distinct from old.target_size
      or new.usage_scene is distinct from old.usage_scene
      or new.copy_content is distinct from old.copy_content
      or new.delivery_format is distinct from old.delivery_format
      or new.reference_urls is distinct from old.reference_urls
      or new.priority is distinct from old.priority
      or new.due_date is distinct from old.due_date
      or new.created_at is distinct from old.created_at
      or new.deleted_at is distinct from old.deleted_at
    ) then
      raise exception using
        errcode = '42501',
        message = 'design may only update requirement status';
    end if;
    if not (
      (old.status = 'pending' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'delivered')
      or (old.status = 'revised' and new.status = 'in_progress')
      or old.status = new.status
    ) then
      raise exception using
        errcode = '23514',
        message = 'invalid design requirement status transition';
    end if;
  end if;

  if public.current_user_role() in ('boss','business') then
    if old.status = 'delivered' and new.status = 'revised' then
      return new;
    end if;
    if new.status is distinct from old.status then
      raise exception using
        errcode = '23514',
        message = 'requester may only revise delivered requirements';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_design_requirement_status_update() from public;
grant execute on function public.enforce_design_requirement_status_update() to authenticated;

create trigger design_requirements_enforce_status_update
before update on public.design_requirements
for each row execute function public.enforce_design_requirement_status_update();

alter table public.design_assets enable row level security;
alter table public.design_tasks enable row level security;
alter table public.design_requirements enable row level security;
alter table public.design_references enable row level security;
alter table public.design_deliverables enable row level security;

grant select, insert, update, delete on public.design_assets to authenticated;
grant select, insert, update, delete on public.design_tasks to authenticated;
grant select, insert, update, delete on public.design_requirements to authenticated;
grant select, insert, update, delete on public.design_references to authenticated;
grant select, insert, update, delete on public.design_deliverables to authenticated;

create policy "design collaborators can read assets" on public.design_assets
for select to authenticated using (
  public.has_any_role(array['owner','boss','design'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "design can create assets" on public.design_assets
for insert to authenticated with check (
  public.has_any_role(array['owner','design']) and deleted_at is null
);
create policy "design collaborators can update assets" on public.design_assets
for update to authenticated
using (public.has_any_role(array['owner','boss','design']))
with check (public.has_any_role(array['owner','boss','design']));
create policy "owners can hard delete assets" on public.design_assets
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "design collaborators can read tasks" on public.design_tasks
for select to authenticated using (
  public.has_any_role(array['owner','boss','design'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "design can create tasks" on public.design_tasks
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','design']) and deleted_at is null
);
create policy "design collaborators can update tasks" on public.design_tasks
for update to authenticated
using (public.has_any_role(array['owner','boss','design']))
with check (public.has_any_role(array['owner','boss','design']));
create policy "owners can hard delete tasks" on public.design_tasks
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "requirement collaborators can read requirements" on public.design_requirements
for select to authenticated using (
  public.has_any_role(array['owner','boss','business','design'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "requesters can create requirements" on public.design_requirements
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','business'])
  and requester_id = auth.uid()
  and status = 'pending'
  and deleted_at is null
);
create policy "requirement collaborators can update requirements" on public.design_requirements
for update to authenticated
using (public.has_any_role(array['owner','boss','business','design']))
with check (public.has_any_role(array['owner','boss','business','design']));
create policy "owners can hard delete requirements" on public.design_requirements
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "design can read references" on public.design_references
for select to authenticated using (
  public.has_any_role(array['owner','design'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "design can create references" on public.design_references
for insert to authenticated with check (
  public.has_any_role(array['owner','design']) and deleted_at is null
);
create policy "design can update references" on public.design_references
for update to authenticated
using (public.has_any_role(array['owner','design']))
with check (public.has_any_role(array['owner','design']));
create policy "owners can hard delete references" on public.design_references
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "requirement collaborators can read deliverables" on public.design_deliverables
for select to authenticated using (
  public.has_any_role(array['owner','boss','business','design'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "design can create deliverables" on public.design_deliverables
for insert to authenticated with check (
  public.has_any_role(array['owner','design']) and deleted_at is null
);
create policy "design can update deliverables" on public.design_deliverables
for update to authenticated
using (public.has_any_role(array['owner','design']))
with check (public.has_any_role(array['owner','design']));
create policy "owners can hard delete deliverables" on public.design_deliverables
for delete to authenticated using (public.has_any_role(array['owner']));

alter table public.design_assets replica identity full;
alter table public.design_tasks replica identity full;
alter table public.design_requirements replica identity full;
alter table public.design_references replica identity full;
alter table public.design_deliverables replica identity full;

alter publication supabase_realtime add table
  public.design_assets,
  public.design_tasks,
  public.design_requirements,
  public.design_references,
  public.design_deliverables;
