-- 飞书文档读取授权：所属系统设置；权限：认证成员仅经既有 RLS 读取本人文档与同步状态，连接 token 表保持不可读。
grant select on public.feishu_documents, public.feishu_sync_state to authenticated;
