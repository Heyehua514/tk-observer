-- 搜索索引门禁：验证高频模糊搜索字段使用 trigram 索引；权限：数据库测试角色。
select plan(8);

select has_extension('pg_trgm', 'pg_trgm extension is enabled for fast fuzzy search');
select has_index('public', 'creators', 'creators_search_trgm_idx', 'creators search fields have a trigram index');
select has_index('public', 'clients', 'clients_search_trgm_idx', 'clients search fields have a trigram index');
select has_index('public', 'events', 'events_search_trgm_idx', 'events search fields have a trigram index');
select has_index('public', 'opportunities', 'opportunities_search_trgm_idx', 'opportunities search fields have a trigram index');
select has_index('public', 'video_ideas', 'video_ideas_search_trgm_idx', 'video ideas search fields have a trigram index');
select has_index('public', 'companies', 'companies_search_trgm_idx', 'companies search fields have a trigram index');
select has_index('public', 'products', 'products_search_trgm_idx', 'products search fields have a trigram index');

select * from finish();
