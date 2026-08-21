-- 搜索索引门禁：验证高频模糊搜索字段使用 trigram 索引；权限：数据库测试角色。
select plan(13);

select has_extension('pg_trgm', 'pg_trgm extension is enabled for fast fuzzy search');
select has_index('public', 'creators', 'creators_nickname_trgm_idx', 'creator nickname has a trigram index');
select has_index('public', 'creators', 'creators_tiktok_url_trgm_idx', 'creator url has a trigram index');
select has_index('public', 'clients', 'clients_name_trgm_idx', 'client name has a trigram index');
select has_index('public', 'clients', 'clients_company_trgm_idx', 'client company has a trigram index');
select has_index('public', 'events', 'events_name_trgm_idx', 'event name has a trigram index');
select has_index('public', 'events', 'events_theme_trgm_idx', 'event theme has a trigram index');
select has_index('public', 'opportunities', 'opportunities_title_trgm_idx', 'opportunity title has a trigram index');
select has_index('public', 'video_ideas', 'video_ideas_title_trgm_idx', 'video idea title has a trigram index');
select has_index('public', 'video_ideas', 'video_ideas_tags_trgm_idx', 'video idea tags have a trigram index');
select has_index('public', 'companies', 'companies_name_trgm_idx', 'company name has a trigram index');
select has_index('public', 'products', 'products_name_trgm_idx', 'product name has a trigram index');
select has_index('public', 'products', 'products_category_trgm_idx', 'product category has a trigram index');

select * from finish();
