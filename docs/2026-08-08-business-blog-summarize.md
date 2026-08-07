# 商务公众号分析交付记录

## 已完成

- 新增 `backend/pb_migrations/1786104000_business_blog.js`。
- `competitor_accounts` 扩展 business/boss 权限，并追加霞光社、白鲸出海、晚点财经三条记录。
- 新建 `blog_articles` 表，包含文章内容、阅读数据、分析笔记、原文链接和服务端爆款字段。
- `clients.industry` 追加 `ai_tool`、`creator_tool`、`erp`、`payment`、`finance_tax`。
- 新增 `backend/pb_hooks/blog_articles.pb.js`，按同账号平均阅读量的 2 倍自动计算爆款状态。
- 商务工作台新增第 9 个 Tab「公众号分析」，包含总文章数、爆款数、本月新增、搜索、账号筛选和文章列表。

## 自检结果

- `node --test backend/tests/blog-articles.test.cjs`：3/3 通过。
- `node --check backend/pb_migrations/1786104000_extend_business_content.js`：通过。
- `node --check backend/pb_hooks/blog_articles.pb.js`：通过。
- 全新临时 PocketBase 数据目录迁移：成功应用至 `1786104000`。
- 前端测试：26 个文件、99 个测试通过。
- 根目录没有 `test` script，因此 `pnpm test` 不可用；实际等价门禁 `pnpm --dir apps/web test` 已通过。
- 全后端测试已有两个未完成 Phase D 模块缺失：`dependency-engine.js`、`task-engine.js`。公众号专项测试不受影响。

## 后续

文章录入后由 PocketBase Hook 自动维护 `is_viral`，商务人员只需补充 `analysis_notes`。飞书 OAuth 配置仍保留为未完成任务，待本地环境变量准备好后再联调。
