# Supabase 剪辑与达人研究核心设计

## 目标与结果

在不切换前端 provider、不修改 PocketBase migration 的前提下，把剪辑工作台的生产任务、成片、选题研究、对标研究和分析视图建立到本地 Supabase。

可量化结果：

- 8 张业务表、4 个分析视图可以从空数据库完整重建。
- `videos.creator_id` 关联已迁移的 `creators`，商务能只读达人关联成片。
- 爆款标记完全由数据库计算，客户端不能持久化伪造结果。
- owner、boss、editing、business 的 RLS 和 Storage 权限经过角色测试。
- 8 张业务表全部加入 Realtime，生成的 TypeScript 类型包含表、视图和关系。
- PocketBase 仍是默认数据源，现有前端测试与 eval 不回归。

## 方案选择

### 采用：生产与研究核心一次闭环

本阶段包含：

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

并建立 `video_idea_summary`、`video_idea_account_stats`、`video_idea_type_stats`、`video_idea_viral_features` 四个 SQL View，以及私有 `video-files` Storage bucket。

该方案让达人、成片、选题、对标和趋势之间的关系完整，后续前端 provider 切换不需要临时跨 PocketBase 查询。

### 未采用：只迁 6 张研究表

改动更小，但 `videos` 继续留在 PocketBase，达人详情和全局搜索会形成跨后端依赖。

### 未采用：同时迁移 AI、日报和失败案例自动化

覆盖面最大，但会把确定性数据库规则、本机 WorkBuddy 调用、Cron 和报告模型混在一个阶段，失败边界不清晰。自动化继续使用独立规格。

## 通用数据合同

业务表沿用已建立的 Supabase 合同：UUID 主键、唯一可空 `legacy_id`、`created_at`、`updated_at`、`deleted_at`、`timestamptz` 和软删除。外键不级联删除历史数据；硬删除仅 owner 可执行。

不在 migration 中 seed 六个对标账号。PocketBase 现有 seed 已属于业务数据，统一在数据迁移演练中按 `legacy_id` 导入，避免 schema reset 产生重复记录。

## 表结构

### 视频生产

`video_tasks` 保留 `title`、`product_name`、`creator_name`、`status`、`due_at`、`owner_name`、`region`。

`videos` 保留 `title`、`product_name`、`creator_name`、`publish_at`、`region`，新增 `file_path` 保存私有 Storage 对象路径，并用可空 `creator_id` 关联 `creators`。

### 选题研究

`video_ideas` 保留账号、视频类型、标题、描述、来源、标签、发布时间、播放/互动指标、完播率、涨粉、`is_viral`、`ai_analysis`、`analyzed_at`。指标使用非负整数；`completion_rate` 限制在 0-100。

唯一键保持为 `title + publish_date`。软删除后的同标题同日期记录仍占用该唯一键，数据迁移重试通过 `legacy_id` 处理，不用删除复用语义。

`import_history` 保存导入时间、文件名、总行数、新增数、更新数和 JSONB 快照。记录创建后不可编辑，只允许通过 `deleted_at` 作废。

### 对标与趋势

`competitor_accounts`、`competitor_videos`、`trending_topics`、`competitor_style_analysis` 保留 PocketBase 最终字段名和约束。对标视频及风格分析通过 `competitor_id` 关联账号，删除账号不会级联删除研究历史。

## 爆款计算

`is_viral` 由数据库维护：

```text
completion_rate >= 60
或
views >= 同账号未删除视频平均播放量的 2 倍
```

在视频新增、删除、软删除，或账号、播放量、完播率变化后，触发器重算受影响账号的全部未删除记录。更新仅改 `is_viral` 时不会再次触发重算，避免递归。

`ai_analysis` 和 `analyzed_at` 预留在表中，但普通前端角色不能修改；后续自动化阶段通过受控数据库函数或服务角色写入。

## 分析视图

- `video_idea_summary`：总数、本月新增、爆款数/率、平均完播率、平均播放量、总涨粉。
- `video_idea_account_stats`：固定三个自有账号的播放量、平均完播率和爆款数，空账号仍返回 0。
- `video_idea_type_stats`：固定八种视频类型的平均完播率，空类型仍返回 0。
- `video_idea_viral_features`：爆款标题词、视频类型、标签和发布日期区间各取前 5。

视图使用 `security_invoker`，查询基表时继续受 `video_ideas` RLS 约束。仅 owner、boss、editing 获得有效数据。

## 权限矩阵

| 数据 | owner | boss | editing | business | 其他角色 |
|---|---|---|---|---|---|
| video_tasks | 全部 | 读写 | 读写 | 无 | 无 |
| videos | 全部 | 读写 | 读写 | 只读 | 无 |
| video_ideas | 全部 | 读写 | 读写 | 无 | 无 |
| import_history | 全部 | 读取/创建/作废 | 读取/创建/作废 | 无 | 无 |
| competitor_accounts | 全部 | 读写 | 读写 | 读写 | 无 |
| competitor_videos / topics / style | 全部 | 读写 | 读写 | 无 | 无 |
| 4 个分析视图 | 读取 | 读取 | 读取 | 无有效数据 | 无有效数据 |

`video_ideas` 触发器阻止 owner、boss、editing 直接修改 `is_viral`、`ai_analysis`、`analyzed_at`。爆款触发器和后续自动化函数使用数据库所有者权限完成受控写入。

## Storage

新增私有 `video-files` bucket，单文件上限 512 MiB，允许 MP4、WebM、QuickTime。owner、boss、editing 可上传、读取、更新和删除；business 只读，用于达人详情关联成片。对象名使用随机 UUID 路径，不包含达人、客户或产品名称。

本阶段只建立 bucket 和权限，不上传或迁移 PocketBase 文件。

## Realtime 与前端边界

8 张业务表设置 `REPLICA IDENTITY FULL` 并加入 `supabase_realtime`。SQL View 不加入 publication，前端在 `video_ideas` 或 `import_history` 变更时重新查询分析视图。

本阶段只更新生成类型，不修改 editing hooks，不运行双写，不改变 `VITE_DATA_PROVIDER=pocketbase`。

## 测试与 eval

Gate tests 验证表、外键、约束、视图、触发器、RLS、Storage 和 Realtime。角色场景验证 editing CRUD、business 只读成片、business 可维护对标账号、market 无权读取研究数据、禁改服务端字段、导入历史不可变。

Eval 使用真实数据场景验证：同账号两条视频的平均值变化会重算爆款；完播率 60 的边界为爆款；软删除高播放视频会重新计算剩余视频；四个分析视图输出稳定且无越权数据。

## 非目标

- 不导入 PocketBase 数据或文件，不 seed 对标账号。
- 不迁移 `blog_articles`、通知、日报、周报、失败案例或 AI 任务队列。
- 不调用 WorkBuddy，不创建 Cron 或 Edge Function。
- 不切换前端 hooks，不部署 Supabase Cloud。
