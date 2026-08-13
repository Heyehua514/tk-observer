-- 客户删除策略对齐前端 CRUD（商务工作台）
-- 用途：clients 新增/编辑允许 owner/boss/business，删除却仅限 owner，导致商务/老板在前端点删除被 RLS 拒绝。
-- 所属工作台：商务
-- 权限：owner/boss/business 可硬删除客户（与 create/update 权限对齐）。
drop policy if exists "owners can hard delete clients" on public.clients;
create policy "owners and business can hard delete clients" on public.clients
for delete to authenticated
using (public.has_any_role(array['owner','boss','business']));
