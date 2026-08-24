# TK观察工作台

TK观察内部多角色工作台，面向 TikTok Shop 跨境电商团队。项目是 SPA + Supabase + Tauri 2 架构：默认数据源为 Supabase（Auth、业务表、RLS、Storage、Realtime、pg_cron 自动化），PocketBase 保留显式回退，没有额外的自建后端服务。

> 后端策略（2026-08-14）：PocketBase 已冻结，只作显式回退，不再新增 migration 或业务 hook。新功能一律走 Supabase migration；`pnpm check:pb-freeze`（`node scripts/supabase/pocketbase-freeze-check.mjs`）可校验冻结线。

## 技术栈

- Vite + React 18 + TypeScript strict
- shadcn/ui + Tailwind CSS
- TanStack Router / Query / Table
- Recharts
- Supabase（Auth / Postgres / Storage / Realtime / pg_cron）
- PocketBase 0.39.x（仅显式回退）
- Tauri 2
- pnpm workspace

## 目录

```text
tk-observer/
├─ apps/web/                 # Vite SPA
├─ apps/desktop/             # Tauri 2 壳
│  └─ src-tauri/
├─ backend/
│  ├─ pb_migrations/         # Collection、字段与 API Rules
│  ├─ pb_hooks/              # PocketBase JS hooks
│  └─ pocketbase             # 本机二进制，不纳入 git
├─ supabase/
│  ├─ migrations/            # Supabase SQL migration（含 RLS、Realtime、自动化）
│  └─ tests/                 # pgTAP 测试
├─ scripts/supabase/         # 对账 / 导出 / schema 工具（只读）
├─ docs/
│  ├─ 后续迭代建议.md
│  ├─ 模块模板说明.md
│  └─ 部署与多端说明.md
└─ package.json
```

## 环境依赖

- Node.js 20 或更高版本（已验证 Node 22）
- pnpm 10 或更高版本
- PocketBase 0.39.x 单文件二进制
- 桌面构建额外需要 Rust stable、Cargo 和对应系统构建工具
- macOS：Xcode Command Line Tools；生成 DMG 只能在 macOS 执行
- Windows：Visual Studio C++ Build Tools 和 WebView2；生成 NSIS `.exe` 只能在 Windows 执行

Supabase 本地开发、密钥边界和验证命令见 [`docs/supabase/local-development.md`](docs/supabase/local-development.md)；远程部署、手机端与多端策略见 [`docs/部署与多端说明.md`](docs/部署与多端说明.md)。当前默认数据源为 Supabase，PocketBase 仅作显式回退。

## 启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备 PocketBase

将 PocketBase 二进制放到 `backend/pocketbase` 并赋予执行权限。macOS Apple Silicon 示例：

```bash
curl -fL https://github.com/pocketbase/pocketbase/releases/download/v0.39.10/pocketbase_0.39.10_darwin_arm64.zip -o /tmp/pocketbase.zip
unzip -jo /tmp/pocketbase.zip pocketbase -d backend
chmod +x backend/pocketbase
```

首次启动会自动执行 `backend/pb_migrations`：

```bash
pnpm pb:serve
```

PocketBase 默认地址为 `http://127.0.0.1:8090`。管理后台位于 `http://127.0.0.1:8090/_/`。前端设置页可以保存远程 PocketBase 地址；修改地址后必须重新登录。

### 3. 启动前端

另开终端：

```bash
pnpm dev
```

浏览器访问 `http://localhost:5173`。首次使用在登录页切换到“注册”，选择自己的姓名并设置邮箱、密码。会话 token 只保存在当前窗口的 `sessionStorage`，用于刷新和直接 URL 权限验证；关闭应用后会话消失，下次启动固定回到登录页。密码不会被存储。

## 成员注册

可注册姓名是固定的公司成员名单，角色由 PocketBase 服务端按姓名自动分配，前端不能上传或修改 role。同一姓名只能注册一次，注册成功后会自动登录并进入对应工作台。

| 姓名 | 角色 | 默认工作台 |
|---|---|---|
| 磊哥 | boss | `/overview` |
| 董雨辰 | business | `/business` |
| 韩素云 | market | `/market` |
| 孙铭泽 | design | `/design` |
| 谢洁 | editing | `/editing` |
| 杨振康 | business（测试成员） | `/business` |

`1785861000_enable_member_registration.js` 会精确移除旧的五个本地种子账号，让成员可以首次自助注册。本地联调已使用杨振康验证注册流程，具体测试账号见当轮交付说明。

## 本轮已实现能力

- 顶部全局搜索：300ms debounce，按达人、商品、视频、客户分组，每组最多 5 条，并按当前角色隐藏无权访问的数据。
- 工作台搜索基础设施：`SearchBar`、`FilterBar`、`GlobalSearch` 和 `useSearch`；达人、设计素材及爆款选题已支持搜索、组合筛选、排序和 URL query 同步。
- 实时数据：达人、设计素材、通知及关联视频通过 PocketBase realtime 使 TanStack Query 缓存失效，在线客户端无需手动刷新。
- 达人 CRUD：新增、详情、预填编辑、删除、搜索、分页、批量改状态、批量删除及最近更新时间。
- 设计审批：设计师上传素材并提交审核；boss 可通过或驳回，驳回理由由前端 zod、API Rule 和 PocketBase hook 共同校验。
- 消息通知：顶部铃铛、未读数、单条/全部已读；已接通设计审批结果、GMV 达标和评论三种通知。
- 数据关联：达人详情底部展示关联视频；全局搜索中的商品和视频详情已预留并展示现有关系数据。
- 团队日历：`/overview/calendar` 提供 boss 可见的月视图，汇总活动、活动任务、设计需求、朋友圈计划和渠道商单发布日期。
- 外部数据源：`apps/web/src/lib/data-sources/types.ts` 定义统一 `ExternalDataSource` 扩展接口。
- 微信视频号选题库：三个账号的选题 CRUD、自动爆款判定、批量删除、CSV 模板/导入/筛选结果导出、导入历史和 SQL 数据分析看板。
- 剪辑内容调研：预置三个微信视频号对标账号，支持爆款视频分析笔记、AI 风格分析历史、热点调研结果解析及一键预填为选题。
- 微信视频号多账号分析基础：现有三个视频号维度继续复用；表格展示点赞与评论，账号分析纳入互动/视频涨粉，Supabase 新增账号粉丝日快照、每日涨粉计算视图和幂等同步批次。采集端契约见 [`docs/video-account-sync-contract.md`](docs/video-account-sync-contract.md)，不保存微信密码或设备凭据。
- GitHub 采集适配器：`services/wechat-video-sync` 接入 `FisJing/wechat-video-analytics` 的 JSON 产物，负责标准化、幂等同步、多账号顺序任务和每日调度；原项目的 Android/ADB/OCR 仍需在已登录微信的 Android 设备上运行。
- 视频数据导入员：追加 migration 会为已有的杨振康 profile 授予视频数据导入能力；该能力可写入视频指标、账号粉丝快照和同步批次，不扩展成员管理、删除权限或其他工作台权限。
- 工作台维护者：`20260824000500_promote_yang_owner.sql` 将杨振康升级为 `owner`；owner 可维护成员、权限、全部业务数据与系统配置。
- 市场活动数据基础：新增共享活动、阶段、任务、报名、招商、场地、文案模板、物料和财务 collections，供市场与其他工作台关联使用。
- 市场活动运营：活动列表与六 Tab 详情、任务拖拽看板、报名/招商/协作进度、财务录入与指标；场地资源支持多图上传、筛选、详情和快速匹配；模板、物料及财务支持新增、预览和复盘导出。
- 商务拓展：客户 CRUD、六阶段商机 Pipeline、渠道商单、朋友圈计划、活动招商协作，以及达人商务可用性、报价和备注字段。
- 商务经营驾驶舱：真实经营指标、大尺寸商机 Pipeline、临期行动队列、近期商单/朋友圈/客户动态；支持数字入场、页面过渡、拖拽反馈和减少动态效果。
- 统一界面反馈：角色色块头像、北京时间、登录问候、引导式空状态、表格轻交互、通知铃铛提醒和顶部 Sonner Toast。
- 团队记忆闭环：自动生成日报、周报、截止提醒和失败案例；磊哥总览展示今日简报、本月教训 TOP 3 与本周自动化运行指标。

当前仍为骨架或占位的业务包括：选品库完整 CRUD、竞品监测、投放图表真实数据、设计任务看板、视频任务 CRUD、成片上传预览和视频发布排期详情页。

## 微信视频号数据约定

微信视频号目前没有可供本项目直接读取后台指标的公开 API。选题与表现数据只通过谢洁手动新增或 CSV 批量导入进入系统；本项目不会模拟或声称存在自动抓取。后续如接入飞瓜、新榜或微信开放能力，应通过 `ExternalDataSource` 和 PocketBase Hook/定时任务写入现有 collections，前端页面无需更换数据模型。

CSV 模板列为：标题、账号、视频类型、播放量、完播率、涨粉、点赞、评论、转发、发布日期、标签、内容简述。同标题与同发布日期视为重复并跳过，`is_viral` 不接受客户端输入，由 PocketBase Hook 按“完播率不低于 60%，或播放量不低于同账号均值 2 倍”重算。

## 团队记忆自动化

`1786001000_create_team_memory_automation.js` 新增 `daily_reports`、`weekly_reports`、`failed_cases`，并为截止提醒与本地内容分析追加必要字段。报告和失败案例只允许 boss 读取，客户端不能写入。

PocketBase 进程必须使用北京时间运行：

```bash
TZ=Asia/Shanghai pnpm pb:serve
```

自动任务与服务端自检日志：

| Hook | 计划 | 自检日志 |
|---|---|---|
| `deadline-check.pb.js` | 每天 08:00 | `deadline-check: N 条任务+N 条商机已提醒` |
| `daily-report.pb.js` | 每天 18:00 | `daily-report: 已生成 YYYY-MM-DD 日报` |
| `weekly-report.pb.js` | 每周一 08:00 | `weekly-report: 周报已生成，对比上周 X→Y` |
| `failed-case-recorder.pb.js` | 商机或任务更新后 | `failed-case: 已记录 N 条失败案例` |
| `auto-analyze.pb.js` | 每 5 分钟 | `auto-analyze: completed, analyzed=N` |

三个 cron 和内容分析提供 superuser 手动端点：

```text
POST /api/tk-observer/automation/deadline-check
POST /api/tk-observer/automation/daily-report
POST /api/tk-observer/automation/weekly-report
POST /api/tk-observer/automation/auto-analyze
```

`auto-analyze` 不在选题录入请求中调用 AI。新记录会保持 `ai_analysis` 和 `analyzed_at` 为空，由每 5 分钟的后台批次或 superuser 手动端点处理，因此 WorkBuddy 速度不会阻塞录入。

分析通过本机 WorkBuddy CodeBuddy CLI 执行，默认绝对路径为：

```text
/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy
```

可在启动 PocketBase 前设置 `WORKBUDDY_CLI=/absolute/path/to/codebuddy` 覆盖该路径。WorkBuddy 桌面端必须已登录；每个实际分析批次会消耗 WorkBuddy credits。macOS Hook 使用系统 `/usr/bin/perl` 为 CLI 设置 120 秒 wall timeout，防止挂死批次永久占用进程锁。端点返回 `completed` 表示结构化结果已写入，`empty` 表示没有待分析记录，`in_progress` 表示已有批次运行且本次未消耗 credits，`workbuddy_unavailable` 表示 CLI 缺失、未登录、credits 不足、超时或输出校验失败，`write_failed` 表示数据库事务已整批回滚。失败时两个分析字段保持为空，下一次 5 分钟调度或手动调用会自动重试。

CodeBuddy 2.115.0 的 `--json-schema` 会要求当前模型调用不可用的 `StructuredOutput` 工具，因此 Hook 不传该参数；提示词负责约束格式，本地解析器负责严格校验四个字段，校验不通过时不会写入数据库。

后端集成自检只允许连接临时 PocketBase，脚本会拒绝端口 `8090`：

```bash
PB_TEST_BASE_URL=http://127.0.0.1:8092 \
PB_TEST_SUPERUSER_EMAIL=<temporary-superuser> \
PB_TEST_SUPERUSER_PASSWORD=<temporary-password> \
PB_TEST_ALLOW_MUTATIONS=1 \
node backend/tests/team-memory-hooks.integration.mjs
```

## 本地测试账号

以下账号由协作层 migration 创建，只用于本机联调，不占用真实成员的姓名注册名额：

| 角色 | 邮箱 | 密码 |
|---|---|---|
| boss | `test.boss@tkobserver.local` | `TkTestBoss@2026!` |
| business | `test.business@tkobserver.local` | `TkTestBusiness@2026!` |
| market | `test.market@tkobserver.local` | `TkTestMarket@2026!` |
| design | `test.design@tkobserver.local` | `TkTestDesign@2026!` |
| editing | `test.editing@tkobserver.local` | `TkTestEditing@2026!` |

生产部署前必须删除或禁用这些测试账号，并替换本地示例通知与搜索数据。

## 开发

提交前必须全部通过：

```bash
pnpm typecheck
pnpm lint
pnpm --dir apps/web format:check
pnpm --dir apps/web test
pnpm --dir apps/web test:eval
pnpm build
```

统一约定：

- 数据库表使用英文小写下划线；界面文案使用中文。
- 金额以最小货币单位整数存储，例如 USD 美分；由 `src/lib/format.ts` 显示。
- 数据库时间统一 UTC，界面用 `Asia/Shanghai` 展示；站点业务后续补充当地时间。
- 所有业务数据带 `region`；金额数据同时带 `currency`。
- Query 负责服务端状态。只有必要的跨组件 UI 状态使用 Zustand。
- 不打印 token、密码或用户对象。认证状态只存在内存 AuthStore。
- Collection API Rules 是安全边界。新增页面守卫时必须同步新增或修改 migration。
- 已发布 migration 不修改；后续结构变化创建新的时间戳 migration。
- 通用搜索组件放在 `components/shared`，通用搜索状态放在 `hooks/use-search.ts`；feature 之间不互相 import。

## 协作层数据流

```text
设计师上传素材 -> 提交审核 -> boss 审批 -> PocketBase hook 写入通知
业务记录变化 -> PocketBase realtime -> Query cache 失效 -> 在线列表更新
顶部输入关键词 -> 300ms debounce -> 按角色查询允许的 collection -> 分组结果/详情
达人详情 -> creators.id -> videos.creator relation -> 关联视频列表
选题写入/删除 -> video_ideas Hook -> SQL 重算同账号爆款状态 -> realtime 刷新
CSV 导入 -> 去重写入 -> import_history 快照 -> SQL 分析视图自动刷新
```

协作层结构由以下追加 migration 定义，已经执行过的文件不得回改：

- `1785862000_add_collaboration_layer.js`：设计审批字段、通知、评论、视频达人关系和五角色测试账号。
- `1785862060_require_design_rejection_reason.js`：审批驳回理由规则。
- `1785862070_strict_design_rejection_reason.js`：收紧空白理由校验。
- `pb_hooks/notifications.pb.js`：三种通知和审批请求的服务端校验。
- `1785863000_create_editing_content_collections.js`：微信视频号选题、导入历史、对标账号/视频、热点话题和风格分析数据表。
- `1785864000_create_video_idea_analytics_views.js`：核心指标、账号对比、视频类型对比和爆款特征只读 SQL 视图。
- `pb_hooks/video_ideas.pb.js`：服务端自动重算 `is_viral`，客户端不能手工设置该字段。

## 达人 CRUD 模板

完整范式位于 `apps/web/src/features/business`：

```text
features/business/
├─ components/
│  ├─ creator-table.tsx
│  ├─ creator-form.tsx
│  └─ creator-detail.tsx
├─ hooks/
│  ├─ use-creators.ts
│  ├─ use-creator.ts
│  ├─ use-create-creator.ts
│  ├─ use-update-creator.ts
│  └─ use-delete-creator.ts
├─ types.ts
├─ constants.ts
└─ index.ts
```

模板已实现搜索、组合筛选、排序、URL query 同步、分页、实时订阅、详情抽屉、预填编辑、zod 校验、批量状态、批量删除、二次确认、统一错误提示和数据更新时间。详细复制步骤见 [模块模板说明](docs/模块模板说明.md)。

## 新增业务模块

1. 在目标 feature 的 `types.ts` 和 `constants.ts` 增加领域类型与枚举。
2. 创建新的 PocketBase migration，定义 collection、字段、索引和角色 API Rules。
3. 复制达人模块的五类 Query hooks，修改 collection 名和字段映射。
4. 复制表格、表单和详情组件，保持统一列表布局。
5. 在 `src/routes/_app/{workbench}` 增加文件路由并写清权限注释。
6. 在 `app-sidebar.tsx` 增加导航项。
7. 用目标角色和 boss 分别验证 CRUD；再用无权限角色验证数据不可读取或写入。
8. 运行 typecheck、lint、format check 和 build。

## 新增工作台角色

1. 新建 `features/{workbench}`，保持 `components/hooks/types/constants/index` 结构。
2. 新建 `routes/_app/{workbench}/index.tsx`，在 `beforeLoad` 调用 `requireRoles`。
3. 在 `types/auth.ts`、`lib/auth.ts` 和 `app-sidebar.tsx` 增加 role、默认路由和导航。
4. 新建 migration 扩充 `users.role` 的 SelectField；不要改已发布 migration。
5. 为新角色配置每个 collection 的 API Rules。
6. 新增测试账号并验证默认跳转、侧边栏和直接 URL 越权拦截。

## 打包

### 开发桌面壳

```bash
pnpm desktop:dev
```

### macOS DMG

在 macOS 执行：

```bash
pnpm desktop:build -- --bundles dmg
```

产物位于 `apps/desktop/src-tauri/target/release/bundle/dmg/`。

### Windows EXE 安装包

在 Windows 执行：

```powershell
pnpm desktop:build -- --bundles nsis
```

产物位于 `apps/desktop/src-tauri/target/release/bundle/nsis/`。Tauri 不支持在 macOS 直接交叉生成 NSIS 安装包，建议后续增加 GitHub Actions 的 macOS/Windows 构建矩阵。

桌面包只包含前端和 Tauri 壳。PocketBase 本轮按远程地址部署，不随桌面端打包。

## 安全说明

- PocketBase 使用 bcrypt 存储密码，前端从不自行加密或缓存密码。
- 公共 `users` Collection 仍禁止匿名创建；自助注册只能经过 `registration.pb.js` 的姓名白名单和唯一性校验。
- 退出登录会清空 PocketBase 内存认证、Zustand 用户状态、TanStack Query 缓存和 sessionStorage。
- 为满足内部产品对登录错误的精确提示，`account_exists.pb.js` 提供账号存在性查询。这会允许邮箱枚举，只适用于受控内部系统；对公网开放前应加网关限流、IP 白名单或改为统一认证错误。
