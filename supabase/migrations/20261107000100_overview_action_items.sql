-- 总览跨工作台待办统一读取契约：只返回未结、未软删事项，并保留负责人和情报来源。
-- 使用 security invoker，底层各业务表 RLS 继续按当前用户生效。

create or replace function public.get_overview_action_items(
  p_limit integer default 50
)
returns table (
  workspace text,
  record_id uuid,
  title text,
  status text,
  due_at timestamptz,
  assignee_name text,
  source_intelligence_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    item.workspace,
    item.record_id,
    item.title,
    item.status,
    item.due_at,
    item.assignee_name,
    item.source_intelligence_id
  from (
    select
      'design'::text as workspace,
      task.id as record_id,
      task.title,
      task.status,
      task.due_at,
      null::text as assignee_name,
      null::uuid as source_intelligence_id
    from public.design_tasks as task
    where task.deleted_at is null
      and task.status <> 'done'

    union all

    select
      'editing'::text,
      task.id,
      task.title,
      task.status,
      task.due_at,
      task.owner_name,
      null::uuid
    from public.video_tasks as task
    where task.deleted_at is null
      and task.status <> 'done'

    union all

    select
      'business'::text,
      opportunity.id,
      opportunity.title,
      opportunity.stage,
      opportunity.expected_close,
      null::text,
      null::uuid
    from public.opportunities as opportunity
    where opportunity.deleted_at is null
      and opportunity.stage not in ('won', 'lost')

    union all

    select
      'team'::text,
      task.id,
      task.title,
      'in_progress'::text,
      task.due_at,
      task.assignee_name,
      task.source_intelligence_id
    from public.team_tasks as task
    where task.deleted_at is null
      and task.progress < 100
  ) as item
  order by item.due_at asc nulls last, item.workspace, item.title, item.record_id
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke all on function public.get_overview_action_items(integer) from public;
grant execute on function public.get_overview_action_items(integer) to authenticated;

comment on function public.get_overview_action_items(integer)
is '总览跨工作台未结待办，调用者 RLS 生效；最多返回 100 条。';