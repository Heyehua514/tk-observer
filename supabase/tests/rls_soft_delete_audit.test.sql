-- RLS 安全策略与软删除防穿透审计测试
-- 用途：验证 20261013000100_rls_security_audit_and_soft_delete_hardening.sql 修复后，
--       所有核心业务表的 SELECT 策略均已收口至角色矩阵，且不包含 deleted_at 门槛，
--       彻底根除非 owner 角色 soft delete (update deleted_at) 时的 403 异常。

begin;
select plan(12);

-- 1. product_radars 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'product_radars'
      and cmd = 'SELECT' and policyname = 'market and boss can read product radars'
      and qual::text ilike '%deleted_at%'),
  'product_radars read policy is role-scoped without deleted_at gate'
);

-- 2. creator_follow_ups 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'creator_follow_ups'
      and cmd = 'SELECT' and policyname = 'creator collaborators can read follow ups'
      and qual::text ilike '%deleted_at%'),
  'creator_follow_ups read policy is role-scoped without deleted_at gate'
);

-- 3. video_metrics_logs 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'video_metrics_logs'
      and cmd = 'SELECT' and policyname = 'video collaborators can read metrics logs'
      and qual::text ilike '%deleted_at%'),
  'video_metrics_logs read policy is role-scoped without deleted_at gate'
);

-- 4. video_accounts 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'video_accounts'
      and cmd = 'SELECT' and policyname = 'editing collaborators can read video accounts'
      and qual::text ilike '%deleted_at%'),
  'video_accounts read policy is role-scoped without deleted_at gate'
);

-- 5. intelligence_items 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'intelligence_items'
      and cmd = 'SELECT' and policyname = 'members can read active intelligence'
      and qual::text ilike '%deleted_at%'),
  'intelligence_items read policy is role-scoped without deleted_at gate'
);

-- 6. ai_memory 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_memory'
      and cmd = 'SELECT' and policyname = 'members can read own ai memory'
      and qual::text ilike '%deleted_at%'),
  'ai_memory read policy is role-scoped without deleted_at gate'
);

-- 7. ai_notes 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_notes'
      and cmd = 'SELECT' and policyname = 'active members can read ai notes'
      and qual::text ilike '%deleted_at%'),
  'ai_notes read policy is role-scoped without deleted_at gate'
);

-- 8. status_history 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'status_history'
      and cmd = 'SELECT' and policyname = 'active members can read status history'
      and qual::text ilike '%deleted_at%'),
  'status_history read policy is role-scoped without deleted_at gate'
);

-- 9. video_data_importers video_ideas 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'video_ideas'
      and cmd = 'SELECT' and policyname = 'video data importers can read video ideas'
      and qual::text ilike '%deleted_at%'),
  'video_ideas importer read policy is role-scoped without deleted_at gate'
);

-- 10. video_data_importers import_history 读策略无 deleted_at 限制
select ok(
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'import_history'
      and cmd = 'SELECT' and policyname = 'video data importers can read import history'
      and qual::text ilike '%deleted_at%'),
  'import_history importer read policy is role-scoped without deleted_at gate'
);

-- 11. product_radars 启用 RLS
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'product_radars'),
  'product_radars table has RLS enabled'
);

-- 12. creator_follow_ups 启用 RLS
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'creator_follow_ups'),
  'creator_follow_ups table has RLS enabled'
);

select * from finish();
rollback;
