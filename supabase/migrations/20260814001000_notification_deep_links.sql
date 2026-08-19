-- 通知深链：为 notifications 追加 record_type / record_id，让前端铃铛点击可直接定位到具体记录。
-- 权限：沿用既有 RLS（成员只读/更新自己的通知），不新增敏感信息。
-- 说明：不修改已发布 migration；通过本迁移追加列并重建相关触发器函数以写入目标记录 id。

alter table public.notifications
  add column if not exists record_type text check (
    record_type is null or record_type in ('opportunity', 'event_task')
  ),
  add column if not exists record_id text check (
    record_id is null or char_length(record_id) <= 64
  );

create index if not exists notifications_record_idx
  on public.notifications (record_type, record_id)
  where record_id is not null;

-- 重建商机成交触发器：写入 record_type/record_id
create or replace function public.notify_boss_on_opportunity_won()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stage = 'won' and old.stage is distinct from 'won' then
    insert into public.notifications (recipient_id, type, title, content, link, record_type, record_id)
    select p.id, 'opportunity_won', '商机已成交',
           '「' || new.title || '」已成交'
             || case when new.amount is not null
                then '，金额 ' || round(new.amount / 100.0, 2) || ' 元'
                else '' end,
           '/business', 'opportunity', new.id::text
    from public.profiles p
    where p.role = 'boss'
      and p.status = 'active'
      and not exists (
        select 1 from public.notifications n
        where n.recipient_id = p.id
          and n.type = 'opportunity_won'
          and n.title = '商机已成交'
          and n.content = '「' || new.title || '」已成交'
            || case when new.amount is not null
               then '，金额 ' || round(new.amount / 100.0, 2) || ' 元'
               else '' end
          and n.deleted_at is null
      );
  end if;
  return new;
end;
$$;

-- 重建截止提醒触发器：商机截止写入 opportunity 记录；活动任务截止写入 event_task 记录
create or replace function public.run_deadline_checks()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_start timestamptz :=
    ((now() at time zone 'Asia/Shanghai')::date::timestamp at time zone 'Asia/Shanghai');
  day_end timestamptz := day_start + interval '1 day';
  task_count integer := 0;
  opportunity_count integer := 0;
begin
  insert into public.notifications (recipient_id, type, title, content, link, record_type, record_id)
  select t.assignee_id, 'deadline', '活动任务今日截止',
         '「' || t.title || '」今天截止，请及时处理。',
         '/market/events/' || t.event_id::text, 'event_task', t.id::text
  from public.event_tasks t
  where t.assignee_id is not null
    and t.due_date >= day_start
    and t.due_date < day_end
    and t.status <> 'done'
    and t.deleted_at is null
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id = t.assignee_id
        and n.type = 'deadline'
        and n.created_at >= day_start
        and n.content = '「' || t.title || '」今天截止，请及时处理。'
    );
  get diagnostics task_count = row_count;

  insert into public.notifications (recipient_id, type, title, content, link, record_type, record_id)
  select o.created_by, 'deadline', '商机预计今日成交',
         '「' || o.title || '」预计今天成交，请更新跟进状态。', '/business', 'opportunity', o.id::text
  from public.opportunities o
  where o.created_by is not null
    and o.expected_close >= day_start
    and o.expected_close < day_end
    and o.stage not in ('won', 'lost')
    and o.deleted_at is null
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id = o.created_by
        and n.type = 'deadline'
        and n.created_at >= day_start
        and n.content = '「' || o.title || '」预计今天成交，请更新跟进状态。'
    );
  get diagnostics opportunity_count = row_count;

  insert into public.audit_logs (actor_name, action, entity_type, entity_id)
  values ('系统', 'deadline-check', 'cron_run', to_char(day_start, 'YYYY-MM-DD'));

  return jsonb_build_object(
    'date', to_char(day_start, 'YYYY-MM-DD'),
    'tasks', task_count,
    'opportunities', opportunity_count
  );
end;
$$;

revoke all on function public.notify_boss_on_opportunity_won() from public;
revoke all on function public.run_deadline_checks() from public;
