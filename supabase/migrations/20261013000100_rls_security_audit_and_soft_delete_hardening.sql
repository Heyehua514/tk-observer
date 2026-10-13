-- Migration: RLS security audit, role permissions hardening & soft-delete 403 prevention
-- Date: 2026-10-13
-- Purpose: 遵循全盘质量与安全防护审计标准，消除近期新增与既有业务表中 SELECT 策略对 deleted_at 的偶合门槛，
--          彻底根除非 owner 协作成员软删除 (update deleted_at) 时遭遇 PostgreSQL RLS 403 (new row violates policy) 的缺陷隐患；
--          补齐所有新表的 PostgREST 显式权限授权，落实多角色权限矩阵收口与防穿透隔离。

-- ============================================================================
-- 1. 市场选品爆品雷达 (product_radars)
--    放宽 SELECT 策略为按角色可见（含软删除行，业务层由前端统一 .is('deleted_at', null) 过滤）；
--    赋予 boss/market 完整的管理与软删除权限。
-- ============================================================================
drop policy if exists "market and boss can read product radars" on public.product_radars;
create policy "market and boss can read product radars" on public.product_radars
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

drop policy if exists "market can manage product radars" on public.product_radars;
create policy "market can manage product radars" on public.product_radars
for all to authenticated
using (public.has_any_role(array['owner','boss','market']))
with check (public.has_any_role(array['owner','boss','market']));

-- ============================================================================
-- 2. 达人 CRM 跟进记录 (creator_follow_ups)
--    放宽 SELECT 策略为按角色可见，避免商务 (business) 软删除跟进日志时被 RLS 拦截。
-- ============================================================================
drop policy if exists "creator collaborators can read follow ups" on public.creator_follow_ups;
create policy "creator collaborators can read follow ups" on public.creator_follow_ups
for select to authenticated
using (public.has_any_role(array['owner','boss','business','editing']));

-- ============================================================================
-- 3. 视频成片数据表现回流打卡 (video_metrics_logs)
--    放宽 SELECT 策略为按角色可见，避免剪辑 (editing) 软删除数据打卡日志时被 RLS 拦截。
-- ============================================================================
drop policy if exists "video collaborators can read metrics logs" on public.video_metrics_logs;
create policy "video collaborators can read metrics logs" on public.video_metrics_logs
for select to authenticated
using (public.has_any_role(array['owner','boss','editing','business']));

-- ============================================================================
-- 4. 视频矩阵账号与导入策略 (video_accounts, video_ideas, import_history)
--    移除 SELECT 策略中的 deleted_at 限制，支持剪辑与数据导入者维护和软删除。
-- ============================================================================
drop policy if exists "editing collaborators can read video accounts" on public.video_accounts;
create policy "editing collaborators can read video accounts" on public.video_accounts
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

drop policy if exists "video data importers can read video accounts" on public.video_accounts;
create policy "video data importers can read video accounts" on public.video_accounts
for select to authenticated
using (public.can_manage_video_data());

drop policy if exists "video data importers can read video ideas" on public.video_ideas;
create policy "video data importers can read video ideas" on public.video_ideas
for select to authenticated
using (public.can_manage_video_data());

drop policy if exists "video data importers can read import history" on public.import_history;
create policy "video data importers can read import history" on public.import_history
for select to authenticated
using (public.can_manage_video_data());

-- ============================================================================
-- 5. 情报中心、AI 记忆、便签与状态流转历史 (intelligence_items, ai_memory, ai_notes, status_history)
--    消除软删除门槛，保障成员安全更新与删除个人工作产物。
-- ============================================================================
drop policy if exists "members can read active intelligence" on public.intelligence_items;
create policy "members can read active intelligence" on public.intelligence_items
for select to authenticated
using (public.current_user_status() = 'active');

drop policy if exists "members can read own ai memory" on public.ai_memory;
create policy "members can read own ai memory" on public.ai_memory
for select to authenticated
using (owner_id = auth.uid());

drop policy if exists "active members can read ai notes" on public.ai_notes;
create policy "active members can read ai notes" on public.ai_notes
for select to authenticated
using (
  public.has_any_role(array['owner','boss'])
  or owner_id = auth.uid()
);

drop policy if exists "active members can read status history" on public.status_history;
create policy "active members can read status history" on public.status_history
for select to authenticated
using (public.current_user_status() = 'active');

-- ============================================================================
-- 6. 全局表级 CRUD 与 Sequence 权限刷新
--    保障 PostgREST 在多角色切换下对所有 public 表具备合法授权，杜绝无权限降级。
-- ============================================================================
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;
