-- Migration: Add creator follow-ups table for lifecycle tracking and communication records
-- Date: 2026-10-08

create table if not exists public.creator_follow_ups (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  channel text not null default 'whatsapp' check (channel in ('email', 'phone', 'whatsapp', 'tiktok_dm', 'other')),
  status text not null check (status in ('pending', 'contacting', 'signed', 'terminated')),
  summary text not null check (char_length(summary) between 1 and 2000),
  contacted_at timestamptz not null default now(),
  next_follow_up_at timestamptz,
  operator_name text not null default '董雨辰' check (char_length(operator_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists creator_follow_ups_creator_contacted_idx
  on public.creator_follow_ups (creator_id, contacted_at desc)
  where deleted_at is null;

create index if not exists creator_follow_ups_next_follow_up_idx
  on public.creator_follow_ups (next_follow_up_at)
  where deleted_at is null and next_follow_up_at is not null;

create trigger creator_follow_ups_set_updated_at
  before update on public.creator_follow_ups
  for each row execute function public.set_updated_at();

-- Trigger to automatically synchronize creators.last_contacted_at and cooperation_status
create or replace function public.sync_creator_on_follow_up()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.creators
  set
    last_contacted_at = new.contacted_at,
    cooperation_status = new.status,
    updated_at = now()
  where id = new.creator_id;
  return new;
end;
$$;

create trigger creator_follow_ups_sync_creator
  after insert on public.creator_follow_ups
  for each row execute function public.sync_creator_on_follow_up();

alter table public.creator_follow_ups enable row level security;
grant select, insert, update, delete on public.creator_follow_ups to authenticated;

create policy "creator collaborators can read follow ups" on public.creator_follow_ups
for select to authenticated
using (
  public.has_any_role(array['owner', 'boss', 'business', 'editing'])
  and (deleted_at is null or public.has_any_role(array['owner']))
);

create policy "business and owners can manage follow ups" on public.creator_follow_ups
for all to authenticated
using (public.has_any_role(array['owner', 'boss', 'business']))
with check (public.has_any_role(array['owner', 'boss', 'business']));

comment on table public.creator_follow_ups is '达人跟进与触达记录表：记录沟通渠道、纪要、排期与合作生命周期变更';
comment on column public.creator_follow_ups.channel is '沟通渠道：email / phone / whatsapp / tiktok_dm / other';
comment on column public.creator_follow_ups.status is '本次跟进后达人的最新合作状态';
comment on column public.creator_follow_ups.summary is '沟通摘要与结论';
comment on column public.creator_follow_ups.next_follow_up_at is '下次预约沟通/跟进提醒时间';
