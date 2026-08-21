# 2026-08-21 搜索索引修正

## 完成

- 发现拼接字段 trigram 索引与现有单列 `ilike` 查询命中不稳定，追加 `20260821000200_search_column_trgm.sql`。
- 修正为 12 个按实际查询列拆分的 GIN trigram 索引，保留软删除条件。
- 搜索 gate/eval：15/15 通过。
- 前端 typecheck、lint、130 个测试文件/302 个测试、build 通过。

## 阻塞

- 本地 Supabase 服务已停止，`pnpm supabase:test` 无法连接 `127.0.0.1:54322`。
- 远程推送未执行：本机 Supabase CLI 登录态已失效（`LegacyInvalidAccessTokenError`），需要重新 `pnpm supabase login` 后再推送 `20260821000200`。

## 下一步

```bash
pnpm supabase login
pnpm supabase db push --linked
pnpm supabase migration list
```
