begin;
select plan(3);

select ok(exists(
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'intelligence_items'
    and policyname = 'members can read active intelligence'
), 'active members have read policy');
select ok(exists(
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'intelligence_items'
    and policyname = 'members can create own intelligence'
), 'members create only own intelligence');
select ok(exists(
  select 1 from pg_policies
  where schemaname = 'public' and tablename = 'intelligence_items'
    and policyname = 'members can update own intelligence'
), 'members update only own intelligence');
rollback;
