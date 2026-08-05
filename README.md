# TK观察工作台

TK观察内部多角色工作台，面向 TikTok Shop 跨境电商团队。项目是纯 SPA + PocketBase + Tauri 2 架构：前端只通过 PocketBase SDK 访问数据，没有额外的自建后端服务。

## 技术栈

- Vite + React 18 + TypeScript strict
- shadcn/ui + Tailwind CSS
- TanStack Router / Query / Table
- Recharts
- PocketBase 0.39.x
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
├─ docs/
│  ├─ 后续迭代建议.md
│  └─ 模块模板说明.md
└─ package.json
```

## 环境依赖

- Node.js 20 或更高版本（已验证 Node 22）
- pnpm 10 或更高版本
- PocketBase 0.39.x 单文件二进制
- 桌面构建额外需要 Rust stable、Cargo 和对应系统构建工具
- macOS：Xcode Command Line Tools；生成 DMG 只能在 macOS 执行
- Windows：Visual Studio C++ Build Tools 和 WebView2；生成 NSIS `.exe` 只能在 Windows 执行

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
- 工作台搜索基础设施：`SearchBar`、`FilterBar`、`GlobalSearch` 和 `useSearch`；达人、设计素材已支持搜索、筛选、排序及 URL query 同步，市场和剪辑已接入关键词 URL 状态。
- 实时数据：达人、设计素材、通知及关联视频通过 PocketBase realtime 使 TanStack Query 缓存失效，在线客户端无需手动刷新。
- 达人 CRUD：新增、详情、预填编辑、删除、搜索、分页、批量改状态、批量删除及最近更新时间。
- 设计审批：设计师上传素材并提交审核；boss 可通过或驳回，驳回理由由前端 zod、API Rule 和 PocketBase hook 共同校验。
- 消息通知：顶部铃铛、未读数、单条/全部已读；已接通设计审批结果、GMV 达标和评论三种通知。
- 数据关联：达人详情底部展示关联视频；全局搜索中的商品和视频详情已预留并展示现有关系数据。
- 团队日历：`/overview/calendar` 提供 boss 可见的月视图占位页。
- 外部数据源：`apps/web/src/lib/data-sources/types.ts` 定义统一 `ExternalDataSource` 扩展接口。

当前仍为骨架或占位的业务包括：客户/供应商完整 CRUD、选品库完整 CRUD、竞品监测、投放图表真实数据、活动排期、设计任务看板、视频任务 CRUD、成片上传预览和发布排期。

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
```

协作层结构由以下追加 migration 定义，已经执行过的文件不得回改：

- `1785862000_add_collaboration_layer.js`：设计审批字段、通知、评论、视频达人关系和五角色测试账号。
- `1785862060_require_design_rejection_reason.js`：审批驳回理由规则。
- `1785862070_strict_design_rejection_reason.js`：收紧空白理由校验。
- `pb_hooks/notifications.pb.js`：三种通知和审批请求的服务端校验。

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
