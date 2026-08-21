-- 搜索索引评估：确认索引只覆盖未软删除数据；权限：数据库测试角色。
select plan(2);

select isnt_empty($$select indexdef from pg_indexes where schemaname = 'public' and indexname = 'creators_search_trgm_idx' and indexdef like '%deleted_at IS NULL%'$$, 'creator index excludes soft-deleted rows');
select isnt_empty($$select indexdef from pg_indexes where schemaname = 'public' and indexname = 'events_search_trgm_idx' and indexdef like '%deleted_at IS NULL%'$$, 'event index excludes soft-deleted rows');

select * from finish();
