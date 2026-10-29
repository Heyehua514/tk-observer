begin;
select plan(27);

select has_table('public', 'video_idea_import_changes', 'video idea import changes table exists');
select has_function('public', 'import_video_ideas', 'atomic video idea import RPC exists');
select has_function('public', 'rollback_video_idea_import', 'video idea import rollback RPC exists');
select has_column('public', 'import_history', 'status', 'import history stores status');
select has_column('public', 'import_history', 'skipped_count', 'import history stores skipped rows');
select has_column('public', 'import_history', 'failure_count', 'import history stores failed rows');
select has_column('public', 'import_history', 'rolled_back_at', 'import history stores rollback time');
select col_is_fk('public', 'video_idea_import_changes', 'import_history_id', 'changes reference import history');
select policies_are('public', 'video_idea_import_changes', array[
  'editing collaborators can read video idea import changes'
], 'import change audit is scoped to video data managers');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '63000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'import-recovery@example.test', '',
  now(), '{}', '{"name":"Import Recovery"}', now(), now()
);

update public.profiles
set status = 'active', role = 'editing'
where id = '63000000-0000-0000-0000-000000000001';

insert into public.import_history (
  id, imported_at, file_name, total_rows, new_count, updated_count, snapshot
) values (
  '61000000-0000-0000-0000-000000000099', now(), 'legacy.csv', 1, 1, 0, '{}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"63000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select throws_ok($$
  insert into public.import_history (
    imported_at, file_name, total_rows, new_count, snapshot
  ) values (now(), 'forged.csv', 1, 1, '{}'::jsonb)
$$, '42501', 'permission denied for table import_history', 'authenticated cannot forge import history');

insert into public.video_ideas (
  account, video_type, title, publish_date, views, completion_rate
) values (
  '跨境TK磊哥', '口播', '恢复前选题', '2026-08-24T00:00:00Z', 100, 40
);

select lives_ok($$
  select public.import_video_ideas(
    'recovery.csv',
    '[
      {"account":"跨境TK磊哥","video_type":"口播","title":"恢复前选题","publish_date":"2026-08-24T00:00:00Z","views":200,"completion_rate":60},
      {"account":"跨境TK磊哥","video_type":"口播","title":"新增后选题","publish_date":"2026-08-25T00:00:00Z","views":300,"completion_rate":70}
    ]'::jsonb,
    2,
    0,
    0
  )
$$, 'editing can atomically import updates and inserts');

select is(
  (select count(*) from public.import_history where file_name = 'recovery.csv'),
  1::bigint,
  'one import history row is created'
);
select is(
  (select new_count from public.import_history where file_name = 'recovery.csv'),
  1,
  'import history records one insert'
);
select is(
  (select updated_count from public.import_history where file_name = 'recovery.csv'),
  1,
  'import history records one update'
);
select is(
  (
    select count(*)
    from public.video_idea_import_changes c
    join public.import_history h on h.id = c.import_history_id
    where h.file_name = 'recovery.csv'
  ),
  2::bigint,
  'one before and after change snapshot exists per imported row'
);
select ok(
  (
    select bool_and(after_data ? 'is_viral')
    from public.video_idea_import_changes c
    join public.import_history h on h.id = c.import_history_id
    where h.file_name = 'recovery.csv'
  ),
  'after data includes trigger-derived is_viral'
);

select throws_ok($$
  select public.rollback_video_idea_import(
    '61000000-0000-0000-0000-000000000099'
  )
$$, '22023', 'import history has no complete rollback snapshots', 'legacy import without snapshots cannot be rolled back');
select is(
  (
    select status
    from public.import_history
    where id = '61000000-0000-0000-0000-000000000099'
  ),
  'completed',
  'failed rollback leaves legacy import status unchanged'
);

select lives_ok($$
  select public.rollback_video_idea_import((
    select id from public.import_history where file_name = 'recovery.csv'
  ))
$$, 'editing can rollback the complete import batch');

select is(
  (
    select status
    from public.import_history
    where file_name = 'recovery.csv'
  ),
  'rolled_back',
  'rollback marks import history as rolled back'
);
select is(
  (
    select views
    from public.video_ideas
    where title = '恢复前选题'
  ),
  100::bigint,
  'rollback restores updated row metrics'
);
select is(
  (select count(*) from public.video_ideas where title = '新增后选题'),
  0::bigint,
  'rollback removes inserted rows'
);

select lives_ok($$
  select public.import_video_ideas(
    'conflict.csv',
    '[{"account":"跨境TK磊哥","video_type":"口播","title":"冲突测试选题","publish_date":"2026-08-26T00:00:00Z","views":400,"completion_rate":80}]'::jsonb,
    1,
    0,
    0
  )
$$, 'conflict fixture imports successfully');

update public.video_ideas
set views = 999
where title = '冲突测试选题';

select throws_ok($$
  select public.rollback_video_idea_import((
    select id from public.import_history where file_name = 'conflict.csv'
  ))
$$, '40001', 'cannot rollback import row 1 because the video idea changed after import', 'rollback fails closed after post-import changes');

select throws_ok($$
  select public.import_video_ideas(
    'atomic.csv',
    '[
      {"account":"跨境TK磊哥","video_type":"口播","title":"原子测试选题","publish_date":"2026-08-27T00:00:00Z","views":1,"completion_rate":10},
      {"account":"跨境TK磊哥","video_type":"口播","title":" 原子测试选题 ","publish_date":"2026-08-27T00:00:00Z","views":2,"completion_rate":20}
    ]'::jsonb,
    2,
    0,
    0
  )
$$, '22023', 'rows contain duplicate title and publish date', 'duplicate payload is rejected before mutation');
select is(
  (select count(*) from public.import_history where file_name = 'atomic.csv'),
  0::bigint,
  'failed atomic import writes no history'
);
select is(
  (select count(*) from public.video_ideas where title = '原子测试选题'),
  0::bigint,
  'failed atomic import writes no video idea'
);

select * from finish();
rollback;