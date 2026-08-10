# TK观察工作台 Supabase 完整迁移设计

## 目标

将 TK观察工作台从本地 PocketBase 完整迁移到 Supabase Cloud，使公司内部成员能够通过 Tauri 桌面端、PWA 移动端和云端网页共同维护数据。迁移必须保留现有业务数据、关系、文件、权限和自动化能力，并保留 PocketBase 只读版本作为回退基线。

本设计覆盖后端迁移和多端交付的基础合同。前端结构级大洗盘在 Supabase 数据合同稳定后单独设计和实施。

## 已确认决策

- 使用 Supabase Cloud 官方托管。
- Tauri 桌面端、PWA 移动端和云端网页共享同一套 React 前端。
- 第一阶段本地开发，第二阶段发布免费 `pages.dev` 临时地址，验收后再绑定正式域名。
- 系统必须联网使用，不实现离线编辑或离线同步。
- 现有 PocketBase 数据和文件全部迁移，不从空数据库开始。
- 正式迁移采用停机切换，不做新旧后端双写。
- PocketBase 在切换后保持只读，至少保留一个完整观察周期。
- 5 个业务账号之外增加 1 个独立 `owner` 远程维护账号。
- 登录使用邮箱和密码，`owner` 强制启用双重验证。
- 公开注册默认关闭，新增成员由 `owner` 邀请并分配角色。
- 图片存入私有 Supabase Storage，通过 RLS 和签名链接访问。
- 所有在线 Tauri 桌面设备都可以调用各自本机的 WorkBuddy CLI 处理 AI 任务。
- 移动端可以提交和查看 AI 任务，也可以通过复制或分享提示词在手机 WorkBuddy 中半自动处理。
- 不在前端、PWA、Tauri 安装包或 Git 中存放 `service_role` 密钥。

## 总体架构

```text
Tauri 桌面端 ─────────────┐
PWA 移动端 ───────────────┼── Supabase Cloud
本地开发网页 ──────────────┘   ├── Auth
                               ├── PostgreSQL
                               ├── Storage
                               ├── Realtime
                               ├── Cron
                               └── Edge Functions

Tauri AI 工作节点
├── 本机 WorkBuddy CLI
├── Supabase AI 任务队列
├── 设备心跳和任务租约
└── 结构化结果校验
```

现有 React、Vite、TanStack Query、Tailwind、shadcn/ui 和 Tauri 架构保持不变。页面组件继续通过 feature hooks 获取数据；迁移主要替换 hooks 内部的数据提供者、认证会话、文件访问和实时订阅。

## 数据库设计

### 用户与成员资料

Supabase Auth 管理身份凭证，`public.profiles` 管理业务身份：

```text
profiles
├── id uuid references auth.users
├── name text
├── role text
├── status text
├── invited_by uuid
├── last_login_at timestamptz
├── created_at timestamptz
└── updated_at timestamptz
```

账号状态为 `invited`、`pending`、`active`、`disabled`。当前使用 `owner`、`boss`、`business`、`market`、`design`、`editing` 六种角色。后续新增角色通过追加迁移实现。

### 业务表迁移

- 保留现有业务表名和主要字段名。
- 新表使用 UUID 主键。
- 原 PocketBase ID 保存为唯一 `legacy_id`，用于核对和回退。
- 所有关联字段在导入时转换为 UUID 外键。
- 日期统一使用 `timestamptz`。
- 金额继续使用最小货币单位整数存储，前端按人民币显示。
- Select 字段使用 `text` 和 check constraint，后续扩展通过新 SQL migration 完成。
- `created_at` 和 `updated_at` 由数据库默认值和 Trigger 维护。
- PocketBase analytics collections 转换为普通 SQL View 或 Materialized View。
- 业务删除默认软删除；明确要求永久删除时才清理底层记录和文件。

### 文件元数据

文件元数据记录 Bucket、对象路径、MIME、大小、原始文件名、上传人、关联业务记录、删除状态和时间。对象路径使用随机 ID，不包含客户名、手机号或其他敏感信息。

## 权限设计

| 角色 | 主要权限 |
|---|---|
| `owner` | 成员、系统、全部业务数据、迁移、设备和审计 |
| `boss` | 全部业务数据、审批和经营总览 |
| `business` | 客户、商机、商单、朋友圈、招商和公众号 |
| `market` | 活动、场地、模板、物料、财务和报名 |
| `design` | 设计需求、任务、素材、参考和交付 |
| `editing` | 达人、视频、选题、对标、趋势和风格分析 |

每张表和每个 Storage Bucket 都必须配置 RLS。共享表按真实协作关系授权，不依靠前端隐藏按钮。成员状态不是 `active` 时，除完成邀请和恢复账号所需接口外，不允许读取业务数据。

## 图片和文件上传

私有 Bucket：

```text
avatars
design-assets
venue-photos
event-materials
finance-receipts
```

上传流程包括文件类型和大小检查、图片方向修正、普通照片压缩、进度显示、失败重试、元数据写入和签名链接读取。删除对象先进入 30 天回收状态，再由定时任务清理。

财务凭证仅 `owner`、`boss` 和授权市场人员可读；设计文件由需求参与者和设计人员读取；场地及活动图片按关联业务角色授权。

## AI 多设备任务队列

### 数据结构

`ai_jobs` 保存任务类型、输入、状态、优先级、领取设备、租约到期时间、尝试次数、结果、错误、提交人和时间。`ai_devices` 保存设备 ID、用户、设备名、启用状态、能力、最近在线时间和当前任务。

任务状态为：

```text
queued
claimed
running
waiting_manual
completed
failed
cancelled
```

### 桌面端处理

Tauri 启动后注册设备心跳并检查本机 WorkBuddy CLI。在线设备通过 PostgreSQL 原子函数领取任务；领取过程必须使用行锁和租约，保证同一任务只被一个设备处理。处理期间续租，掉线后租约过期，任务返回队列。WorkBuddy 返回值通过 JSON Schema 校验后写入正式结果。

每台设备使用各自的 WorkBuddy 登录和额度。系统不读取、不上传 WorkBuddy 凭证。用户可以关闭本机 AI 处理，`owner` 可以远程停用异常设备。

### 移动端处理

移动端可以提交、取消、查看任务和接收结果。默认由在线桌面设备处理；没有设备在线时显示等待状态。备用流程通过 Web Share 或剪贴板把提示词交给手机 WorkBuddy，用户粘贴结果后由工作台校验并写回 Supabase。

### 云端确定性自动化

日报、周报、截止提醒、财务模板、失败案例、通知和数据清理由 Supabase Cron、数据库函数或 Edge Functions 执行，不依赖任何桌面设备。

## 数据迁移流程

1. 创建 Supabase 测试项目。
2. 建立 SQL migrations、RLS、Storage 和自动化。
3. 导出 PocketBase 数据与文件，生成迁移快照。
4. 在测试项目执行首次导入。
5. 自动核对记录数、外键、金额、文件数量、大小和校验值。
6. 修复所有不一致并重复演练。
7. 正式切换时暂停 PocketBase 写入。
8. 重新执行最终导出和导入。
9. 运行完整一致性报告和角色验收。
10. 切换前端数据提供者为 Supabase。
11. PocketBase 保持只读并保留回退入口。

迁移不使用双写。失败时前端切回 PocketBase只读基线，修复后重新执行完整迁移。

## 实施顺序

1. 冻结并验证当前 PocketBase 基线。
2. 建立 Supabase SQL、Auth、RLS、Storage 和生成类型。
3. 迁移 Trigger、Cron、Edge Functions 和 AI 任务队列。
4. 按 feature hooks 逐模块替换前端数据层。
5. 执行测试环境迁移演练和一致性修复。
6. 停机完成正式数据切换。
7. 在最终数据合同上执行前端结构级大洗盘。
8. 完成 Tauri AI 工作节点、PWA 和图片上传。
9. 发布 `pages.dev` 临时验收地址。
10. 验收通过后绑定正式域名。

每个阶段独立提交、独立测试、独立回退，不在一个提交中混合数据库迁移、工作台重排和部署配置。

## 测试与评估

### Gate Tests

- SQL migration 语法、约束和重复执行。
- 每种角色和成员状态的 RLS 矩阵。
- Storage 上传、读取、回收和越权访问。
- Feature hooks 数据映射和错误处理。
- AI 任务原子领取、租约、超时重领、并发去重和失败上限。
- 移动端 AI 结果 JSON 校验。
- TypeScript、ESLint、Prettier、Vitest、构建和 diff 检查。

### Periodic Evals

- AI 分析不同视频数据时的结构和结论质量。
- 日报、周报内容完整度。
- 六种角色的完整工作流。
- 桌面、手机和网页的数据一致性。
- 图片上传、压缩、权限和签名链接。
- 弱网、断网提示及恢复网络后的刷新行为。
- 迁移前后业务汇总对比。

## 监控与审计

使用 `audit_logs`、`automation_runs`、`ai_jobs`、`ai_devices`、`migration_runs` 和 `migration_errors` 留下可查询证据。登录、邀请、角色变更、数据导出、敏感文件读取、自动化运行和迁移批次必须记录结果与错误。

## 验收标准

- 业务记录迁移率 100%。
- 文件迁移率 100%。
- 外键孤儿记录 0。
- 金额汇总差异 0。
- 未授权访问测试通过率 100%。
- 6 个初始账号登录成功率 100%。
- 核心 CRUD 工作流通过率 100%。
- AI 任务重复执行数 0。
- 移动端横向溢出页面 0。
- 浏览器和 Tauri 控制台错误 0。
- PocketBase只读回退经过实际验证。

## 非目标

- 不实现离线编辑或离线冲突合并。
- 不引入第二套移动端业务代码。
- 不在迁移期间同时写入 PocketBase 和 Supabase。
- 不在本规格中决定前端大洗盘的具体页面视觉和布局。
- 不购买正式域名，直到临时地址和内部工作流验收通过。
