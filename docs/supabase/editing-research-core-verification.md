# Supabase 剪辑生产与研究核心验证报告

验证日期：2026-08-11（Asia/Shanghai）

## 结论

剪辑生产与达人研究后端核心已在本地 Supabase 完成。8 张表具备可重建 SQL、角色级 RLS、软删除、PocketBase `legacy_id`、数据库派生爆款状态、Realtime publication 和生成的 TypeScript 类型。4 个分析视图只向 owner、boss 和 editing 返回研究数据。PocketBase 仍是前端默认数据源。

## 交付范围

| migration | 内容 |
|---|---|
| `20260811000100_editing_production.sql` | `video_tasks`、`videos`、私有 `video-files` Storage bucket |
| `20260811000200_editing_research_records.sql` | `video_ideas`、`import_history`、`competitor_accounts`、`competitor_videos`、`trending_topics`、`competitor_style_analysis` |
| `20260811000300_video_viral_engine.sql` | 爆款阈值重算触发器与服务端字段列级防护 |
| `20260811000400_video_idea_analytics.sql` | 4 个安全调用者分析视图 |
| `20260811000500_editing_realtime.sql` | 8 张表 Realtime publication 与 `REPLICA IDENTITY FULL` |

没有修改 PocketBase migration，没有导入、删除或改写现有业务数据。

## 可观测结果

- `is_viral` 在完播率达到 60%，或播放量达到同账号非删除记录均值 2 倍时自动生效。
- 记录更新、软删除、恢复或跨账号移动后，受影响账号的爆款状态会重算。
- 普通登录用户无法直接写入 `is_viral`、`ai_analysis` 和 `analyzed_at`。
- `import_history` 内容不可变；owner、boss 和 editing 只能通过 `invalidate_import_history(uuid)` 进行可审计失效。
- editing 可管理全部剪辑生产与研究数据；business 只能读取视频成果并管理对标账号；market 无权读取该范围。
- 8 张表发布到 Realtime，更新和删除事件包含完整旧行；4 个视图不发布。

## 验证结果

| 门禁 | 结果 |
|---|---|
| Supabase pgTAP 与工作流 eval | 12 个文件，190 个断言全部通过 |
| PocketBase schema inventory | 2/2 通过 |
| 前端 gate tests | 39 个文件，122/122 通过 |
| 前端 eval | 9 个文件，12/12 通过 |
| TypeScript | 通过 |
| ESLint | 通过，无警告 |
| Prettier | 通过 |
| Vite build | 通过 |
| `git diff --check` | 通过 |

## 当前边界

- 前端 feature hooks 仍读取 PocketBase，用户界面行为没有变化。
- 尚未迁移 PocketBase 中的剪辑研究数据与视频文件。
- 尚未实现 AI 分析、WorkBuddy 调用、Cron 或夜跑自动化。
- 尚未连接 Supabase Cloud，没有使用生产密钥。
- 本机 Supabase Analytics 关闭，因为 `logflare:1.50.1` 在当前 Apple Silicon 环境无法执行。Auth、PostgreSQL、RLS、Storage、Realtime 和 Studio 不受影响。

## 重启要求

无需保持任何服务运行。再次开发时先启动 Docker Desktop，再在仓库根目录执行：

```bash
pnpm supabase:start
```

下一阶段才进行 PocketBase 数据对账与文件迁移，之前不允许切换 `VITE_DATA_PROVIDER`。
