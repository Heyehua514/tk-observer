-- Supabase 市场活动协作核心；权限：market 管活动，business 跟进招商，各角色更新获派任务，owner/boss 监督。
create table public.events (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 180),
  type text not null check (type in ('closed_salon','private_dinner','annual_summit','global_study_tour')),
  theme text check (char_length(theme) <= 500),
  start_date timestamptz not null,
  location_city text not null check (char_length(location_city) between 1 and 80),
  target_attendees integer not null default 0 check (target_attendees >= 0),
  target_sponsorship bigint not null default 0 check (target_sponsorship >= 0),
  total_budget bigint not null default 0 check (total_budget >= 0),
  status text not null default 'preparing'
    check (status in ('preparing','sponsoring','scheduled','ongoing','ended','reviewed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.event_phases (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  event_id uuid not null references public.events(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  phase_order integer not null check (phase_order between 0 and 4),
  start_date timestamptz,
  end_date timestamptz,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','completed')),
  completion_pct integer not null default 0 check (completion_pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint event_phases_date_order_check check (
    start_date is null or end_date is null or end_date >= start_date
  ),
  constraint event_phases_event_order_key unique (event_id, phase_order)
);

create table public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  event_id uuid not null references public.events(id) on delete restrict,
  phase_id uuid not null references public.event_phases(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 180),
  assignee_role text not null check (assignee_role in ('boss','business','market','design','editing')),
  assignee_id uuid references public.profiles(id) on delete set null,
  status text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  due_date timestamptz,
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  event_id uuid not null references public.events(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  company text check (char_length(company) <= 160),
  position text check (char_length(position) <= 80),
  channel text not null check (channel in ('referral','activity','朋友圈','主动邀请','other')),
  confirmation_status text not null default 'pending'
    check (confirmation_status in ('pending','confirmed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','waived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.event_sponsorships (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  event_id uuid not null references public.events(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  contact_name text check (char_length(contact_name) <= 80),
  amount bigint not null default 0 check (amount >= 0),
  stage text not null default 'intent' check (stage in ('intent','negotiating','signed','lost')),
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index events_status_start_idx on public.events (status, start_date)
where deleted_at is null;
create index event_phases_event_order_idx on public.event_phases (event_id, phase_order)
where deleted_at is null;
create index event_tasks_board_idx on public.event_tasks (event_id, phase_id, status)
where deleted_at is null;
create index event_tasks_assignee_due_idx on public.event_tasks (assignee_id, due_date)
where deleted_at is null;
create index event_registrations_event_status_idx on public.event_registrations (event_id, confirmation_status)
where deleted_at is null;
create index event_sponsorships_event_stage_idx on public.event_sponsorships (event_id, stage)
where deleted_at is null;

create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();
create trigger event_phases_set_updated_at before update on public.event_phases
for each row execute function public.set_updated_at();
create trigger event_tasks_set_updated_at before update on public.event_tasks
for each row execute function public.set_updated_at();
create trigger event_registrations_set_updated_at before update on public.event_registrations
for each row execute function public.set_updated_at();
create trigger event_sponsorships_set_updated_at before update on public.event_sponsorships
for each row execute function public.set_updated_at();

create or replace function public.validate_event_task_phase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.event_phases
    where id = new.phase_id and event_id = new.event_id and deleted_at is null
  ) then
    raise exception using
      errcode = '23503',
      message = 'event task phase must belong to the same event';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_event_task_collaborator_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() in ('business','design','editing') and (
    new.id is distinct from old.id
    or new.legacy_id is distinct from old.legacy_id
    or new.event_id is distinct from old.event_id
    or new.phase_id is distinct from old.phase_id
    or new.title is distinct from old.title
    or new.assignee_role is distinct from old.assignee_role
    or new.assignee_id is distinct from old.assignee_id
    or new.priority is distinct from old.priority
    or new.due_date is distinct from old.due_date
    or new.created_at is distinct from old.created_at
    or new.deleted_at is distinct from old.deleted_at
  ) then
    raise exception using
      errcode = '42501',
      message = 'assigned collaborators may only update event task status and notes';
  end if;
  return new;
end;
$$;

create or replace function public.refresh_event_phase_completion(target_phase_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare next_completion integer;
begin
  select coalesce(
    round(
      100.0 * count(*) filter (where status = 'done')
      / nullif(count(*), 0)
    ),
    0
  )::integer
  into next_completion
  from public.event_tasks
  where phase_id = target_phase_id and deleted_at is null;

  update public.event_phases
  set completion_pct = next_completion
  where id = target_phase_id;
end;
$$;

create or replace function public.handle_event_task_phase_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_event_phase_completion(old.phase_id);
    return old;
  end if;

  perform public.refresh_event_phase_completion(new.phase_id);
  if tg_op = 'UPDATE' and old.phase_id is distinct from new.phase_id then
    perform public.refresh_event_phase_completion(old.phase_id);
  end if;
  return new;
end;
$$;

revoke all on function public.validate_event_task_phase() from public;
revoke all on function public.enforce_event_task_collaborator_update() from public;
revoke all on function public.refresh_event_phase_completion(uuid) from public;
revoke all on function public.handle_event_task_phase_completion() from public;
grant execute on function public.validate_event_task_phase() to authenticated;
grant execute on function public.enforce_event_task_collaborator_update() to authenticated;
grant execute on function public.handle_event_task_phase_completion() to authenticated;

create trigger event_tasks_validate_phase
before insert or update of event_id, phase_id on public.event_tasks
for each row execute function public.validate_event_task_phase();
create trigger event_tasks_enforce_collaborator_update
before update on public.event_tasks
for each row execute function public.enforce_event_task_collaborator_update();
create trigger event_tasks_refresh_phase_completion
after insert or delete or update of status, phase_id, deleted_at on public.event_tasks
for each row execute function public.handle_event_task_phase_completion();

alter table public.events enable row level security;
alter table public.event_phases enable row level security;
alter table public.event_tasks enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_sponsorships enable row level security;

grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_phases to authenticated;
grant select, insert, update, delete on public.event_tasks to authenticated;
grant select, insert, update, delete on public.event_registrations to authenticated;
grant select, insert, update, delete on public.event_sponsorships to authenticated;

create policy "event collaborators can read events" on public.events
for select to authenticated using (
  public.has_any_role(array['owner','boss','market','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "event coordinators can create events" on public.events
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','market']) and deleted_at is null
);
create policy "event coordinators can update events" on public.events
for update to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));
create policy "owners can hard delete events" on public.events
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "event coordinators can read phases" on public.event_phases
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "event coordinators can create phases" on public.event_phases
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','market']) and deleted_at is null
);
create policy "event coordinators can update phases" on public.event_phases
for update to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));
create policy "owners can hard delete phases" on public.event_phases
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "event coordinators can read tasks" on public.event_tasks
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "assigned collaborators can read tasks" on public.event_tasks
for select to authenticated using (
  deleted_at is null
  and public.has_any_role(array['business','design','editing'])
  and (assignee_id = auth.uid() or assignee_role = public.current_user_role())
);
create policy "event coordinators can create tasks" on public.event_tasks
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','market']) and deleted_at is null
);
create policy "event coordinators can update tasks" on public.event_tasks
for update to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));
create policy "assigned collaborators can update tasks" on public.event_tasks
for update to authenticated
using (
  deleted_at is null
  and public.has_any_role(array['business','design','editing'])
  and (assignee_id = auth.uid() or assignee_role = public.current_user_role())
)
with check (
  deleted_at is null
  and public.has_any_role(array['business','design','editing'])
  and (assignee_id = auth.uid() or assignee_role = public.current_user_role())
);
create policy "owners can hard delete tasks" on public.event_tasks
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "event coordinators can read registrations" on public.event_registrations
for select to authenticated using (
  public.has_any_role(array['owner','boss','market'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "event coordinators can create registrations" on public.event_registrations
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','market']) and deleted_at is null
);
create policy "event coordinators can update registrations" on public.event_registrations
for update to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));
create policy "owners can hard delete registrations" on public.event_registrations
for delete to authenticated using (public.has_any_role(array['owner']));

create policy "sponsorship collaborators can read sponsorships" on public.event_sponsorships
for select to authenticated using (
  public.has_any_role(array['owner','boss','market','business'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);
create policy "event coordinators can create sponsorships" on public.event_sponsorships
for insert to authenticated with check (
  public.has_any_role(array['owner','boss','market']) and deleted_at is null
);
create policy "sponsorship collaborators can update sponsorships" on public.event_sponsorships
for update to authenticated
using (public.has_any_role(array['owner','boss','market','business']))
with check (public.has_any_role(array['owner','boss','market','business']));
create policy "owners can hard delete sponsorships" on public.event_sponsorships
for delete to authenticated using (public.has_any_role(array['owner']));
