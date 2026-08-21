-- 搜索索引修正：Supabase-first；权限：沿用各业务表既有 RLS，不改变数据。
-- 现有查询按单列 ilike 过滤，独立列索引比拼接表达式更容易命中。
drop index if exists public.creators_search_trgm_idx;
drop index if exists public.clients_search_trgm_idx;
drop index if exists public.events_search_trgm_idx;
drop index if exists public.opportunities_search_trgm_idx;
drop index if exists public.video_ideas_search_trgm_idx;
drop index if exists public.companies_search_trgm_idx;
drop index if exists public.products_search_trgm_idx;

create index if not exists creators_nickname_trgm_idx on public.creators using gin (nickname gin_trgm_ops) where deleted_at is null;
create index if not exists creators_tiktok_url_trgm_idx on public.creators using gin (tiktok_url gin_trgm_ops) where deleted_at is null;
create index if not exists clients_name_trgm_idx on public.clients using gin (name gin_trgm_ops) where deleted_at is null;
create index if not exists clients_company_trgm_idx on public.clients using gin (company gin_trgm_ops) where deleted_at is null;
create index if not exists events_name_trgm_idx on public.events using gin (name gin_trgm_ops) where deleted_at is null;
create index if not exists events_theme_trgm_idx on public.events using gin (theme gin_trgm_ops) where deleted_at is null;
create index if not exists opportunities_title_trgm_idx on public.opportunities using gin (title gin_trgm_ops) where deleted_at is null;
create index if not exists video_ideas_title_trgm_idx on public.video_ideas using gin (title gin_trgm_ops) where deleted_at is null;
create index if not exists video_ideas_tags_trgm_idx on public.video_ideas using gin (tags gin_trgm_ops) where deleted_at is null;
create index if not exists companies_name_trgm_idx on public.companies using gin (company_name gin_trgm_ops) where deleted_at is null;
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops) where deleted_at is null;
create index if not exists products_category_trgm_idx on public.products using gin (category gin_trgm_ops) where deleted_at is null;
