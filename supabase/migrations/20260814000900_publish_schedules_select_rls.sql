-- 软删除 SELECT 策略修正（发布排期）
-- 用途：与 20260813001500 / 20260814000100 / 20260814000200 / 20260814000300 同模式。
--       PostgreSQL 对 UPDATE 产生的新行会应用 SELECT 策略可见性检查；editing 角色对
--       publish_schedules 执行 update({ deleted_at }) 软删除时，新行不再满足旧策略
--       "deleted_at IS NULL OR owner"，RLS 返回 403（new row violates row-level security policy）。
--       本 migration 将 SELECT 策略放宽为按角色可见（含软删除行）；
--       业务展示仍由前端 createSupabasePageQuery 统一 .is('deleted_at', null) 过滤，不影响展示语义。
-- 所属工作台：剪辑（谢洁）
-- 权限：owner/boss/editing 按原角色矩阵可读；business 仍无读取权限（排期属内部制作数据）。

drop policy if exists "editing collaborators can read publish schedules" on public.publish_schedules;
create policy "editing collaborators can read publish schedules" on public.publish_schedules
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));
