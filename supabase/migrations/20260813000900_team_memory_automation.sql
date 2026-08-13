-- Supabase 总览团队记忆自动化：与 PocketBase 闭环 hooks（daily-report / weekly-report /
-- deadline-check / failed-case-recorder / closed-loop-rules）完全对齐。
-- 所属工作台：总览 / 商务 / 市场 / 设计。
-- 权限：全部自动化函数 security definer 仅服务端调用（cron 与触发器），客户端不可绕过；
-- 本 migration 只追加函数/触发器/字段/定时任务，不改任何已有表结构定义与 RLS。

create extension if not exists pg_cron;

-- ============================================================
-- 0. 追加字段（只加不删，与 PocketBase 字段对齐）
-- ============================================================

-- 商机创建人：供截止提醒定位接收人（PB opportunities.created_by 对齐）
alter table public.opportunities
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists opportunities_created_by_idx
  on public.opportunities (created_by) where deleted_at is null;

-- 朋友圈计划使用计数（PB social_plans.usage_count / last_used_at 对齐）
alter table public.social_plans
  add column if not exists usage_count integer not null default 0 check (usage_count >= 0);

alter table public.social_plans
  add column if not exists last_used_at timestamptz;

-- ============================================================
-- 1. 审计流水：商机阶段变化 / 商机成交 / 活动任务完成
-- ============================================================

create or replace function public.audit_opportunity_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.stage is distinct from new.stage then
    insert into public.audit_logs (actor_name, action, entity_type, entity_id)
    values ('系统', old.stage || '->' || new.stage, 'opportunity_stage', new.id::text);
    if new.stage = 'won' then
      insert into public.audit_logs (actor_name, action, entity_type, entity_id)
      values ('系统', coalesce(new.amount, 0)::text, 'opportunity_won', new.id::text);
    end if;
  end if;
  return new;
end;
$$;

create trigger opportunities_audit_stage_change
after update of stage on public.opportunities
for each row execute function public.audit_opportunity_stage_change();

create or replace function public.audit_event_task_done()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from 'done' and new.status = 'done' then
    insert into public.audit_logs (actor_name, action, entity_type, entity_id)
    values ('系统', 'done', 'event_task_done', new.id::text);
  end if;
  return new;
end;
$$;

create trigger event_tasks_audit_done
after update of status on public.event_tasks
for each row execute function public.audit_event_task_done();

-- ============================================================
-- 2. 失败沉淀：商机流失 / 活动任务到期未完成
-- ============================================================

create or replace function public.record_lost_opportunity_case()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.stage is distinct from 'lost' and new.stage = 'lost' then
    insert into public.failed_cases (source_type, source_id, reason, recorded_at)
    values (
      'opportunity',
      new.id::text,
      coalesce(nullif(btrim(new.lost_reason), ''), '商机已流失'),
      now()
    )
    on conflict (source_type, source_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger opportunities_record_failed_case
after update of stage on public.opportunities
for each row execute function public.record_lost_opportunity_case();

create or replace function public.record_overdue_event_task_case()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.due_date is not null
     and new.due_date < now()
     and new.status is distinct from 'done'
     and new.deleted_at is null
  then
    insert into public.failed_cases (source_type, source_id, reason, recorded_at)
    values ('event_task', new.id::text, '截止日已过未完成', now())
    on conflict (source_type, source_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger event_tasks_record_failed_case
after insert or update of due_date, status, deleted_at on public.event_tasks
for each row execute function public.record_overdue_event_task_case();

-- 兜底扫描：任务到期后无人触碰时由 cron 每天补录
create or replace function public.sweep_overdue_event_tasks()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  recorded_count integer;
begin
  insert into public.failed_cases (source_type, source_id, reason, recorded_at)
  select 'event_task', t.id::text, '截止日已过未完成', now()
  from public.event_tasks t
  where t.due_date is not null
    and t.due_date < now()
    and t.status <> 'done'
    and t.deleted_at is null
    and not exists (
      select 1 from public.failed_cases f
      where f.source_type = 'event_task' and f.source_id = t.id::text
    );
  get diagnostics recorded_count = row_count;
  return recorded_count;
end;
$$;

-- ============================================================
-- 3. 截止提醒：当日到期任务 + 当日预计成交商机
-- ============================================================

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
  insert into public.notifications (recipient_id, type, title, content, link)
  select t.assignee_id, 'deadline', '活动任务今日截止',
         '「' || t.title || '」今天截止，请及时处理。', '/market'
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

  insert into public.notifications (recipient_id, type, title, content, link)
  select o.created_by, 'deadline', '商机预计今日成交',
         '「' || o.title || '」预计今天成交，请更新跟进状态。', '/business'
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

-- ============================================================
-- 4. 每日简报生成器（cron 每天 18:00 北京时间）
-- ============================================================

create or replace function public.generate_daily_report(target_date date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_start timestamptz := target_date::timestamp at time zone 'Asia/Shanghai';
  day_end timestamptz := day_start + interval '1 day';
  report_stats jsonb;
  report_highlights text;
  report_id uuid;
begin
  report_stats := jsonb_build_object(
    'newClients', (
      select count(*) from public.clients
      where created_at >= day_start and created_at < day_end and deleted_at is null
    ),
    'newVideoIdeas', (
      select count(*) from public.video_ideas
      where created_at >= day_start and created_at < day_end and deleted_at is null
    ),
    'opportunityStageChanges', (
      select count(*) from public.audit_logs
      where entity_type = 'opportunity_stage'
        and created_at >= day_start and created_at < day_end
    ),
    'completedEventTasks', (
      select count(*) from public.audit_logs
      where entity_type = 'event_task_done'
        and created_at >= day_start and created_at < day_end
    )
  );

  report_highlights := '今日新增客户 '
    || (report_stats ->> 'newClients') || ' 个、选题 '
    || (report_stats ->> 'newVideoIdeas') || ' 条；商机阶段变化 '
    || (report_stats ->> 'opportunityStageChanges') || ' 次，完成活动任务 '
    || (report_stats ->> 'completedEventTasks') || ' 项。';

  insert into public.daily_reports (date, stats_json, highlights, generated_at)
  values (day_start, report_stats::text, report_highlights, now())
  on conflict (date) where deleted_at is null
  do update set
    stats_json = excluded.stats_json,
    highlights = excluded.highlights,
    generated_at = excluded.generated_at,
    updated_at = now()
  returning id into report_id;

  insert into public.audit_logs (actor_name, action, entity_type, entity_id)
  values ('系统', 'daily-report', 'cron_run', report_id::text);

  return report_id;
end;
$$;

-- ============================================================
-- 5. 每周对比生成器（cron 每周一 08:00 北京时间）
-- ============================================================

create or replace function public.generate_weekly_report(target_date date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  week_start_ts timestamptz := (
    target_date - (extract(isodow from target_date) - 1) * interval '1 day'
  )::timestamp at time zone 'Asia/Shanghai';
  week_end_ts timestamptz := week_start_ts + interval '7 days';
  prev_start_ts timestamptz := week_start_ts - interval '7 days';
  current_video_ideas bigint;
  previous_video_ideas bigint;
  current_won bigint;
  previous_won bigint;
  current_won_amount bigint;
  previous_won_amount bigint;
  current_events bigint;
  previous_events bigint;
  comparison jsonb;
  report_trends text;
  report_id uuid;
begin
  select count(*) into current_video_ideas
  from public.video_ideas
  where created_at >= week_start_ts and created_at < week_end_ts and deleted_at is null;

  select count(*) into previous_video_ideas
  from public.video_ideas
  where created_at >= prev_start_ts and created_at < week_start_ts and deleted_at is null;

  select count(*), coalesce(sum(
    case when action ~ '^[0-9]+$' then action::bigint else 0 end
  ), 0)
  into current_won, current_won_amount
  from public.audit_logs
  where entity_type = 'opportunity_won'
    and created_at >= week_start_ts and created_at < week_end_ts;

  select count(*), coalesce(sum(
    case when action ~ '^[0-9]+$' then action::bigint else 0 end
  ), 0)
  into previous_won, previous_won_amount
  from public.audit_logs
  where entity_type = 'opportunity_won'
    and created_at >= prev_start_ts and created_at < week_start_ts;

  select count(*) into current_events
  from public.events
  where created_at >= week_start_ts and created_at < week_end_ts and deleted_at is null;

  select count(*) into previous_events
  from public.events
  where created_at >= prev_start_ts and created_at < week_start_ts and deleted_at is null;

  comparison := jsonb_build_object(
    'current', jsonb_build_object(
      'videoIdeas', current_video_ideas,
      'wonOpportunities', current_won,
      'wonAmount', current_won_amount,
      'events', current_events
    ),
    'previous', jsonb_build_object(
      'videoIdeas', previous_video_ideas,
      'wonOpportunities', previous_won,
      'wonAmount', previous_won_amount,
      'events', previous_events
    )
  );

  report_trends := '选题 '
    || previous_video_ideas || '→' || current_video_ideas || '；成交 '
    || previous_won || '→' || current_won || '，金额 '
    || previous_won_amount || '→' || current_won_amount || '；活动 '
    || previous_events || '→' || current_events || '。';

  insert into public.weekly_reports (week_start, comparison_json, trends, generated_at)
  values (week_start_ts, comparison::text, report_trends, now())
  on conflict (week_start) where deleted_at is null
  do update set
    comparison_json = excluded.comparison_json,
    trends = excluded.trends,
    generated_at = excluded.generated_at,
    updated_at = now()
  returning id into report_id;

  insert into public.audit_logs (actor_name, action, entity_type, entity_id)
  values ('系统', 'weekly-report', 'cron_run', report_id::text);

  return report_id;
end;
$$;

-- ============================================================
-- 6. 规则校验：招商客户重要度 / 设计稿审核必须有文件
-- ============================================================

create or replace function public.enforce_sponsorship_client_level()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  client_level text;
begin
  if new.type = 'event_sponsorship' then
    select level into client_level
    from public.clients where id = new.client_id;
    if client_level is null or upper(client_level) not in ('S', 'A', 'B') then
      raise exception '活动招商只能关联重要度 B 及以上的客户';
    end if;
  end if;
  return new;
end;
$$;

create trigger opportunities_sponsorship_level_check
before insert or update of type, client_id on public.opportunities
for each row execute function public.enforce_sponsorship_client_level();

create or replace function public.enforce_design_review_file()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending_review'
     and nullif(btrim(new.file_path), '') is null
  then
    raise exception '提交设计稿审核前必须上传缩略图文件';
  end if;
  return new;
end;
$$;

create trigger design_assets_review_file_check
before insert or update of status on public.design_assets
for each row execute function public.enforce_design_review_file();

-- ============================================================
-- 7. 模板使用计数：文案模板 / 朋友圈计划
-- ============================================================

create or replace function public.bump_event_template_usage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.last_used_at is not null then
      new.usage_count := greatest(coalesce(new.usage_count, 0), 1);
    end if;
  elsif new.last_used_at is not null
        and new.last_used_at is distinct from old.last_used_at
  then
    new.usage_count := coalesce(new.usage_count, 0) + 1;
  end if;
  return new;
end;
$$;

create trigger event_templates_bump_usage
before insert or update of last_used_at on public.event_templates
for each row execute function public.bump_event_template_usage();

create or replace function public.bump_social_plan_usage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' or new.linked_opportunity_id is not null then
      new.usage_count := greatest(coalesce(new.usage_count, 0), 1);
      new.last_used_at := now();
    end if;
  elsif (old.status is distinct from 'published' and new.status = 'published')
        or (old.linked_opportunity_id is null and new.linked_opportunity_id is not null)
  then
    new.usage_count := coalesce(new.usage_count, 0) + 1;
    new.last_used_at := now();
  end if;
  return new;
end;
$$;

create trigger social_plans_bump_usage
before insert or update of status, linked_opportunity_id on public.social_plans
for each row execute function public.bump_social_plan_usage();

-- ============================================================
-- 8. 定时任务（cron 时区为 UTC，北京时间换算：08:00=00:00、18:00=10:00）
-- ============================================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'team-memory-daily-report') then
    perform cron.unschedule('team-memory-daily-report');
  end if;
end;
$$;
select cron.schedule(
  'team-memory-daily-report',
  '0 10 * * *',
  $$select public.generate_daily_report((now() at time zone 'Asia/Shanghai')::date)$$
);

do $$
begin
  if exists (select 1 from cron.job where jobname = 'team-memory-weekly-report') then
    perform cron.unschedule('team-memory-weekly-report');
  end if;
end;
$$;
select cron.schedule(
  'team-memory-weekly-report',
  '0 0 * * 1',
  $$select public.generate_weekly_report((now() at time zone 'Asia/Shanghai')::date)$$
);

do $$
begin
  if exists (select 1 from cron.job where jobname = 'team-memory-deadline-check') then
    perform cron.unschedule('team-memory-deadline-check');
  end if;
end;
$$;
select cron.schedule(
  'team-memory-deadline-check',
  '0 0 * * *',
  $$select public.run_deadline_checks()$$
);

do $$
begin
  if exists (select 1 from cron.job where jobname = 'team-memory-overdue-sweep') then
    perform cron.unschedule('team-memory-overdue-sweep');
  end if;
end;
$$;
select cron.schedule(
  'team-memory-overdue-sweep',
  '30 0 * * *',
  $$select public.sweep_overdue_event_tasks()$$
);

-- 客户端只读自动化结果，禁止直接调用生成/校验函数
revoke all on function public.audit_opportunity_stage_change() from public;
revoke all on function public.audit_event_task_done() from public;
revoke all on function public.record_lost_opportunity_case() from public;
revoke all on function public.record_overdue_event_task_case() from public;
revoke all on function public.sweep_overdue_event_tasks() from public;
revoke all on function public.run_deadline_checks() from public;
revoke all on function public.generate_daily_report(date) from public;
revoke all on function public.generate_weekly_report(date) from public;
revoke all on function public.enforce_sponsorship_client_level() from public;
revoke all on function public.enforce_design_review_file() from public;
revoke all on function public.bump_event_template_usage() from public;
revoke all on function public.bump_social_plan_usage() from public;
