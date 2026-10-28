-- Migration: member invitation transition guard
-- Purpose: keep accepted invitations immutable and require a matching active profile
--          before an invitation can be marked accepted.

begin;

update public.member_invitations
set accepted_at = coalesce(updated_at, created_at, now())
where status = 'accepted' and accepted_at is null;

update public.member_invitations
set accepted_at = null
where status <> 'accepted' and accepted_at is not null;

alter table public.member_invitations
  drop constraint if exists member_invitations_accepted_at_consistent;

alter table public.member_invitations
  add constraint member_invitations_accepted_at_consistent
  check ((status = 'accepted') = (accepted_at is not null));

create or replace function public.guard_member_invitation_transition()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'invited' then
      raise exception 'new member invitations must start as invited'
        using errcode = '23514';
    end if;
    new.accepted_at := null;
    return new;
  end if;

  if old.status = 'accepted' then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.name is distinct from old.name
      or new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.invited_by is distinct from old.invited_by
      or new.expires_at is distinct from old.expires_at
      or new.accepted_at is distinct from old.accepted_at
      or new.created_at is distinct from old.created_at then
      raise exception 'accepted invitation is immutable'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if old.status in ('revoked', 'expired') and new.status <> 'invited' then
    raise exception 'revoked or expired invitations can only be re-invited'
      using errcode = '23514';
  end if;

  if new.status = 'accepted' then
    if new.accepted_at is null then
      raise exception 'accepted invitation requires accepted_at'
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from auth.users as auth_user
      join public.profiles as profile on profile.id = auth_user.id
      where lower(auth_user.email::text) = lower(new.email::text)
        and profile.status = 'active'
        and profile.role = new.role
    ) then
      raise exception 'invitation can only be accepted for an active matching profile'
        using errcode = '23514';
    end if;
  elsif new.accepted_at is not null then
    raise exception 'only accepted invitations may have accepted_at'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_member_invitation_transition() from public;

drop trigger if exists member_invitations_guard_transition on public.member_invitations;
create trigger member_invitations_guard_transition
before insert or update on public.member_invitations
for each row execute function public.guard_member_invitation_transition();

commit;