# Supabase 本地开发

本目录用于 PocketBase 到 Supabase 的并行迁移开发。当前应用默认仍使用 PocketBase，未经切换验收不得修改 `VITE_DATA_PROVIDER=pocketbase`。

## 前置条件

- 安装并启动 Docker Desktop。
- 在仓库根目录执行 `pnpm install`。
- 不需要生产 Supabase 项目的任何密钥。

## 启动与验证

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test
pnpm supabase:types
```

每次新增或修改 SQL migration 后，都必须重新执行：

```bash
pnpm supabase:reset && pnpm supabase:test && pnpm supabase:types
```

测试结束后停止本地服务：

```bash
pnpm supabase:stop
```

## 前端环境

只有测试 Supabase 前端连接时，才将 `apps/web/.env.example` 复制为已忽略的 `apps/web/.env`，并填入本地 Supabase 启动输出中的 URL 与 anon key。

```dotenv
VITE_DATA_PROVIDER=pocketbase
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
```

保持 `VITE_DATA_PROVIDER=pocketbase`，直到独立的迁移、数据核对和回滚演练全部通过，切换计划才可以修改它。

## 密钥边界

- anon key 可以用于浏览器客户端，数据权限必须由 RLS 控制。
- Supabase access token 只用于 CLI 登录和项目管理，不进入前端环境变量。
- service role key 只允许服务端使用，禁止写入 `VITE_*`、仓库、测试、截图、日志或聊天。
- 生产密钥不得写入 `.env.example`。本地 `.env` 已被 Git 忽略，仍不得在消息或截图中展示。

## 当前阶段边界

- PocketBase 仍是应用默认且唯一启用的数据源。
- Supabase migration、pgTAP 和生成类型目前只构成并行基础设施。
- 不运行双写，不改现有 PocketBase migration，不删除 PocketBase 数据。
- 数据切换必须使用写入冻结、完整性核对和回滚演练，不允许直接改环境变量上线。
- 本地配置关闭 Supabase Analytics，因为当前 `logflare:1.50.1` 的 Apple Silicon 镜像不可执行；认证、RLS、数据库、Storage、Realtime、Studio 和本计划测试不依赖 Analytics。

## 已建立的市场商务核心

本地 Supabase 已包含以下共享核心表：

```text
creators
clients
opportunities
channel_orders
social_plans
events
event_phases
event_tasks
event_registrations
event_sponsorships
```

这些表已经配置角色级 RLS、软删除、`legacy_id`、数据库派生字段和 Realtime publication。`apps/web/src/types/database.generated.ts` 已包含对应的 Row、Insert、Update 和 Relationships 类型。

这不代表前端已经切换。现有 feature hooks 继续读取 PocketBase，直到数据导入核对、文件迁移和回滚演练通过后，才允许在独立阶段修改 provider。

## 已建立的剪辑生产与研究核心

本地 Supabase 还包含 8 张剪辑业务表：

```text
video_tasks
videos
video_ideas
import_history
competitor_accounts
competitor_videos
trending_topics
competitor_style_analysis
```

4 个只读分析视图为 `video_idea_summary`、`video_idea_account_stats`、`video_idea_type_stats` 和 `video_idea_viral_features`。视频文件使用私有 `video-files` Storage bucket，限制 512 MiB，支持 MP4、WebM 和 QuickTime。

8 张表已配置角色级 RLS、软删除、Realtime publication 和 `REPLICA IDENTITY FULL`。`video_ideas.is_viral` 由数据库根据完播率或同账号播放量阈值自动派生，普通登录用户不能伪造该字段。

本阶段没有导入 PocketBase 业务数据或文件，没有调用 AI、WorkBuddy、Cron 或外部 API，也没有修改前端 provider。
