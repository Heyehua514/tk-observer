-- 软删除 SELECT 策略修正（第二轮：商机）
-- 用途：PostgreSQL 对 UPDATE 产生的新行会应用 SELECT 策略可见性检查；business 角色对商机做
--       update({ deleted_at }) 软删除时，新行不再满足旧策略 "deleted_at is null or owner"，
--       RLS 返回 403（new row violates row-level security policy）。与 20260813001500 的 7 张表
--       同模式：SELECT 策略放宽为按角色可见，业务展示仍由前端统一 .is('deleted_at', null) 过滤。
-- 所属工作台：商务（董雨辰）/ 总览（磊哥）
-- 权限：owner/boss/business 按原角色矩阵可读（含软删除行）；E2E 清理商机测试数据依赖此修复。
drop policy if exists "business collaborators can read opportunities" on public.opportunities;
create policy "business collaborators can read opportunities" on public.opportunities
for select to authenticated
using (public.has_any_role(array['owner','boss','business']));
