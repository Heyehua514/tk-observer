-- 修正 ai_notes 插入策略：允许已认证成员创建，不做 owner_id 前置强校验
-- （owner_id 由前端写入；为空时仍允许，便于后续补齐）。
drop policy if exists "members can create ai notes" on public.ai_notes;
create policy "members can create ai notes" on public.ai_notes
for insert to authenticated with check (deleted_at is null);
