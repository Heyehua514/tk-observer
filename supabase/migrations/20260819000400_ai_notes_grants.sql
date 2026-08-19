-- 明确 ai_notes 基础写入权限（表级 GRANT）
grant select, insert, update, delete on public.ai_notes to authenticated;
