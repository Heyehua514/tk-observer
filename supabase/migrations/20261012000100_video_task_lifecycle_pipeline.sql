-- Migration: Video task lifecycle pipeline & auto-scheduling transition
-- Date: 2026-10-12
-- Purpose: 建立视频任务状态机流转与成片归档、发布排期之间的自动化联动闭环。
--          1. 任务制作完成 (status = 'done') 时，自动触发创建待排期发布单 (publish_schedules)。
--          2. 成片归档 (videos) 上传关联任务时，自动回写将任务状态推至 'done' 并关联发布排期成片外键。

-- 1. 扩展 public.videos 关联视频任务外键
alter table public.videos
  add column if not exists video_task_id uuid references public.video_tasks(id) on delete set null;

comment on column public.videos.video_task_id is '关联的剪辑工作台视频制作任务 ID';

create index if not exists videos_video_task_id_idx
  on public.videos (video_task_id)
  where deleted_at is null;

-- 2. 自动化触发器：视频任务标记为 done 时，自动转入发布排期
create or replace function public.sync_publish_schedule_on_video_task_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_video_id uuid;
  v_publish_time timestamptz;
begin
  -- 仅在状态流转至 done 时执行
  if new.status = 'done' and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'done') then
    -- 查找是否已有绑定的成片
    select id into v_video_id
    from public.videos
    where video_task_id = new.id and deleted_at is null
    order by created_at desc
    limit 1;

    -- 计算建议排期时间：若任务存在未来截止时间则使用，否则默认次日同一时段
    v_publish_time := coalesce(new.due_at, now() + interval '1 day');

    -- 若尚不存在该任务的有效排期单，则自动生成一条初始待排期记录
    if not exists (
      select 1 from public.publish_schedules
      where video_task_id = new.id and deleted_at is null
    ) then
      insert into public.publish_schedules (
        video_task_id,
        video_id,
        title,
        account,
        platform,
        region,
        publish_at,
        status,
        notes
      ) values (
        new.id,
        v_video_id,
        new.title,
        '跨境TK磊哥',
        '微信视频号',
        coalesce(new.region, 'US'),
        v_publish_time,
        'scheduled',
        '视频任务制作完成，系统自动转入待排期流转'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists video_tasks_on_done_schedule_sync on public.video_tasks;
create trigger video_tasks_on_done_schedule_sync
  after insert or update of status on public.video_tasks
  for each row
  execute function public.sync_publish_schedule_on_video_task_done();

-- 3. 自动化触发器：上传成片关联任务后，自动联动任务状态为 done 并补全排期 video_id
create or replace function public.sync_video_task_on_archive_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.video_task_id is not null then
    -- 自动将关联的任务推进至 done 状态
    update public.video_tasks
    set status = 'done', updated_at = now()
    where id = new.video_task_id and status <> 'done' and deleted_at is null;

    -- 若排期表中已存在该任务的排期但尚未关联具体成片，自动补全 video_id
    update public.publish_schedules
    set video_id = new.id, updated_at = now()
    where video_task_id = new.video_task_id and video_id is null and deleted_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists videos_on_archive_sync_task on public.videos;
create trigger videos_on_archive_sync_task
  after insert or update of video_task_id on public.videos
  for each row
  execute function public.sync_video_task_on_archive_created();