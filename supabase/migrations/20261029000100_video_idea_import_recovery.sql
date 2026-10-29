-- Supabase 选题 CSV 原子导入、失败行审计与整批撤销。
-- 权限：owner/boss/editing；浏览器只调用 RPC，不能直接伪造导入历史或变更记录。

alter table public.import_history
  add column status text not null default 'completed'
    check (status in ('completed', 'rolled_back')),
  add column skipped_count integer not null default 0
    check (skipped_count >= 0),
  add column failure_count integer not null default 0
    check (failure_count >= 0),
  add column rolled_back_at timestamptz,
  add column rolled_back_by uuid references public.profiles(id) on delete set null,
  add constraint import_history_counts_within_total check (
    new_count + updated_count + skipped_count + failure_count <= total_rows
  ),
  add constraint import_history_rollback_state check (
    (status = 'completed' and rolled_back_at is null and rolled_back_by is null)
    or (status = 'rolled_back' and rolled_back_at is not null)
  );

create index import_history_status_imported_idx
  on public.import_history (status, imported_at desc)
  where deleted_at is null;

create table public.video_idea_import_changes (
  id uuid primary key default gen_random_uuid(),
  import_history_id uuid not null
    references public.import_history(id) on delete cascade
    deferrable initially deferred,
  video_idea_id uuid references public.video_ideas(id) on delete set null,
  row_number integer not null check (row_number > 0),
  operation text not null check (operation in ('insert', 'update')),
  before_data jsonb,
  after_data jsonb not null,
  created_at timestamptz not null default now(),
  constraint video_idea_import_changes_row_key unique (import_history_id, row_number),
  constraint video_idea_import_changes_data_check check (
    (operation = 'insert' and before_data is null)
    or (operation = 'update' and before_data is not null)
  )
);

create index video_idea_import_changes_history_idx
  on public.video_idea_import_changes (import_history_id, row_number);
create index video_idea_import_changes_video_idx
  on public.video_idea_import_changes (video_idea_id)
  where video_idea_id is not null;

alter table public.video_idea_import_changes enable row level security;

create policy "editing collaborators can read video idea import changes"
  on public.video_idea_import_changes for select to authenticated
  using (public.can_manage_video_data());

create or replace function public.enforce_import_history_immutable()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if row(
    new.id, new.legacy_id, new.imported_at, new.file_name, new.total_rows,
    new.new_count, new.updated_count, new.skipped_count, new.failure_count,
    new.snapshot, new.created_at
  ) is distinct from row(
    old.id, old.legacy_id, old.imported_at, old.file_name, old.total_rows,
    old.new_count, old.updated_count, old.skipped_count, old.failure_count,
    old.snapshot, old.created_at
  ) then
    raise exception using errcode = '42501', message = 'import history is immutable';
  end if;
  if old.status = 'rolled_back' and new.status is distinct from old.status then
    raise exception using errcode = '42501', message = 'rolled back import history is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.import_video_ideas(
  p_file_name text,
  p_rows jsonb,
  p_total_rows integer,
  p_skipped_count integer default 0,
  p_failure_count integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_import_id uuid := gen_random_uuid();
  v_history public.import_history%rowtype;
  v_existing public.video_ideas%rowtype;
  v_after public.video_ideas%rowtype;
  v_before jsonb;
  v_row record;
  v_payload_count integer;
  v_distinct_count integer;
  v_new_count integer := 0;
  v_updated_count integer := 0;
  v_change_count integer;
  v_row_number integer := 0;
  v_snapshot jsonb;
begin
  if not public.can_manage_video_data() then
    raise exception using errcode = '42501', message = 'video data importer capability required to import video ideas';
  end if;
  if p_file_name is null or char_length(btrim(p_file_name)) not between 1 and 240 then
    raise exception using errcode = '22023', message = 'file name must contain 1 to 240 characters';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'rows must be a JSON array';
  end if;
  if p_total_rows is null or p_total_rows < 1 or p_total_rows > 5000 then
    raise exception using errcode = '22023', message = 'total rows must be between 1 and 5000';
  end if;
  if coalesce(p_skipped_count, -1) < 0 or coalesce(p_failure_count, -1) < 0 then
    raise exception using errcode = '22023', message = 'skipped and failure counts must be non-negative';
  end if;

  select count(*), count(distinct (btrim(x.title), x.publish_date))
    into v_payload_count, v_distinct_count
  from jsonb_to_recordset(p_rows) as x(
    account text,
    video_type text,
    title text,
    description text,
    source_url text,
    tags text,
    publish_date timestamptz,
    views bigint,
    likes bigint,
    comments bigint,
    shares bigint,
    completion_rate integer,
    follower_gain bigint
  );

  if v_payload_count = 0 then
    raise exception using errcode = '22023', message = 'rows must contain at least one valid record';
  end if;
  if v_payload_count <> v_distinct_count then
    raise exception using errcode = '22023', message = 'rows contain duplicate title and publish date';
  end if;
  if p_total_rows <> v_payload_count + p_skipped_count + p_failure_count then
    raise exception using errcode = '22023', message = 'row counts do not match';
  end if;

  perform pg_advisory_xact_lock(hashtext('video_idea_import')::bigint);

  for v_row in
    select
      x.account,
      x.video_type,
      btrim(x.title) as title,
      nullif(btrim(coalesce(x.description, '')), '') as description,
      nullif(btrim(coalesce(x.source_url, '')), '') as source_url,
      nullif(btrim(coalesce(x.tags, '')), '') as tags,
      x.publish_date,
      coalesce(x.views, 0) as views,
      coalesce(x.likes, 0) as likes,
      coalesce(x.comments, 0) as comments,
      coalesce(x.shares, 0) as shares,
      coalesce(x.completion_rate, 0) as completion_rate,
      coalesce(x.follower_gain, 0) as follower_gain
    from jsonb_to_recordset(p_rows) as x(
      account text,
      video_type text,
      title text,
      description text,
      source_url text,
      tags text,
      publish_date timestamptz,
      views bigint,
      likes bigint,
      comments bigint,
      shares bigint,
      completion_rate integer,
      follower_gain bigint
    )
  loop
    v_row_number := v_row_number + 1;

    select *
      into v_existing
    from public.video_ideas
    where title = v_row.title
      and publish_date = v_row.publish_date
    for update;

    if found and v_existing.deleted_at is not null then
      raise exception using
        errcode = '23505',
        message = format('row %s conflicts with a soft-deleted video idea', v_row_number);
    elsif found then
      v_before := to_jsonb(v_existing);
      update public.video_ideas
      set
        account = v_row.account,
        video_type = v_row.video_type,
        description = v_row.description,
        source_url = v_row.source_url,
        tags = v_row.tags,
        views = v_row.views,
        likes = v_row.likes,
        comments = v_row.comments,
        shares = v_row.shares,
        completion_rate = v_row.completion_rate,
        follower_gain = v_row.follower_gain,
        ai_analysis = null,
        analyzed_at = null,
        updated_at = now()
      where id = v_existing.id
      returning * into v_after;

      insert into public.video_idea_import_changes (
        import_history_id, video_idea_id, row_number, operation, before_data, after_data
      ) values (
        v_import_id, v_after.id, v_row_number, 'update', v_before, to_jsonb(v_after)
      );
      v_updated_count := v_updated_count + 1;
    else
      insert into public.video_ideas (
        account, video_type, title, description, source_url, tags, publish_date,
        views, likes, comments, shares, completion_rate, follower_gain
      ) values (
        v_row.account, v_row.video_type, v_row.title, v_row.description,
        v_row.source_url, v_row.tags, v_row.publish_date, v_row.views, v_row.likes,
        v_row.comments, v_row.shares, v_row.completion_rate, v_row.follower_gain
      )
      returning * into v_after;

      insert into public.video_idea_import_changes (
        import_history_id, video_idea_id, row_number, operation, before_data, after_data
      ) values (
        v_import_id, v_after.id, v_row_number, 'insert', null, to_jsonb(v_after)
      );
      v_new_count := v_new_count + 1;
    end if;
  end loop;

  update public.video_idea_import_changes c
  set after_data = to_jsonb(v)
  from public.video_ideas v
  where c.import_history_id = v_import_id
    and c.video_idea_id = v.id;

  select jsonb_build_object(
    'totalVideos', count(*),
    'monthlyNew', count(*) filter (
      where date_trunc('month', created_at) = date_trunc('month', now())
    ),
    'viralCount', count(*) filter (where is_viral),
    'viralRate', coalesce(
      100.0 * count(*) filter (where is_viral) / nullif(count(*), 0),
      0
    ),
    'averageCompletionRate', coalesce(avg(completion_rate), 0),
    'averageViews', coalesce(avg(views), 0),
    'totalFollowerGain', coalesce(sum(follower_gain), 0)
  )
  into v_snapshot
  from public.video_ideas
  where deleted_at is null;

  insert into public.import_history (
    id, imported_at, file_name, total_rows, new_count, updated_count,
    skipped_count, failure_count, snapshot, status
  ) values (
    v_import_id, now(), btrim(p_file_name), p_total_rows, v_new_count, v_updated_count,
    p_skipped_count, p_failure_count, v_snapshot, 'completed'
  )
  returning * into v_history;

  return to_jsonb(v_history);
end;
$$;

create or replace function public.rollback_video_idea_import(target_import_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_history public.import_history%rowtype;
  v_change public.video_idea_import_changes%rowtype;
  v_change_count integer;
  v_current public.video_ideas%rowtype;
  v_deleted_count integer := 0;
  v_restored_count integer := 0;
begin
  if not public.can_manage_video_data() then
    raise exception using errcode = '42501', message = 'video data importer capability required to rollback an import';
  end if;

  perform pg_advisory_xact_lock(hashtext('video_idea_import')::bigint);

  select *
    into v_history
  from public.import_history
  where id = target_import_id
  for update;

  if not found or v_history.deleted_at is not null then
    raise exception using errcode = 'P0002', message = 'import history not found';
  end if;
  if v_history.status <> 'completed' then
    raise exception using errcode = '22023', message = 'import history is not rollback eligible';
  end if;

  select count(*)
    into v_change_count
  from public.video_idea_import_changes
  where import_history_id = target_import_id;

  if v_change_count = 0
     or v_change_count <> v_history.new_count + v_history.updated_count then
    raise exception using
      errcode = '22023',
      message = 'import history has no complete rollback snapshots';
  end if;

  -- Verify the complete batch before mutating anything. Derived viral flags can
  -- change while restoring sibling rows, so all conflict checks must run first.
  for v_change in
    select *
    from public.video_idea_import_changes
    where import_history_id = target_import_id
    order by row_number desc
  loop
    select *
      into v_current
    from public.video_ideas
    where id = v_change.video_idea_id
    for update;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = format('cannot rollback import row %s because the video idea no longer exists', v_change.row_number);
    end if;

    if to_jsonb(v_current) is distinct from v_change.after_data then
      raise exception using
        errcode = '40001',
        message = format('cannot rollback import row %s because the video idea changed after import', v_change.row_number);
    end if;
  end loop;

  for v_change in
    select *
    from public.video_idea_import_changes
    where import_history_id = target_import_id
    order by row_number desc
  loop
    if v_change.operation = 'insert' then
      delete from public.video_ideas where id = v_change.video_idea_id;
      if found then
        v_deleted_count := v_deleted_count + 1;
      end if;
    else
      update public.video_ideas
      set
        account = v_change.before_data->>'account',
        video_type = v_change.before_data->>'video_type',
        title = v_change.before_data->>'title',
        description = v_change.before_data->>'description',
        source_url = v_change.before_data->>'source_url',
        tags = v_change.before_data->>'tags',
        publish_date = (v_change.before_data->>'publish_date')::timestamptz,
        views = (v_change.before_data->>'views')::bigint,
        likes = (v_change.before_data->>'likes')::bigint,
        comments = (v_change.before_data->>'comments')::bigint,
        shares = (v_change.before_data->>'shares')::bigint,
        completion_rate = (v_change.before_data->>'completion_rate')::integer,
        follower_gain = (v_change.before_data->>'follower_gain')::bigint,
        is_viral = (v_change.before_data->>'is_viral')::boolean,
        ai_analysis = v_change.before_data->>'ai_analysis',
        analyzed_at = (v_change.before_data->>'analyzed_at')::timestamptz,
        deleted_at = (v_change.before_data->>'deleted_at')::timestamptz,
        updated_at = now()
      where id = v_change.video_idea_id;
      v_restored_count := v_restored_count + 1;
    end if;
  end loop;

  update public.import_history
  set
    status = 'rolled_back',
    rolled_back_at = now(),
    rolled_back_by = auth.uid(),
    updated_at = now()
  where id = target_import_id
    and status = 'completed';

  if not found then
    raise exception using errcode = '40001', message = 'import history changed during rollback';
  end if;

  return jsonb_build_object(
    'importId', target_import_id,
    'deletedCount', v_deleted_count,
    'restoredCount', v_restored_count
  );
end;
$$;
revoke all on function public.enforce_import_history_immutable() from public;
grant execute on function public.enforce_import_history_immutable() to authenticated;
revoke all on function public.import_video_ideas(text, jsonb, integer, integer, integer) from public;
grant execute on function public.import_video_ideas(text, jsonb, integer, integer, integer) to authenticated;
revoke all on function public.rollback_video_idea_import(uuid) from public;
grant execute on function public.rollback_video_idea_import(uuid) to authenticated;

revoke insert, update, delete on public.import_history from authenticated;
grant select on public.import_history to authenticated;
grant select on public.video_idea_import_changes to authenticated;