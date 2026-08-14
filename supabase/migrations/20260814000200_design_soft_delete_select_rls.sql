-- 软删除 SELECT 策略修正（第三轮：设计工作台五表）
-- 用途：与 20260813001500（商务/市场/剪辑七表）同模式——PostgreSQL 对 UPDATE 产生的新行会应用
--       SELECT 策略可见性检查；design 等非 owner 角色对 design_assets / design_tasks /
--       design_requirements / design_references / design_deliverables 做 update({ deleted_at })
--       软删除时，新行不再满足旧策略 "deleted_at is null or owner"，RLS 返回 403。
--       本 migration 将五表 SELECT 策略放宽为按角色可见；删除行仍由前端统一 .is('deleted_at', null) 过滤。
-- 所属工作台：设计（孙铭泽）
-- 权限：owner/boss/business/design 按原角色矩阵可读（含软删除行），行级安全仍按角色收口。
drop policy if exists "design collaborators can read assets" on public.design_assets;
create policy "design collaborators can read assets" on public.design_assets
for select to authenticated
using (public.has_any_role(array['owner','boss','design']));

drop policy if exists "design collaborators can read tasks" on public.design_tasks;
create policy "design collaborators can read tasks" on public.design_tasks
for select to authenticated
using (public.has_any_role(array['owner','boss','design']));

drop policy if exists "requirement collaborators can read requirements" on public.design_requirements;
create policy "requirement collaborators can read requirements" on public.design_requirements
for select to authenticated
using (public.has_any_role(array['owner','boss','business','design']));

drop policy if exists "design can read references" on public.design_references;
create policy "design can read references" on public.design_references
for select to authenticated
using (public.has_any_role(array['owner','design']));

drop policy if exists "requirement collaborators can read deliverables" on public.design_deliverables;
create policy "requirement collaborators can read deliverables" on public.design_deliverables
for select to authenticated
using (public.has_any_role(array['owner','boss','business','design']));
