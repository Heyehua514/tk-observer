-- C2 · 通用状态变更历史表 + 触发器
-- 用途：记录 opportunities / channel_orders / video_tasks / social_plans 等实体状态变更历史，供协作看板与回溯。
-- 所属工作台：全局（商务/剪辑/市场协作）
-- 权限：authenticated 可读；安全由触发器写入（security definer），客户端只读，不直写。

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('opportunity','order','video_task','social_plan','event_task')),
  entity_id text not null check (char_length(entity_id) between 1 and 80),
  from_status text,
  to_status text not null,
  actor_name text not null check (char_length(actor_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index status_history_entity_idx on public.status_history (entity_type, entity_id, created_at desc)
where deleted_at is null;

create trigger status_history_set_updated_at before update on public.status_history
for each row execute function public.set_updated_at();

alter table public.status_history enable row level security;

grant select, insert, update, delete on public.status_history to authenticated;

create policy "active members can read status history" on public.status_history
for select to authenticated using (
  (deleted_at is null or public.has_any_role(array['owner']))
  and public.current_user_status() = 'active'
);

create policy "service writes status history" on public.status_history
for insert to authenticated with check (
  public.has_any_role(array['owner','boss'])
);

-- 记录机会阶段变更
create or replace function public.audit_opportunity_stage_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    insert into public.status_history (entity_type, entity_id, from_status, to_status, actor_name)
    values ('opportunity', new.id::text, old.stage, new.stage, coalesce(new.updated_by, '系统'));
  end if;
  return new;
end;
$$;

-- 记录渠道商单状态变更
create or replace function public.audit_order_status_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.status_history (entity_type, entity_id, from_status, to_status, actor_name)
    values ('order', new.id::text, old.status, new.status, coalesce(new.updated_by, '系统'));
  end if;
  return new;
end;
$$;

-- 机会表可能没有 updated_by 列，先声明列（若存在则复用）
alter table public.opportunities add column if not exists updated_by text;
alter table public.channel_orders add column if not exists updated_by text;

drop trigger if exists opportunities_audit_stage_history on public.opportunities;
create trigger opportunities_audit_stage_history
before update of stage on public.opportunities
for each row execute function public.audit_opportunity_stage_history();

drop trigger if exists channel_orders_audit_status_history on public.channel_orders;
create trigger channel_orders_audit_status_history
before update of status on public.channel_orders
for each row execute function public.audit_order_status_history();

revoke all on function public.audit_opportunity_stage_history() from public;
revoke all on function public.audit_order_status_history() from public;
