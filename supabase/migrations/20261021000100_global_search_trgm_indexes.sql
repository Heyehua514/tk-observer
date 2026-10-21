-- 全局搜索 pg_trgm 扩展索引优化：覆盖视频库、对标账号、避坑案例与AI记忆库
-- 沿用既有 RLS 策略，纯性能加速索引，无权限变动。

create extension if not exists pg_trgm;

-- 1. 视频库 (videos) 模糊检索加速
create index if not exists videos_title_trgm_idx on public.videos using gin (title gin_trgm_ops) where deleted_at is null;
create index if not exists videos_creator_name_trgm_idx on public.videos using gin (creator_name gin_trgm_ops) where deleted_at is null;
create index if not exists videos_product_name_trgm_idx on public.videos using gin (product_name gin_trgm_ops) where deleted_at is null;

-- 2. 对标账号 (competitor_accounts) 模糊检索加速
create index if not exists competitor_accounts_name_trgm_idx on public.competitor_accounts using gin (name gin_trgm_ops) where deleted_at is null;
create index if not exists competitor_accounts_platform_trgm_idx on public.competitor_accounts using gin (platform gin_trgm_ops) where deleted_at is null;

-- 3. 避坑案例 (failed_cases) 知识检索加速
create index if not exists failed_cases_title_trgm_idx on public.failed_cases using gin (case_title gin_trgm_ops) where deleted_at is null;
create index if not exists failed_cases_reason_trgm_idx on public.failed_cases using gin (reason gin_trgm_ops) where deleted_at is null;
create index if not exists failed_cases_dept_trgm_idx on public.failed_cases using gin (department gin_trgm_ops) where deleted_at is null;

-- 4. AI 记忆库 (ai_memory) 检索加速
create index if not exists ai_memory_key_trgm_idx on public.ai_memory using gin (memory_key gin_trgm_ops) where deleted_at is null;
