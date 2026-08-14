-- 软删除 SELECT 策略修正（第四轮：全表排查收口）
-- 用途：与 20260813001500 / 20260814000100 / 20260814000200 同模式。PostgreSQL 对 UPDATE 产生的
--       新行会应用 SELECT 策略可见性检查；任意非 owner 角色对下列软删除表执行
--       update({ deleted_at }) 时，新行不再满足旧策略 "(deleted_at IS NULL) OR owner"，
--       RLS 返回 403（new row violates row-level security policy）。
--       本 migration 将以下 20 张表的 SELECT 策略统一放宽为按角色可见（含软删除行）；
--       业务展示仍由前端查询统一 .is('deleted_at', null) 过滤，不影响展示语义。
-- 所属工作台：商务（董雨辰）/ 市场（韩素云）/ 剪辑（谢洁）/ 设计（孙铭泽）/ 总览（磊哥）
-- 权限：owner/boss/business/market/editing/design 按原角色矩阵可读；行级安全仍按角色收口。
-- 说明：audit_logs / daily_reports / failed_cases / weekly_reports 仅 owner 可写，
--       boss 只读，不存在软删除 403 风险，本轮不改。

-- ============ 商务（董雨辰） ============

-- blog_articles（公众号分析）
drop policy if exists "blog collaborators can read articles" on public.blog_articles;
create policy "blog collaborators can read articles" on public.blog_articles
for select to authenticated
using (public.has_any_role(array['owner','boss','business']));

-- ============ 剪辑（谢洁） ============

-- competitor_accounts（对标账号）
drop policy if exists "competitor collaborators can read competitor accounts" on public.competitor_accounts;
create policy "competitor collaborators can read competitor accounts" on public.competitor_accounts
for select to authenticated
using (public.has_any_role(array['owner','boss','editing','business']));

-- competitor_style_analysis（风格分析）
drop policy if exists "editing collaborators can read style analyses" on public.competitor_style_analysis;
create policy "editing collaborators can read style analyses" on public.competitor_style_analysis
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

-- competitor_videos（对标视频）
drop policy if exists "editing collaborators can read competitor videos" on public.competitor_videos;
create policy "editing collaborators can read competitor videos" on public.competitor_videos
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

-- import_history（导入历史）
drop policy if exists "editing collaborators can read import history" on public.import_history;
create policy "editing collaborators can read import history" on public.import_history
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

-- trending_topics（话题追踪）
drop policy if exists "editing collaborators can read trending topics" on public.trending_topics;
create policy "editing collaborators can read trending topics" on public.trending_topics
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

-- video_tasks（视频任务）
drop policy if exists "editing collaborators can read video tasks" on public.video_tasks;
create policy "editing collaborators can read video tasks" on public.video_tasks
for select to authenticated
using (public.has_any_role(array['owner','boss','editing']));

-- videos（视频主表，business 可读用于商单联动）
drop policy if exists "video collaborators can read videos" on public.videos;
create policy "video collaborators can read videos" on public.videos
for select to authenticated
using (public.has_any_role(array['owner','boss','editing','business']));

-- ============ 市场（韩素云） ============

-- venues（场地资源库）
drop policy if exists "market collaborators can read venues" on public.venues;
create policy "market collaborators can read venues" on public.venues
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- event_phases（活动阶段）
drop policy if exists "event coordinators can read phases" on public.event_phases;
create policy "event coordinators can read phases" on public.event_phases
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- event_tasks（活动任务）：coordinator（market）软删任务。assigned 角色策略保持原样——
-- 触发器 enforce_event_task_collaborator_update 已禁止 business/design/editing 修改 deleted_at，
-- 不存在软删除 403 路径，不放宽其 SELECT/UPDATE 策略。
drop policy if exists "event coordinators can read tasks" on public.event_tasks;
create policy "event coordinators can read tasks" on public.event_tasks
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- event_registrations（报名管理）
drop policy if exists "event coordinators can read registrations" on public.event_registrations;
create policy "event coordinators can read registrations" on public.event_registrations
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- event_sponsorships（活动招商，商务共享）
drop policy if exists "sponsorship collaborators can read sponsorships" on public.event_sponsorships;
create policy "sponsorship collaborators can read sponsorships" on public.event_sponsorships
for select to authenticated
using (public.has_any_role(array['owner','boss','market','business']));

-- event_templates（文案模板库）
drop policy if exists "market collaborators can read templates" on public.event_templates;
create policy "market collaborators can read templates" on public.event_templates
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- event_materials（物料管理，design 可读参与流转）
drop policy if exists "market collaborators can read materials" on public.event_materials;
create policy "market collaborators can read materials" on public.event_materials
for select to authenticated
using (public.has_any_role(array['owner','boss','market','design']));

-- event_finances（财务复盘）
drop policy if exists "market collaborators can read finances" on public.event_finances;
create policy "market collaborators can read finances" on public.event_finances
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- products（商品/产品）
drop policy if exists "market collaborators can read products" on public.products;
create policy "market collaborators can read products" on public.products
for select to authenticated
using (public.has_any_role(array['owner','boss','market']));

-- ============ 总览（磊哥） ============

-- gmv_metrics（GMV 指标）
drop policy if exists "boss can read gmv metrics" on public.gmv_metrics;
create policy "boss can read gmv metrics" on public.gmv_metrics
for select to authenticated
using (public.has_any_role(array['owner','boss']));

-- team_tasks（团队任务）
drop policy if exists "boss can read team tasks" on public.team_tasks;
create policy "boss can read team tasks" on public.team_tasks
for select to authenticated
using (public.has_any_role(array['owner','boss']));

-- ============ 通知（全角色） ============

-- notifications（成员标已读/删除自己的通知）
drop policy if exists "members can read own notifications" on public.notifications;
create policy "members can read own notifications" on public.notifications
for select to authenticated
using (recipient_id = auth.uid());
