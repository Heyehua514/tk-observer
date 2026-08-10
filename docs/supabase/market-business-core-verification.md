# Supabase 市场商务核心验证报告

验证日期：2026-08-10（Asia/Shanghai）

## 结论

市场与商务共享核心后端已在本地 Supabase 完成。10 张表具备可重建 SQL、角色级 RLS、软删除、PocketBase `legacy_id`、数据库派生规则、Realtime publication 和生成的 TypeScript 类型。PocketBase 仍是前端默认数据源，本阶段没有切换或双写。

## 交付范围

| migration | 内容 |
|---|---|
| `20260810000300_market_business_master_data.sql` | `creators`、`clients`、达人商务字段列级防护 |
| `20260810000400_business_transactions.sql` | `opportunities`、`channel_orders`、`social_plans`、商机概率与流失原因规则 |
| `20260810000500_event_collaboration.sql` | `events`、`event_phases`、`event_tasks`、`event_registrations`、`event_sponsorships`、任务进度规则 |
| `20260810000600_market_business_realtime.sql` | 10 张表 Realtime publication 与 `REPLICA IDENTITY FULL` |

没有修改任何 PocketBase migration，没有导入、删除或改写现有业务数据。

## 验证结果

| 门禁 | 结果 |
|---|---|
| Supabase pgTAP | 7 个文件，104 个断言全部通过 |
| PocketBase schema inventory | 2/2 通过 |
| 前端 gate tests | 39 个文件，122/122 通过 |
| 前端 eval | 9 个文件，12/12 通过 |
| TypeScript | 通过 |
| ESLint | 通过，无警告 |
| Prettier | 通过 |
| Vite build | 通过 |
| `git diff --check` | 通过 |

## 已验证工作流

- business 可以维护客户、商机、商单和朋友圈计划，market 无法读取商务交易表。
- 商机阶段变化自动写入 10/30/50/70/100/0 的概率；流失原因为空时数据库拒绝写入。
- editing 可以维护达人主数据；business 只能修改达人商务可用、报价和备注字段。
- market 可以创建活动、阶段、任务、报名和招商记录。
- business 可以读取活动名称并更新招商状态。
- business、design、editing 只能读取本角色或本人获派任务，只能修改任务状态和备注。
- 两个任务完成一个时阶段进度为 50，全部完成时为 100。
- 活动与阶段不匹配的任务会被数据库拒绝。
- owner 可以查看和恢复软删除记录；普通业务查询看不到软删除记录。
- Realtime 只发布本阶段 10 张业务表，更新和删除事件包含完整旧行。

## 当前边界

- 前端 feature hooks 仍使用 PocketBase，用户界面行为没有变化。
- 尚未迁移 PocketBase 数据、文件、场地、模板、物料、财务、公众号、设计、通知或 AI 自动化。
- 尚未连接 Supabase Cloud，也未使用任何生产密钥。
- 本机 Supabase Analytics 继续关闭，因为 `logflare:1.50.1` 在当前 Apple Silicon 环境无法执行；Auth、PostgreSQL、RLS、Storage、Realtime 和 Studio 不受影响。

## 重启要求

无需保持任何服务运行。再次开发时先启动 Docker Desktop，再在仓库根目录执行：

```bash
PATH="$HOME/.docker/bin:$PATH" pnpm supabase:start
```

下一阶段按既定顺序迁移剪辑与达人研究数据，继续保持 PocketBase 为默认 provider。
