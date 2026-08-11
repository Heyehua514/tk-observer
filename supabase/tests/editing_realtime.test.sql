begin;
select plan(3);

select is(
  (
    select count(*)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = any(array[
        'video_tasks','videos','video_ideas','import_history',
        'competitor_accounts','competitor_videos','trending_topics','competitor_style_analysis'
      ])
  ),
  8::bigint,
  'all editing core tables are published to Realtime'
);

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'video_tasks','videos','video_ideas','import_history',
        'competitor_accounts','competitor_videos','trending_topics','competitor_style_analysis'
      ])
      and c.relreplident = 'f'
  ),
  8::bigint,
  'all editing core tables expose full old rows to Realtime'
);

select is(
  (
    select count(*)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = any(array[
        'video_idea_summary','video_idea_account_stats',
        'video_idea_type_stats','video_idea_viral_features'
      ])
  ),
  0::bigint,
  'editing analytics views are not published to Realtime'
);

select * from finish();
rollback;
