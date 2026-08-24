begin;
select plan(2);
select ok(exists(
  select 1
  from pg_constraint constraint_entry
  join pg_class table_entry on table_entry.oid = constraint_entry.conrelid
  join pg_namespace schema_entry on schema_entry.oid = table_entry.relnamespace
  where schema_entry.nspname = 'public'
    and table_entry.relname = 'ai_memory'
    and constraint_entry.conname = 'ai_memory_memory_value_check'
    and constraint_entry.contype = 'c'
), 'memory value is bounded');
select ok(exists(
  select 1
  from pg_constraint constraint_entry
  join pg_class table_entry on table_entry.oid = constraint_entry.conrelid
  join pg_namespace schema_entry on schema_entry.oid = table_entry.relnamespace
  where schema_entry.nspname = 'public'
    and table_entry.relname = 'ai_memory'
    and constraint_entry.conname = 'ai_memory_confidence_check'
    and constraint_entry.contype = 'c'
), 'confidence is bounded');
select * from finish();
rollback;
