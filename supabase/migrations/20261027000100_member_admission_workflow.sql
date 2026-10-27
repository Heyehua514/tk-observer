-- Migration: member invitation admission workflow
-- Purpose: allow owners to invite or re-invite members by email, activate existing pending accounts,
--          and keep profile activation metadata auditable without trusting client supplied roles.

begin;

alter table public.profiles
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

alter table public.profiles
  add constraint active_profiles_have_role
  check (status <> 'active' or role is not null);

create index if not exists profiles_status_idx on public.profiles (status);

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
    insert into public.profiles (
      id, name, role, status, invited_by, approved_by, approved_at
    )
    values (
      new.id, invitation.name, invitation.role, 'active',
      invitation.invited_by, invitation.invited_by, now()
    );
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

create or replace function public.link_invitation_to_pending_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if new.status <> 'invited' or new.expires_at <= now() then
    return new;
  end if;

  select id into target_user_id
  from auth.users
  where lower(email::text) = lower(new.email::text)
  limit 1;

  if target_user_id is null then
    return new;
  end if;

  update public.profiles
  set name = new.name,
      role = new.role,
      status = 'active',
      invited_by = new.invited_by,
      approved_by = new.invited_by,
      approved_at = now()
  where id = target_user_id
    and status = 'pending';

  if found then
    update public.member_invitations
    set status = 'accepted', accepted_at = now(), updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.link_invitation_to_pending_profile() from public;

drop trigger if exists member_invitation_links_pending_profile on public.member_invitations;
create trigger member_invitation_links_pending_profile
after insert or update of status, email, name, role, expires_at
on public.member_invitations
for each row execute function public.link_invitation_to_pending_profile();

commit;
