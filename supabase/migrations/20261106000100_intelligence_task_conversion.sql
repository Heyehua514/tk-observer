-- 情报转团队任务：单事务创建真实任务并写回情报状态，重复转换 fail-closed。
-- 权限：仅 owner/boss 可创建团队任务；情报须存在、未软删且尚未转换。

alter table public.team_tasks
add column source_intelligence_id uuid
references public.intelligence_items(id) on delete set null;

create unique index team_tasks_source_intelligence_id_idx
on public.team_tasks (source_intelligence_id)
where source_intelligence_id is not null;

create or replace function public.convert_intelligence_item_to_task(
  p_intelligence_item_id uuid,
  p_assignee_name text,
  p_due_at timestamptz default null,
  p_region text default 'US'
)
returns public.team_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.intelligence_items%rowtype;
  v_task public.team_tasks%rowtype;
  v_assignee_name text := btrim(coalesce(p_assignee_name, ''));
  v_region text := btrim(coalesce(p_region, 'US'));
begin
  if auth.uid() is null or public.current_user_status() <> 'active' then
    raise exception using errcode = '42501', message = 'active member required to convert intelligence';
  end if;

  if not public.has_any_role(array['owner', 'boss']) then
    raise exception using errcode = '42501', message = 'team task management role required';
  end if;

  if p_intelligence_item_id is null then
    raise exception using errcode = '22023', message = 'intelligence item id is required';
  end if;

  if char_length(v_assignee_name) not between 1 and 40 then
    raise exception using errcode = '22023', message = 'assignee name must contain 1 to 40 characters';
  end if;

  if v_region not in ('US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG') then
    raise exception using errcode = '22023', message = 'unsupported team task region';
  end if;

  select *
    into v_item
  from public.intelligence_items
  where id = p_intelligence_item_id
  for update;

  if not found or v_item.deleted_at is not null then
    raise exception using errcode = 'P0002', message = 'intelligence item not found';
  end if;

  if v_item.status = 'tasked' or exists (
    select 1
    from public.team_tasks
    where source_intelligence_id = v_item.id
  ) then
    raise exception using errcode = '23505', message = 'intelligence item already converted to a task';
  end if;

  insert into public.team_tasks (
    assignee_name,
    title,
    progress,
    due_at,
    region,
    source_intelligence_id
  ) values (
    v_assignee_name,
    left(btrim(v_item.title), 180),
    0,
    p_due_at,
    v_region,
    v_item.id
  )
  returning * into v_task;

  update public.intelligence_items
  set status = 'tasked'
  where id = v_item.id;

  return v_task;
end;
$$;

revoke all on function public.convert_intelligence_item_to_task(uuid, text, timestamptz, text) from public;
grant execute on function public.convert_intelligence_item_to_task(uuid, text, timestamptz, text) to authenticated;