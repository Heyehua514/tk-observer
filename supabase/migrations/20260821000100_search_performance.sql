-- 搜索性能索引：Supabase-first；权限：沿用各业务表既有 RLS，不改变数据或权限。
-- 仅追加 pg_trgm 索引，让现有 ilike 模糊搜索在中文和短关键词下保持可用速度。
create extension if not exists pg_trgm;

create index if not exists creators_search_trgm_idx on public.creators using gin (
  lower(coalesce(nickname, '') || ' ' || coalesce(owner_name, '') || ' ' || coalesce(tiktok_url, '')) gin_trgm_ops
) where deleted_at is null;

create index if not exists clients_search_trgm_idx on public.clients using gin (
  lower(coalesce(name, '') || ' ' || coalesce(contact_name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(notes, '')) gin_trgm_ops
) where deleted_at is null;

create index if not exists events_search_trgm_idx on public.events using gin (
  lower(coalesce(name, '') || ' ' || coalesce(theme, '') || ' ' || coalesce(location_city, '')) gin_trgm_ops
) where deleted_at is null;

create index if not exists opportunities_search_trgm_idx on public.opportunities using gin (
  lower(coalesce(title, '') || ' ' || coalesce(notes, '') || ' ' || coalesce(lost_reason, '')) gin_trgm_ops
) where deleted_at is null;

create index if not exists video_ideas_search_trgm_idx on public.video_ideas using gin (
  lower(coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(tags, '')) gin_trgm_ops
) where deleted_at is null;

create index if not exists companies_search_trgm_idx on public.companies using gin (
  lower(coalesce(company_name, '') || ' ' || coalesce(contact_name, '') || ' ' || coalesce(contact_email, '')) gin_trgm_ops
) where deleted_at is null;

create index if not exists products_search_trgm_idx on public.products using gin (
  lower(coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(region, '')) gin_trgm_ops
) where deleted_at is null;
