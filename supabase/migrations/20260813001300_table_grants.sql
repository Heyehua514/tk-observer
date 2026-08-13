-- 表级授权补全（PostgREST 依赖 GRANT 才能执行 RLS 查询）
-- 用途：本地库此前只有 RLS 策略、缺表级授权，登录后 profiles 等查询返回 403（“登陆不了”根因）。
-- 所属工作台：全局（认证/数据访问）
-- 权限：authenticated 获得全部业务表 CRUD（行级安全仍由各表 RLS 控制）；service_role 全表权限（管理/导入用，绕过 RLS）。
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;
