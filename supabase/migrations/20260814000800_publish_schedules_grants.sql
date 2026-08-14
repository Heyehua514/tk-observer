-- 剪辑工作台：publish_schedules 表权限补齐（RLS 策略已在上一个 migration 建好，此处补表级 GRANT）。
-- 用途：authenticated 角色按 RLS 策略读写排期；owner/boss/editing 可写，business 无读权限。
-- 权限：editing 制作读写；boss/owner 监督读写。

grant select, insert, update, delete on public.publish_schedules to authenticated;
