create extension if not exists citext with schema extensions;

create table public.member_invitations (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique,
  name text not null check (char_length(name) between 1 and 80),
  role text not null check (role in ('owner','boss','business','market','design','editing')),
  status text not null default 'invited' check (status in ('invited','accepted','revoked','expired')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 80),
  role text check (role in ('owner','boss','business','market','design','editing')),
  status text not null default 'pending' check (status in ('invited','pending','active','disabled')),
  invited_by uuid references auth.users(id) on delete set null,
  avatar_path text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.member_invitations enable row level security;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() and status = 'active' $$;

create or replace function public.current_user_status()
returns text language sql stable security definer set search_path = ''
as $$ select status from public.profiles where id = auth.uid() $$;

create or replace function public.has_any_role(required_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_user_role() = any(required_roles), false) $$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_status() from public;
revoke all on function public.has_any_role(text[]) from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_status() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;

create policy "active members can read active profiles" on public.profiles
for select to authenticated
using (status = 'active' and public.current_user_status() = 'active');

create policy "owners can manage profiles" on public.profiles
for all to authenticated
using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create policy "owners can read invitations" on public.member_invitations
for select to authenticated using (public.has_any_role(array['owner']));
create policy "owners can create invitations" on public.member_invitations
for insert to authenticated with check (public.has_any_role(array['owner']));
create policy "owners can update invitations" on public.member_invitations
for update to authenticated using (public.has_any_role(array['owner']))
with check (public.has_any_role(array['owner']));

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare invitation public.member_invitations;
begin
  select * into invitation
  from public.member_invitations
  where email = new.email
    and status = 'invited'
    and expires_at > now()
  for update;

  if found then
    insert into public.profiles (id, name, role, status, invited_by)
    values (new.id, invitation.name, invitation.role, 'active', invitation.invited_by);
    update public.member_invitations
    set status = 'accepted', accepted_at = now(), updated_at = now()
    where id = invitation.id;
  else
    insert into public.profiles (id, name, status)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'name', '待审批成员'), 'pending');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger invitations_set_updated_at
before update on public.member_invitations
for each row execute function public.set_updated_at();
