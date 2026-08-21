begin;
select plan(7);
select has_table('public', 'ai_memory', 'ai memory table exists');
select has_column('public', 'ai_memory', 'owner_id', 'memory owner exists');
select has_column('public', 'ai_memory', 'memory_value', 'memory value exists');
select col_is_pk('public', 'ai_memory', 'id', 'memory id is primary key');
select policies_are('public', 'ai_memory', array[
  'members can read own ai memory',
  'members can create own ai memory',
  'members can update own ai memory'
], 'memory policies are owner scoped');
select has_index('public', 'ai_memory_owner_recent_idx', 'memory recent index exists');
select * from finish();
rollback;
