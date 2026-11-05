begin;

select plan(10);

insert into public.videos (id, title, file_path, region) values
  ('55000000-0000-0000-0000-000000000001', '指标投影测试 A', 'videos/metrics-a.mp4', 'US'),
  ('55000000-0000-0000-0000-000000000002', '指标投影测试 B', 'videos/metrics-b.mp4', 'US');

insert into public.video_metrics_logs (
  id, video_id, views, likes, comments, shares, completion_rate,
  conversion_gmv_cents, order_count, logged_at
) values (
  '55100000-0000-0000-0000-000000000001',
  '55000000-0000-0000-0000-000000000001',
  100, 10, 2, 1, 40.00, 1200, 3, '2026-11-01T08:00:00Z'
);

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  100,
  'insert projects first metrics log to video'
);

insert into public.video_metrics_logs (
  id, video_id, views, likes, comments, shares, completion_rate,
  conversion_gmv_cents, order_count, logged_at
) values (
  '55100000-0000-0000-0000-000000000002',
  '55000000-0000-0000-0000-000000000001',
  200, 20, 4, 2, 50.00, 2400, 6, '2026-11-02T08:00:00Z'
);

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  200,
  'newest metrics log wins projection'
);

update public.video_metrics_logs
set views = 999, likes = 99
where id = '55100000-0000-0000-0000-000000000001';

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  200,
  'updating an older metrics log does not overwrite the newest projection'
);

update public.video_metrics_logs
set views = 250, likes = 25
where id = '55100000-0000-0000-0000-000000000002';

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  250,
  'updating the newest metrics log refreshes the projection'
);

update public.video_metrics_logs
set deleted_at = '2026-11-03T08:00:00Z'
where id = '55100000-0000-0000-0000-000000000002';

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  100,
  'soft deleting the newest metrics log falls back to the previous active log'
);

insert into public.video_metrics_logs (
  id, video_id, views, likes, comments, shares, completion_rate,
  conversion_gmv_cents, order_count, logged_at
) values (
  '55100000-0000-0000-0000-000000000003',
  '55000000-0000-0000-0000-000000000001',
  300, 30, 6, 3, 60.00, 3600, 9, '2026-11-03T09:00:00Z'
);

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  300,
  'insert after soft delete projects the new active log'
);

delete from public.video_metrics_logs
where id = '55100000-0000-0000-0000-000000000003';

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  100,
  'hard deleting the newest metrics log falls back to the previous active log'
);

update public.video_metrics_logs
set video_id = '55000000-0000-0000-0000-000000000002'
where id = '55100000-0000-0000-0000-000000000001';

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000001'),
  0,
  'moving the last active log clears the old video projection'
);

select is(
  (select views from public.videos where id = '55000000-0000-0000-0000-000000000002'),
  100,
  'moving an active log refreshes the new video projection'
);

delete from public.video_metrics_logs
where id = '55100000-0000-0000-0000-000000000001';

select is(
  (
    select concat_ws(
      '|', views, likes, comments, shares, completion_rate,
      conversion_gmv_cents, order_count
    )
    from public.videos
    where id = '55000000-0000-0000-0000-000000000002'
  ),
  '0|0|0|0|0.00|0|0',
  'deleting the final active metrics log resets every projected metric to zero'
);

select * from finish();
rollback;