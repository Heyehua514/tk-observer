-- 软删除 SELECT 策略修正（PostgreSQL RLS 新行可见性）
-- 用途：PostgreSQL 对 UPDATE 产生的新行会应用 SELECT 策略的可见性检查；前端统一用 update({ deleted_at })
--      做软删除时，新行不再满足旧策略的 "deleted_at is null"，导致 boss/business 等非 owner 角色删除被
--      RLS 拒绝（"new row violates row-level security policy"）。本 migration 将 7 张支持软删除的业务表
--      SELECT 策略放宽为按角色可见；删除行仍由前端查询统一 .is('deleted_at', null) 过滤，业务展示不受影响。
-- 所属工作台：商务 / 市场 / 剪辑（共享基础表）
-- 权限：owner/boss/business/market/editing 按原角色矩阵可读（含软删除行），行级安全仍按角色收口。

-- clients（商务工作台）
drop policy if exists "client collaborators can read clients" on public.clients;
create policy "client collaborators can read clients" on public.clients
for select to authenticated
using (public.has_any_role(array['owner','boss','business','market']));

-- creators（商务/剪辑共享）
drop policy if exists "creator collaborators can read creators" on public.creators;
create policy "creator collaborators can read creators" on public.creators
for select to authenticated
using (public.has_any_role(array['owner','boss','business','editing']));

-- channel_orders（商务工作台）
drop policy if exists "business collaborators can read channel orders" on public.channel_orders;
create policy "business collaborators can read channel orders" on public.channel_orders
for select to authenticated
using (public.has_any_role(array['owner','boss','business']));

-- social_plans（商务工作台）
drop policy if exists "business collaborators can read social plans" on public.social_plans;
create policy "business collaborators can read social plans" on public.social_plans
for select to authenticated
using (public.has_any_role(array['owner','boss','business']));

-- companies（商务工作台）
drop policy if exists "business collaborators can read companies" on public.companies;
create policy "business collaborators can read companies" on public.companies
for select to authenticated
using (public.has_any_role(array['owner','boss','business']));

-- video_ideas（剪辑工作台）
drop policy if exists "editing collaborators can read video ideas" on public.video_ideas;
create policy "editing collaborators can read video ideas" on public.video_ideas
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

-- events（市场/总览共享）
drop policy if exists "event collaborators can read events" on public.events;
create policy "event collaborators can read events" on public.events
for select to authenticated
using (public.has_any_role(array['owner','boss','market','business']));
