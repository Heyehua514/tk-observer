# 飞书 Supabase 上线清单

## 已完成

- Supabase 连接、文档和同步游标数据模型。
- 连接 token 脱敏读取 RPC 与 owner RLS。
- 前端 Supabase-first 连接状态读取。
- PocketBase 作为显式 provider 回退。
- `feishu-oauth` Edge Function 契约与纯逻辑测试：服务端鉴权、token 加密、响应脱敏。
- `feishu-sync` Edge Function 契约与纯逻辑测试：分页上限、重试、去重、游标提交和失败停用。

## 上线前必须配置

1. 在飞书开放平台创建企业自建应用，申请文档、知识库和多维表格所需权限。
2. 将生产 HTTPS 回调地址设为 `https://<生产域名>/settings/feishu`。
3. 在 Supabase Edge Function Secrets 设置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_TOKEN_ENCRYPTION_KEY`，不得写入 `.env`、前端变量或 Git。
4. 部署并验证 `feishu-oauth` 与 `feishu-sync` Edge Functions。
5. 由一名测试成员完成授权，验证本人只能看到自己的同步文档。
6. 验证撤销授权、token 失效、飞书限流和连续五次失败自动停用同步。

当前状态：`feishu-oauth` 与 `feishu-sync` 代码及纯逻辑测试已完成，但本机没有 Deno，尚未进行 Edge Function runtime 验证；两项都不能标记为线上可用。

## 回退

将 `VITE_DATA_PROVIDER` 显式设为 `pocketbase` 后，前端继续使用既有 PocketBase 飞书授权与同步路径。该回退不迁移或删除 Supabase 飞书数据。

## 生产边界

- 远程 migration、Secrets 写入、Edge Function 部署和飞书真实授权均属于生产变更，必须单独确认。
- 不记录或展示任何 App Secret、access token、refresh token 或加密密钥。
