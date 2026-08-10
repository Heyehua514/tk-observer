begin;
select plan(3);

select is(
  (
    select count(*)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = any(array[
        'creators','clients','opportunities','channel_orders','social_plans',
        'events','event_phases','event_tasks','event_registrations','event_sponsorships'
      ])
  ),
  10::bigint,
  'all market and business core tables are published to Realtime'
);

select is(
  (
    select count(*)
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename not in (
        'creators','clients','opportunities','channel_orders','social_plans',
        'events','event_phases','event_tasks','event_registrations','event_sponsorships'
      )
  ),
  0::bigint,
  'core Realtime test has no unexpected public tables'
);

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'creators','clients','opportunities','channel_orders','social_plans',
        'events','event_phases','event_tasks','event_registrations','event_sponsorships'
      ])
      and c.relreplident = 'f'
  ),
  10::bigint,
  'all market and business core tables expose full old rows to Realtime'
);

select * from finish();
rollback;
