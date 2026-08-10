# Supabase 市场商务共享核心设计

## 目标与结果

在不切换前端数据源、不修改 PocketBase migration 的前提下，为 Supabase 建立市场与商务工作台共用的 10 张核心业务表。完成后，本地 Supabase 能用真实角色验证客户、达人、商机、商单、朋友圈、活动、任务、报名和招商的数据边界，并通过 Realtime 发布核心表变更。

可量化结果：

- 10 张业务表具备 UUID 主键、唯一 `legacy_id`、UTC 时间、软删除和必要索引。
- owner、boss、business、market、editing 五类相关角色的授权与越权测试通过。
- 商机概率、流失原因、活动阶段完成度由数据库约束或触发器维护。
- 10 张表全部加入 `supabase_realtime` publication。
- PocketBase 仍是默认数据源，现有 122 个前端测试和 12 个 eval 不回归。

## 方案选择

### 采用：按领域拆成 3 个顺序 migration

1. 共享主数据：`creators`、`clients`。
2. 商务交易：`opportunities`、`channel_orders`、`social_plans`。
3. 活动协作：`events`、`event_phases`、`event_tasks`、`event_registrations`、`event_sponsorships`。

这样既保持一次 `supabase db reset` 可重建全部结构，又让主数据、商务交易和活动协作能独立审查与定位失败。

### 未采用：单个大 migration

文件更少，但 10 张表、RLS、触发器和测试集中在一起，失败定位与后续字段追加都更困难。

### 未采用：每张表一个 migration

隔离最细，但会产生大量只包含少量 SQL 的文件，跨表约束和角色矩阵分散，增加维护成本。

## 通用数据合同

所有业务表使用：

```text
id uuid primary key default gen_random_uuid()
legacy_id text unique
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
```

- `legacy_id` 保存 PocketBase record ID，新增 Supabase 记录可以为空。
- 金额字段使用 `bigint`，单位为人民币分，值不得小于 0。
- 业务日期使用 `timestamptz`，写入和存储均为 UTC，前端按北京时间显示。
- Select 值使用 `text` 加 check constraint，枚举扩展通过追加 migration 修改约束。
- 外键删除默认 `restrict` 或 `set null`，不级联删除业务历史。
- 普通业务角色通过设置 `deleted_at` 软删除；硬删除仅 owner 可执行。
- 所有表使用现有 `public.set_updated_at()` trigger。

## 表结构

### 共享主数据

`creators` 保留 PocketBase 字段：`nickname`、`tiktok_url`、`followers`、`region`、`cooperation_status`、`commission_rate`、`owner_name`，并包含商务扩展 `is_biz_available`、`cooperation_price`、`cooperation_notes`。

`clients` 保留：`name`、`contact_name`、`contact_phone`、`contact_wechat`、`company`、`industry`、`source`、`level`、`notes`。`industry` 同时包含现有值和 `ai_tool`、`creator_tool`、`erp`、`payment`、`finance_tax`。

### 商务交易

`opportunities` 关联 `clients`，保留类型、金额、阶段、预计成交时间、概率、流失原因和备注。数据库按阶段写入概率：10、30、50、70、100、0；`lost` 必须有 `lost_reason`。

`channel_orders` 关联 `clients` 与 `creators`，保留平台、内容类型、金额、状态、发布时间、播放量、佣金和备注。

`social_plans` 关联可选商机，保留发布时间、内容、目标受众、预期转化、实际结果和状态。

### 活动协作

`events` 关联可选 `profiles.created_by`，保留名称、类型、主题、开始时间、城市、目标人数、招商目标、预算和状态。场地关系在后续场地资源阶段追加，避免本阶段引入第 11 张表。

`event_phases` 关联活动，保存 P0-P4、时间范围、状态和 `completion_pct`。

`event_tasks` 关联活动、阶段和可选负责人，保存负责角色、状态、优先级、截止时间和备注。任务写入后触发同阶段进度重算；无任务阶段为 0，其他阶段为已完成任务数除以总任务数并四舍五入。

`event_registrations` 关联活动，保存姓名、公司、职位、渠道、确认状态和缴费状态。

`event_sponsorships` 关联活动和可选客户，保存联系人、金额、阶段和备注。

## 权限矩阵

所有策略都要求 `profiles.status = active`，通过现有 `current_user_role()` 和 `has_any_role()` 判定。

| 数据 | owner | boss | business | market | editing |
|---|---|---|---|---|---|
| creators | 全部 | 全部 | 读取、更新商务字段 | 无 | 全部 |
| clients | 全部 | 全部 | 全部 | 只读 | 无 |
| 商务交易 3 表 | 全部 | 全部 | 全部 | 无 | 无 |
| events | 全部 | 全部 | 只读 | 全部 | 无 |
| phases / registrations | 全部 | 全部 | 无 | 全部 | 无 |
| event_tasks | 全部 | 全部 | 读取本人或 business 角色任务，更新本人任务状态 | 全部 | 读取本人或 editing 角色任务，更新本人任务状态 |
| sponsorships | 全部 | 全部 | 读取、更新 | 全部 | 无 |

`creators` 使用触发器阻止 business 修改非商务字段。`event_tasks` 使用触发器阻止非市场协作者修改标题、分配、优先级和截止时间，只允许更新状态与备注。RLS 决定可访问的行，触发器补足列级业务约束。

## Realtime 与数据流

10 张表加入 `supabase_realtime` publication。当前前端仍使用 PocketBase；本阶段只生成 Supabase 类型，不新增双写、不修改 feature hooks。后续 provider 切换时，TanStack Query hooks 使用生成的 `Database` 类型，并按表订阅变更后失效对应 query key。

## 错误处理与约束

- 负金额、负粉丝数、非法百分比和非法阶段由 check constraint 拒绝。
- 商机进入 `lost` 且原因为空时拒绝写入。
- 活动阶段结束时间早于开始时间时拒绝写入。
- 活动任务的 `event_id` 必须与所选 phase 的 `event_id` 一致，由 trigger 校验。
- 已软删除记录默认不对业务角色可见；owner 可读取并恢复。
- 重复 PocketBase ID 由唯一 `legacy_id` 拒绝，迁移工具可据此安全重试。

## 测试与 eval

Gate tests 使用 pgTAP 验证表、外键、约束、索引、触发器、RLS policy 和 Realtime publication，并模拟各角色执行允许与拒绝的读写。现有 schema inventory、前端 typecheck、lint、format、Vitest 和 build 继续作为回归门。

Eval 使用一组完整业务场景验证：商务创建客户到成交、市场创建活动到任务完成、商务更新招商、editing 维护达人、business 只能更新达人商务字段。每个场景必须留下数据库可查询结果，不调用外部 LLM。

## 非目标

- 不迁移或导入 PocketBase 现有数据与文件。
- 不创建场地、模板、物料、财务、公众号、设计、通知或 AI 表。
- 不切换认证和前端 hooks，不启动双写。
- 不部署 Supabase Cloud，不接触生产环境或密钥。
