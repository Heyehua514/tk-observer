# 2026-08-12 工作台推进记录

## 2026-08-20：飞书 Supabase-first 基础收口

- 新增 `feishu_connections`、`feishu_documents`、`feishu_sync_state` 三张 Supabase 表：token 仅保存加密字段，连接表不向浏览器授予 SELECT；成员通过 `get_my_feishu_connection()` RPC 仅读取连接状态、连接时间和同步状态。
- 文档与游标仅允许本人按 RLS 读取，Edge Function/service_role 保留写入权限；数据库约束限制文档来源为 doc/wiki/bitable。
- 前端 `useFeishuConnection` 改为 Supabase-first RPC 读取，PocketBase 保留 provider 显式回退；OAuth 调用预留 `feishu-oauth` Edge Function。
- 新增 migrations：`20260820000400_feishu_supabase_foundation.sql`、`20260820000410_feishu_document_read_grants.sql`；本地 Supabase 已应用。
- 新增 gate test/eval：飞书基础 2 个专项文件 / 18 条断言通过；前端连接映射 2 条测试通过。
- 阻塞：飞书 Edge Function OAuth 和同步任务仍待配置飞书 App 凭据、正式 HTTPS 回调地址后实施。远程生产 Supabase 未推送本轮 migration。

## 2026-08-20：飞书 OAuth Edge Function 契约收口

- 新增 `supabase/functions/feishu-oauth/index.ts` 与 `core.mjs`：服务端校验 Supabase Auth、交换飞书授权码、AES-GCM 加密 access/refresh token、写入 `feishu_connections`，浏览器响应不包含 token 字段。
- 前端 `useFeishuConnection`：Supabase Edge Function 尚未部署或调用失败时显式回退 PocketBase，连接状态读取同样保留 PocketBase 回退。
- 新增 gate/eval：`core.test.mjs`、`core.eval.test.mjs`，7 条断言通过。
- 已完成 TypeScript 与 Deno 静态类型检查；Edge Function runtime 未启动，真实飞书 API、Secrets 和公网回调仍未验证。

## 2026-08-20：飞书同步 Edge Function 契约收口

- 新增 `supabase/functions/feishu-sync/index.ts` 与 `core.mjs`：按成员连接和来源游标同步 doc/wiki/bitable，最多 100 页、每页失败最多重试 3 次，按 URL 取最新版本，文档写入成功后才提交游标。
- 连续失败 5 次自动关闭该成员同步；所有 Supabase 写入错误会中断当前同步并保留游标，避免丢数据。
- 新增 `core.test.mjs`、`core.eval.test.mjs`，8 条通过。
- 当前仅完成可测试同步契约；Function runtime、真实飞书 API、Secrets、cron 调度均未验证，`feishu-sync` 未部署。

## 2026-08-20：C5 设计审核通知收口

- 新增 Supabase migration `20260820000300_design_review_notification.sql`：通知深链 `record_type` 追加 `design_asset`，设计素材状态从其他状态变为 `pending_review` 时，自动给 active boss 创建「设计稿待审核」通知。
- 通知写入使用 security definer trigger，带素材 ID 深链 `/design`，同一素材重复提审不会重复创建未删除通知。
- 新增 pgTAP `supabase/tests/design_review_notification.test.sql`，覆盖函数、触发器、record_type 约束、首次提审通知和重复提审去重；新增 `design_review_notification.eval.test.sql` 验收老板通知标题与 `/design` 深链。
- 验证：本地 migration 已应用；Supabase 数据库测试 31 个文件 / 508 条断言全部通过。
- 远程生产 Supabase 未推送该 migration，需上线收口时按生产变更流程执行。

### 提交

- `feat(notifications): notify boss on design review`

## 2026-08-20：C4 活动日历双时区收口

- 团队日历活动项补充举办城市，并在有具体时刻时显示北京时间与活动所在地时间。
- 日期-only 数据不虚构时刻；未知城市回退 `Asia/Shanghai`。
- 新增时区纯函数与 4 条模型测试，覆盖海外城市、日期-only、未知城市和月视图回归。
- 验证：`pnpm typecheck`、`pnpm lint`、`pnpm test`（123 文件 / 291 测试）、`pnpm build`、`git diff --check` 全部通过。
- 提交：`8ccdfeb feat(overview): add activity dual-timezone calendar`。

## 2026-08-20：C5 通知偏好首轮收口

- 新增 Supabase `notification_preferences` 表，按用户保存到期、审核、合作跟进三类提醒开关。
- 新增 `/settings/notifications` 页面，并从系统设置进入；PocketBase 回退时使用默认开启值。
- 新增本人读写 RLS、数据库类型、模型测试和 pgTAP 表结构/策略测试。
- 修正 Realtime 白名单测试，纳入已有 `status_history` 与 `ai_notes` 表。
- 验证：typecheck、lint、前端测试 124 文件 / 293 测试、build、Supabase 测试 28 文件 / 495 断言全部通过。
- 新 migration：`20260820000100_notification_preferences.sql`；仅已应用到本地 Supabase。
- 新增 `20260820000200_notification_preference_filter.sql`：服务端在通知写入前按偏好过滤 deadline、review 和 follow-up 类别；未配置偏好时默认放行。
- Supabase 门禁最终结果：29 个测试文件 / 499 条断言全部通过，schema inventory 2/2 通过。

## 2026-08-20：C5 通知中心列表收口

- 新增 `/notifications` 全量通知列表，支持全部、未读、到期、审核、跟进和成交筛选。
- 铃铛增加“查看全部”入口，通知深链解析抽为共享模型，避免组件间重复逻辑。
- 新增筛选模型与页面测试；门禁：前端 126 文件 / 296 测试，typecheck、lint、build、diff check 全部通过。
- 计划文档：`docs/superpowers/plans/2026-08-20-notification-list-filters.md`。

## 2026-08-17：设计与总览推进（节点 8-13）

- 市场物料与设计需求建立前端软关联：物料名称或备注包含 `design:<需求ID>` 或需求标题时双向展示，可从市场物料卡打开设计需求详情，也可从设计需求查看关联物料。
- 设计需求交付记录改为只读版本时间线，按交付时间倒序并自动标注版本号。
- 品牌规范页接入实时统计：设计资产总数、待审核素材、已交付需求，空数据提供引导。
- 总览 GMV 新增近 7 天/近 30 天/全部筛选，统一人民币元展示、分存储说明；增加近期活动详情跳转与活动阶段分布图。
- 验证：typecheck、lint、全量前端测试均通过，最新为 112 个测试文件、269 条测试；Supabase schema 2/2、数据库 27 文件/489 条断言通过。
- 门禁：2026-08-17 已完成 74 个历史前端源码文件的独立 Prettier 基线清理，并完成全量 Playwright E2E 回归，31 个用例全部通过。
- 提交：`9aeba16`、`ff64679`、`1b91c57`、`6c1cafb`、`9659c6f`、`4891e4e`、`bc80b22`、`d066659`、`4db5bfd`、`48d32c5`。

## 完成模块

- 市场工作台首屏补齐竞品监测和投放摘要。
- 市场工作台商品、活动和场地模块空态标题改为引导式文案。
- 市场竞品监测 Tab 接入共享 `competitor_accounts` 表。
- 市场竞品监测 Tab 已改为 Supabase-first 查询共享 `competitor_accounts`，PocketBase 保留显式回退。
- 市场投放概览抽为独立前端模型。
- 商务客户管理补齐行业、来源、重要度筛选。
- 商务客户详情增加基础信息、关联商机、关联商单面板。
- 商务商机卡片增加预计成交日期和备注摘要。
- 商务商机卡片支持点击打开详情弹窗，快速编辑阶段、预计成交日期、备注和流失原因。
- 商务新增商机表单支持预计成交日期和跟进备注。
- 商务渠道商单补齐人民币元输入、状态/平台/内容类型筛选、发布日期列。
- 商务渠道商单新增表单支持平台、内容类型和预计发布日期。
- 商务朋友圈运营增加本周 mini 日历和日历/列表视图切换。
- 商务公众号分析 Tab 补齐动效指标、说明条、统一表格视觉和引导空态。
- 市场活动财务录入改为人民币元输入，并在活动详情页增加 CSV / Markdown 导出。
- 市场资源库财务面板统一人民币元输入和人民币格式展示。
- 市场资源库财务 CSV / Markdown 导出统一为人民币展示，不再输出“美分”。
- 商务商单表格抽出展示模型，统一状态、平台、内容类型、日期和金额的显示口径。
- Supabase 迁移第一刀完成：默认数据提供者切为 Supabase，Auth 支持 Supabase 登录/注册/退出分流。
- 商务基础数据开始切 Supabase：客户 CRUD 与达人列表/新增/编辑/删除默认走 Supabase，PocketBase 保留显式回退。
- 商务客户详情关联面板已切 Supabase-first，商机和渠道商单关联读取不再只查 PocketBase。
- 商务达人批量合作状态更新已切 Supabase-first，保留 PocketBase 显式回退。
- 商务核心链路继续切 Supabase：商机 Pipeline、渠道商单、朋友圈计划默认走 Supabase，PocketBase 保留显式回退。
- 商务驾驶舱已切 Supabase：总客户数、本月新增、进行中商机、预计成交金额、本月商单默认读取 Supabase。
- 商务驾驶舱快捷商机阶段流转已切 Supabase-first，拖拽 Pipeline 不再只写 PocketBase 回退分支。
- 剪辑工作台核心链路开始切 Supabase：选题 CRUD、CSV 导入/导出、分析视图、导入历史、视频任务、成片归档、对标账号、对标视频、热点话题和风格分析默认走 Supabase，PocketBase 保留显式回退。
- 剪辑工作台错误态和空态文案收口为 Supabase-first 中性提示，不再在核心页面暴露 PocketBase-only 失败文案。
- 剪辑工作台制作骨架与热点追踪空态继续收口为引导式表达，视频归档说明改为当前数据服务。
- 市场活动共享表开始切 Supabase：活动列表/保存/软删除、活动详情的阶段/任务/报名/招商读取、活动任务状态更新默认走 Supabase。
- 市场资源表开始切 Supabase：场地库、文案模板、活动物料、活动财务新增 Supabase schema；场地列表/保存/历史活动、模板列表/保存/使用记录、物料列表/上传/保存、财务列表/保存默认走 Supabase，PocketBase 保留显式回退。
- 市场资源库模板、物料和财务空态标题改为引导式文案，不再使用静态“暂无”占位。
- 设计工作台开始切 Supabase：新增 `design_assets`、`design_tasks`、`design_requirements`、`design_references`、`design_deliverables` Supabase schema；素材上传/审批、需求接收/状态流转/参考/交付、任务看板默认走 Supabase，PocketBase 保留显式回退。
- 总览团队记忆开始切 Supabase：新增 `daily_reports`、`weekly_reports`、`failed_cases`、`audit_logs` Supabase schema；今日简报、本月教训、闭环仪表默认读取 Supabase，PocketBase 保留显式回退。
- 总览团队记忆错误态文案改为中性数据服务提示，不再绑定 PocketBase migration 语义。
- 通知铃铛开始切 Supabase：新增 `notifications` Supabase schema；当前用户通知列表、Realtime 失效和已读更新默认走 Supabase，PocketBase 保留显式回退。
- 总览团队日历开始切 Supabase：活动、活动任务、设计需求、朋友圈计划、渠道商单排期默认聚合 Supabase 数据，PocketBase 保留显式回退。
- 总览首页开始切 Supabase：新增 `gmv_metrics`、`team_tasks` Supabase schema；GMV 趋势、签约达人数、待办任务、出片数量、团队动态和成员进度默认读取 Supabase，PocketBase 保留显式回退。
- 总览首页空态文案继续收口：团队动态和指标对比改为等待数据沉淀的引导式表达。
- 市场选品库开始切 Supabase：新增 `products` Supabase schema；市场首页商品卡片、搜索和毛利模型默认读取 Supabase，PocketBase 保留显式回退。
- 商务公司/供应商名录开始切 Supabase：新增 `companies` Supabase schema；公司列表、筛选、搜索、新增、编辑、软删除默认走 Supabase，PocketBase 保留显式回退。
- 全局搜索开始切 Supabase：达人、公司/供应商、商品和视频跨工作台搜索默认查询 Supabase，PocketBase 保留显式回退。
- 全局搜索详情抽屉开始切 Supabase：达人、公司/供应商、商品和视频详情读取，以及商品关联视频读取默认走 Supabase，PocketBase 保留显式回退。
- 商务活动招商面板开始切 Supabase：活动招商列表、活动/客户展开和跟进阶段更新默认走 Supabase，PocketBase 保留显式回退。
- 商务活动招商面板空态改为共享引导组件，不再使用纯文字占位。
- 全局业务审计开始切 Supabase：mutation 成功后的 `recordAudit` 默认写入 Supabase `audit_logs`，失败仍不阻断主业务流程，PocketBase 保留显式回退。
- 商务公众号文章分析开始切 Supabase：新增 `blog_articles` Supabase schema、RLS、Realtime、爆款自动计算触发器；第 9 Tab 文章列表默认读取 Supabase，PocketBase 保留显式回退。
- 商务达人详情与关联视频已切 Supabase-first：达人详情单条读取、详情页关联成片列表默认走 Supabase，PocketBase 保留显式回退。
- 系统设置页文案改为“PocketBase 回退服务器”，避免与当前 Supabase-first 方向冲突。
- 团队记忆自动化已在 Supabase 落地，与 PocketBase 闭环 hooks 完全对齐：新增 `20260813000900_team_memory_automation.sql`，启用 pg_cron 并调度 4 个定时任务（日报 18:00、周报周一 08:00、截止提醒 08:00、过期任务兜底扫描 08:30，均为北京时间）。
- Supabase 商机新增 `created_by`、朋友圈计划新增 `usage_count`/`last_used_at`（只追加字段，不改旧 migration）。
- Supabase 自动审计流水：商机阶段变化/成交、活动任务完成写 `audit_logs`，与日报/周报统计口径一致。
- Supabase 失败自动沉淀：商机变「已流失」写 `failed_cases`（ON CONFLICT 去重），活动任务到期未完成即时记录 + 每日兜底扫描。
- Supabase 截止提醒：当日到期活动任务推给负责人、当日预计成交商机推给创建人，重复运行不产生重复通知。
- Supabase 规则校验：活动招商商机只允许关联重要度 S/A/B 客户，设计稿转 `pending_review` 必须有文件，违反直接拒绝写入。
- Supabase 模板计数：文案模板每次更新 `last_used_at` 使用数 +1；朋友圈计划发布或关联商机时使用数 +1 并打时间戳。

## 验证

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。
- `pnpm build`：通过，无报错。
- `pnpm supabase:schema:test`：通过，2 个 Node schema 测试。
- `pnpm supabase:test`：通过，21 个文件、348 个断言全过；新增 `team_memory_automation.test.sql`（51 个断言），覆盖失败沉淀、截止提醒、日报/周报、招商校验、模板计数和 cron 调度。
- 前端源码已无「美分」与「暂无数据」非测试残留。

## 提交

- `a2e5c72 feat(supabase): add team memory automation triggers and cron`

- `6d6757d test(supabase): align pgTAP suites with current RLS and realtime scope`
- `7021c96 feat(business): cut over creator detail and videos`
- `77e865e feat(workbench): tighten market and business workflows`
- `cffa562 feat(business): add client relation detail panel`
- `f617e99 feat(business): enrich client and opportunity context`
- `317acad feat(business): complete channel order create fields`
- `b2a917d feat(market): improve activity finance exports`
- `b705769 feat(business): capture opportunity follow-up details`
- `f5b46f1 feat(market): normalize resource finance amounts`
- `07c08d6 feat(business): add opportunity detail editing`
- `efc231a feat(business): polish blog analysis workspace`
- `6040306 feat(market): export resource finances in cny`
- `eca2248 feat(business): simplify order row display`
- `37d6841 feat(supabase): cut over auth clients and creators`
- `39f36b9 feat(supabase): cut over business core flows`
- `5e0ec06 feat(supabase): cut over business dashboard`
- `bc56395 feat(supabase): cut over editing workspace`
- `5883cf2 feat(supabase): cut over market activities`
- `5b537e1 feat(supabase): cut over design workspace`
- `f56ece3 feat(supabase): cut over market resources`
- `96c0745 feat(supabase): cut over team memory overview`
- `b6e4842 feat(supabase): cut over notifications`
- `1d3a609 feat(supabase): cut over team calendar`
- `26f30bb feat(supabase): cut over overview dashboard`
- `8401465 feat(supabase): cut over product catalog`
- `6b9cd11 feat(supabase): cut over companies`
- `0628ff0 feat(supabase): cut over global search`
- `5682e01 feat(supabase): cut over global record detail`
- `7822bbf feat(supabase): cut over sponsorship panel`
- `d2e9344 feat(supabase): cut over audit logging`
- `a5810a3 feat(supabase): cut over blog articles`
- `318c49f feat(business): polish sponsorship empty state`
- `f04331b feat(overview): guide dashboard empty states`
- `bc81a02 chore(settings): label pocketbase fallback server`
- `a58c873 feat(market): cut over competitor monitoring`
- `26926f5 feat(business): cut over dashboard stage updates`
- `e811101 chore(overview): neutralize team memory error copy`
- `b593008 chore(editing): neutralize data error copy`
- `2cf2c07 chore(market): guide resource empty states`
- `6596430 chore(editing): guide production empty states`
- `c60e461 chore(market): guide core empty states`
- `6451f53 feat(business): cut over creator bulk updates`

## 外部状态

- 当前仓库未配置 `git remote`，无法执行 push。
- 本轮未修改已发布 PocketBase migration，未新增后端框架，未启动服务，未访问外部 API。

## 前端大洗盘 · 液态玻璃科技商业风（V1.8）

- 视觉基调切换为深空科技蓝 #1478d7 + 青绿强调 #35c4c9，暗色优先，深空蓝黑背景 #0e1626、卡片 #131c30。
- 全局设计 token 收敛：主色、强调、信号网格、aurora 氛围色全部进入 CSS 变量，源码无硬编码旧蓝/紫粉残留。
- 基础组件质感重构：玻璃卡片（glass-card）、实心卡（solid-card）、bento 网格、aurora 流光背景、Logo 呼吸光。
- 侧边栏 / 顶栏 / 应用壳布局统一为深色玻璃质感，激活菜单主色高亮 + 3px 左侧指示条。
- 登录页双面板玻璃化：左侧品牌区深色玻璃 + 右侧表单区，保持原布局与文案、认证行为不变。
- 总览工作台：指标卡 count-up 数字、GMV 趋势、团队活动流、团队记忆区全部玻璃化。
- 商务工作台：驾驶舱指标卡、商机 Pipeline mini、商单列表、朋友圈日历统一玻璃化。
- 市场工作台：活动卡片、活动排期、竞品监测、投放摘要统一玻璃化。
- 设计工作台：素材网格、需求状态、品牌色板统一玻璃化。
- 剪辑工作台：选题分析、对标账号卡片、制作骨架统一玻璃化。
- 设置页：服务器设置卡、飞书面板、连接状态指示灯玻璃化，硬编码色收敛为 token。
- 无头浏览器截图自查 5 个核心页面：暗色占主导、主色为蓝/青、无紫粉渐变残留。


## 验证（前端大洗盘）

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。
- `pnpm build`：通过，无报错。
- 像素抽样：login/overview/business/market/editing 五张截图暗色主导、紫色像素占比 0、主色调蓝/青。
- 源码扫描：无 emoji 图标、无 #2563eb / text-blue-* / 紫粉渐变硬编码残留；`prefers-reduced-motion: reduce` 动画关闭规则在 `index.css` 生效。


## 提交（前端大洗盘）

- `cf8b1ef feat(ui): 液态玻璃科技风 token 与基础组件质感重构`
- `64c8269 feat(ui): 工作台核心页面液态玻璃视觉包装`
- `6d6e364 feat(ui): 设置页玻璃化与硬编码色收敛为 token`

## 数据对账（Supabase 迁移收口，2026-08-13）

- 新增只读对账工具 `scripts/supabase/reconcile-pb-export.mjs`：对比 PocketBase `data.db` 与 `supabase/migrations` 建表清单，输出表映射、行数、列覆盖与导入建议。
- 对账结果：44 张 PB 表 vs 39 张 Supabase 表；12 张映射表仅 28 行业务数据；真实列缺口 1 个（`event_materials.designer`，0 行）。
- PB-only 7 张表逐张给出处置建议：`users` 映射 Supabase Auth + `profiles`，其余为空表或系统缓存跳过。
- 修复对账工具的 id 列误报：PB `id` 优先匹配 Supabase 同名列，`legacy_id` 仅为候选别名，不再对无 legacy 列的表误报缺口。
- 新增第 3 个测试覆盖真实缺口场景（`event_materials.designer`），工具测试 3/3 通过。
- 报告详情见 `docs/2026-08-13-reconcile-report.md`。

### 验证（数据对账）

- `node --test scripts/supabase/reconcile-pb-export.test.mjs scripts/supabase/schema-inventory.test.mjs`：5/5 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。

## 业务数据导出（Supabase 迁移收口二）

- 新增只读导出工具 `scripts/supabase/export-pb-business.mjs`：把已映射且有数据的业务表逐表导出为 JSON + CSV（输出 `/tmp/tk-observer-supabase/`）。
- 列名按对账归一化规则映射到 Supabase 目标列（`venue→venue_id`、`created→created_at` 等），CSV 自动转义逗号与引号。
- 实际导出：12 张表 21 行业务数据（28 行总量减去 PB-only 的 users 6 行与 comments 1 行），users 不导出、由 Supabase Auth + profiles 承接。
- 新增 2 个导出测试：列名归一化 + PB-only 跳过、CSV 转义与行数；脚本测试合计 7/7 通过。

### 验证（业务数据导出）

- `node --test scripts/supabase/*.test.mjs`：7/7 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。

## 对账缺口收口（event_materials.designer_id）

- 新增 Supabase migration `20260813001000_event_materials_designer.sql`：给 `event_materials` 追加 `designer_id uuid references public.profiles(id) on delete set null` + 部分索引，只加不改，RLS 沿用现有行级策略。
- 对账工具重跑：列缺口从 1 降为 0，44 张 PB 表 vs 39 张 Supabase 表全部列覆盖。
- pgTAP 断言同步：`market_resources.test.sql` 计划数 18→19，新增 designer_id 外键断言（本地 pgTAP 需 Docker，本轮未跑，已记录）。

### 验证（对账缺口收口）

- `node --test scripts/supabase/*.test.mjs`：7/7 通过。
- `pnpm supabase:schema:test`：2/2 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。

## 部署与多端说明（文档收口）

- 新增 `docs/部署与多端说明.md`：覆盖当前 Supabase-first 架构、本地开发、远程部署推荐路径（Supabase 生产 + Web 静态托管 + Tauri 桌面 + 手机浏览器/PWA）、Storage 文件上传、远程维护账号、成本参考与上线前安全检查。
- README 同步修正过时描述：架构改为 SPA + Supabase + Tauri（PocketBase 仅显式回退）、技术栈补充 Supabase、目录树补充 `supabase/` 与 `scripts/supabase/`、部署文档入口。
- 数据迁移工具链（对账 + 导出）已在部署文档中登记为“已就绪”，文件迁移与真实数据导入明确归属上线前动作。

### 验证（部署与多端说明）

- `git diff --check`：通过。
- `node --test scripts/supabase/*.test.mjs`：7/7 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。

## 本地开发文档修正（Supabase-first 现状对齐）

- `docs/supabase/local-development.md` 修正过时声明：默认数据源改为 Supabase，PocketBase 仅作显式回退；环境变量示例改为 `VITE_DATA_PROVIDER=supabase`；阶段边界改为“数据对账与导出已完成，上线前仍需真实数据导入、文件迁移与回滚演练”。
- 全仓扫描确认无残留“默认数据源仍为 PocketBase”类过时声明（历史 specs/plans 与当期验证快照保留原状）。

### 验证（本地开发文档修正）

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。

## 自动化对齐：财务模板触发器（Supabase）

- 新增 Supabase migration `20260813001100_event_finance_templates.sql`：活动创建后自动生成 7 条标准收支模板（赞助收入/票务收入/场地/布置/餐饮/物料印刷/嘉宾差旅，金额 0 占位），与 PB `event_finance_templates.pb.js` 对齐。
- `event_finances.amount` 约束从 `> 0` 放宽为 `>= 0`（新 migration 只加不改，与 PocketBase `min: 0` 对齐）；手动录入校验不变。
- pgTAP `market_resources.test.sql` 计划数 21：新增 2 个断言（建活动自动种 7 条模板、模板金额为 0）。
- 新增自动化对齐矩阵 `docs/2026-08-13-automation-parity.md`：13 个 PB hook 逐一比对，9 类已对齐、4 类属外部服务/账号策略待决策。

### 验证（财务模板触发器）

- `node --test scripts/supabase/*.test.mjs`：7/7 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。
- pgTAP 需要 Docker，本轮环境未运行；断言与迁移同步提交，待本地 `pnpm supabase:test` 回归。

## 验收清单与环境变量对齐（2026-08-13 晚）

- 新增 `docs/验收清单.md`：把 PRD「真实数据验收」与「Supabase 后续切换条件」整理为可勾选清单（市场/商务/设计/剪辑/总览/权限矩阵/远程维护），并标注待决策项（auto-analyze、飞书、注册白名单、邮箱枚举）。
- 修正 `apps/web/.env.example`：`VITE_DATA_PROVIDER=pocketbase` 改为 `supabase`，与 `data-provider.ts` 未配置时的默认值对齐。
- 提交：`31c6a07 docs: add acceptance checklist for real business data`、`99fdb2d docs: align env example with supabase-first default`。

### 验证（验收清单与环境变量对齐）

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。

## 上线前自检脚本（部署准备）

- 新增 `scripts/supabase/deploy-check.mjs`：只读检查 `apps/web/.env`（provider、Supabase 配置完整性、是否误配 service role 等高权限密钥，值一律脱敏不打印）、migration 时间戳是否重复/乱序、部署/验收/自动化对齐文档是否齐全，并输出部署建议顺序。
- 新增测试 `scripts/supabase/deploy-check.test.mjs`：6 个用例（密钥脱敏、env 解析、provider 识别、密钥泄露检测、migration 顺序、报告结构）。
- 提交：`9542774 feat(supabase): add read-only deploy preflight check script`。

### 验证（上线前自检脚本）

- `node --test scripts/supabase/*.test.mjs`：13/13 通过。
- `pnpm supabase:schema:test`：2/2 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，96 个测试文件，211 个测试。

## 剪辑/市场空态收口与页面品牌元信息（2026-08-13 晚）

- 剪辑工作台「发布排期」由单行占位改为结构化引导空态（统一文案 `editingEmptyTitles.schedule` + 禁用入口按钮），与任务/归档空态风格一致。
- 市场选品库搜索无结果时给出专门引导（“没有匹配的商品 / 换个关键词试试”），无搜索时保持原有商品库空态。
- 新增 UI 测试：剪辑发布排期空态文案与禁用按钮、市场搜索无结果引导；门禁从 96 文件 211 测试升至 97 文件 213 测试。
- 清理 `apps/web/index.html` 模板残留：`lang` 改 zh-CN、标题/描述/OG/Twitter 改为项目品牌、移除外部 shadcn-admin 链接与重复 theme-color。
- 提交：`267faa1 feat(ui): guided search empty state and structured schedule empty state`、`808f7dd chore(web): replace template meta with project branding for zh-CN`。

### 验证（空态收口与品牌元信息）

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，97 个测试文件，213 个测试。
- `pnpm --dir apps/web build`：生产构建通过。

## 跨工作台全链路验收（2026-08-13 傍晚）

- 新增 `supabase/tests/acceptance_full_loop.eval.test.sql`（38 断言）：一次事务内跑通「韩素云建活动 → 自动种 7 条财务模板 → 5 阶段任务与进度 → 场地绑定 → 报名 → 招商意向到签约 → 董雨辰商机概率/成交审计 → 流失沉淀 → 公众号爆款 → 逾期沉淀 → 截止提醒 → 日报/周报」完整闭环。
- 本地 Supabase pgTAP 全量 22 个文件 / 389 断言全过（原 21/351 + 新文件 38）。
- 前端门禁：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 97 文件 / 213 测试全过；脚本测试 13/13。
- 本地验收账号（测试库 profiles，幂等创建）：磊哥 boss、董雨辰 business、杨振康 business、孙铭泽 design、谢洁 editing、韩素云 market。
- 提交：`feat(supabase): add cross-workbench acceptance loop test`（见 Git 最新记录）。

## Storage 角色化访问与文件预览收口（2026-08-13 夜间 B1）

- 新增 migration `20260813001200_storage_access.sql`：私有 bucket 按工作台角色开放 storage.objects 策略，不改已有 owner/video 策略。
  - design-assets：读 owner/boss/design，写 owner/design；
  - venue-photos、finance-receipts：读 owner/boss/market，写 owner/boss/market；
  - event-materials：读 owner/boss/market/design，写 owner/boss/market；
  - avatars：全员可读，成员仅可管理自己的 `auth.uid()/` 目录。
- 新增 `apps/web/src/lib/storage-url.ts`：`resolveStorageUrls` / `signStoragePaths` 批量生成带时效（3600s）签名 URL，解析失败静默降级不抛错。
- 前端文件预览收口（Supabase-first，PocketBase 保留回退）：
  - 设计素材列表/审批弹窗的 `fileUrl` 改为签名 URL；
  - 场地列表/详情照片改为签名 URL；
  - 物料卡片新增「预览文件」入口；
  - 财务明细映射新增 `receipt` 字段，录入支持上传凭证（finance-receipts bucket），明细表新增凭证查看入口。
- 新增 pgTAP `supabase/tests/storage_access.test.sql`（12 断言）：策略清单 + market/business/design 上传边界 + 头像自助目录边界 + 全员可读头像；同步更新 `storage_foundation.test.sql` 的策略数量断言。
- 新增 `scripts/supabase/storage-smoke.mjs` + 5 个单元测试：URL 构造、env 解析、无凭据时降级跳过在线步骤（密钥不落仓库）。

### 验证（Storage B1）

- 本地 Supabase `db reset` 全 23 migration 应用成功；pgTAP 23 文件 / 401 断言全过。
- `node --test scripts/supabase/*.test.mjs`：18/18 通过。
- `pnpm typecheck`、`pnpm lint`：零错误零警告。
- `pnpm test`：98 文件 / 217 测试通过。

## PWA 应用外壳离线化（2026-08-13 夜间 B2）

- 新增 `apps/web/public/manifest.webmanifest`：应用名「TK观察工作台」、standalone 展示、主题色 `#1478d7`、浅色背景、192/512 图标（含 maskable）。
- 新增 `apps/web/public/sw.js`：预缓存应用外壳（`/`、`/login`、manifest、favicon、PWA 图标），运行时 Network First、导航回退外壳；显式跳过 `/rest/` 与 `/storage/` 数据接口，离线不缓存业务数据。
- `apps/web/index.html`：装配 manifest link、theme-color、apple-touch-icon、mobile-web-app-capable 与 apple-mobile-web-app-capable 元信息。
- 新增 `apps/web/src/lib/register-sw.ts`：仅生产构建注册 `/sw.js`，dev 跳过；注册失败静默降级，不影响业务。
- `scripts/render-brand-logo.mjs` 新增 `PWA_ICONS` 渲染能力，已产出 `pwa-192.png` / `pwa-512.png`。
- 新增 `apps/web/src/lib/manifest-sw.test.ts`（7 个测试）：manifest 字段/图标可访问、index.html 装配、sw.js 外壳缓存与 Network First 策略、注册逻辑（dev 跳过 / prod 注册 / 无 SW 静默）。

### 验证（PWA B2）

- `pnpm typecheck`：通过，零错误。
- `pnpm lint`：通过，零错误零警告。
- `pnpm test`：99 文件 / 224 测试通过。
- `pnpm build`：生产构建通过，dist 含 manifest.webmanifest、sw.js、pwa 图标，index.html 已装配 PWA 标签。
- `node --test scripts/*.test.mjs scripts/supabase/*.test.mjs`：20/20 通过。

## PocketBase 回退演练脚本与手册（2026-08-13 夜间 B3）

- 新增 `scripts/supabase/pocketbase-rollback.mjs`：只读 dry-run，检查 provider、PocketBase URL、`backend/pb_data/data.db`、migration 文件数、Supabase 导出目录状态，输出 7 步回退操作清单（不写 .env、不启动服务、不访问网络、密钥不落盘）。
- 新增 `scripts/supabase/pocketbase-rollback.test.mjs`（6 个测试）：env 解析、provider 默认值、data.db 缺失检测、导出目录存在/缺失、清单顺序与阻塞文案。
- 新增 `docs/pocketbase-rollback-drill.md`：回退演练手册（人工执行清单、验收标准、回切 Supabase、自动回归命令）。
- 实跑检查：provider=supabase、data.db 存在（843776 字节）、migration 21 个、导出目录 14 个文件，回退清单正常输出。

### 验证（B3）

- `node --test scripts/*.test.mjs scripts/supabase/*.test.mjs`：26/26 通过。

## 商务业务数据幂等导入 Supabase（2026-08-13 夜间 B5）

- 新增 `scripts/supabase/import-business-data.mjs`（12 张父表优先、legacy_id 幂等 upsert、外键子查询翻译）：
  - `TABLE_ORDER`：creators / clients / companies / competitor_accounts / products / gmv_metrics / weekly_reports / audit_logs / notifications / competitor_style_analysis / design_assets / videos。
  - `FK_MAP` 翻译 legacy 外键；`REQUIRED_PROFILE_FKS`（notifications.recipient_id）按行 select-where 守卫，profile 解析不到整行跳过。
  - `BOOLEAN_COLUMNS` 白名单：PocketBase 以 0/1 落盘的布尔列统一转 true/false（creators.is_biz_available、notifications.is_read、venues.is_verified、design_deliverables.checklist_ok、blog_articles.is_viral、editing_research_records.is_viral/converted_to_idea）。
  - CLI：`--dry-run` / `--sql-only` / `--export` / `--url` / `--service-role-key`；无 key 时只出计划不写库。
- 新增 `scripts/supabase/import-business-data.test.mjs`（9 个测试）：父表顺序、计划输出、布尔归一、空串清理、FK 翻译、profile 缺失置空、参数解析、幂等 upsert SQL、notifications 守卫。
- 实跑导入：由 `pb-business-export.json` 生成 SQL 后走 psql 写入本地 Supabase，12 张表核对无悬空外键：
  - audit_logs 4 / clients 1 / companies 1 / competitor_accounts 6 / competitor_style_analysis 1 / creators 1 / design_assets 1 / gmv_metrics 1 / notifications 0（3 条因 profile 引用未命中按设计跳过）/ products 1 / videos 1 / weekly_reports 1。
- 首跑发现并修复：PocketBase 布尔列导出为 0/1 整数，Postgres boolean 拒绝；增加 BOOLEAN_COLUMNS 归一后重跑成功（`INSERT 0 N` 全过）。

### 验证（B5）

- `node --test scripts/*.test.mjs scripts/supabase/*.test.mjs`：34/34 通过。
- `pnpm typecheck`、`pnpm lint`：零错误零警告。
- `pnpm test`：99 文件 / 224 测试通过。
- 本地 Supabase psql 实际导入成功，外键无悬空。

## 前端截图回归 + E2E 客户 CRUD + RLS 软删除修复（2026-08-13 夜间 B6/B7）

- 截图回归（B6）：新增 `apps/web/scripts/capture-screenshots.mjs` + `verify-screenshot-pages.mjs`，产出 6 张页面截图（登录/总览/商务/市场/设计/剪辑）到桌面 PRD 交付包 `前端截图回归-2026-08-13/`，标题内容自检 5/5 PASS。
- E2E 回归（B7）：新增 `apps/web/playwright.config.ts` + `apps/web/e2e/business-crud.spec.ts` + `test:e2e` 脚本（密码经 `TK_OBSERVER_TEST_PASSWORD` 注入，不落仓库），跑通「登录 → 新增客户 → 检索命中 → 删除回收」闭环。
- 根因修复 1（登录 403）：新增 migration `20260813001300_table_grants.sql`，补齐 authenticated / service_role 表级 GRANT。此前本地库只有 RLS 策略缺表级授权，PostgREST 登录后 profiles 等查询返回 403（「登陆不了」根因）。
- 根因修复 2（软删除 403）：新增 migration `20260813001500_soft_delete_select_rls.sql`。PostgreSQL 对 UPDATE 产生的新行会应用 SELECT 策略可见性检查；前端统一用 `update({deleted_at})` 软删除时，新行不再满足旧策略的 `deleted_at is null`，非 owner 角色删除被 RLS 拒绝。已对 clients / creators / channel_orders / social_plans / companies / video_ideas / events 7 张软删除业务表的 SELECT 策略放宽为按角色可见，删除行仍由应用层 `.is('deleted_at', null)` 过滤，业务展示不受影响。
- 顺带对齐：`20260813001400_client_delete_policy.sql` 将 clients 硬删除策略从仅 owner 扩展为 owner/boss/business（与增改权限一致）。
- vitest 配置排除 `e2e/**`：E2E 由 Playwright 独立运行，避免 vitest 误收 spec 并触发依赖优化报错。
- E2E 遗留测试客户行已软删除清理（可恢复）。

### 验证（B6/B7）

- 本地 Supabase SQL 层验证：磊哥（boss）、董雨辰（business）软删除 UPDATE 均通过。
- Playwright E2E：1/1 通过。
- `pnpm typecheck`、`pnpm lint`：零错误零警告。
- `pnpm test`：99 文件 / 224 测试通过。
- `node --test scripts/*.test.mjs scripts/supabase/*.test.mjs`：34/34 通过。

### 提交

- `feat(e2e): business client crud regression + soft-delete RLS harden`（Playwright 配置/E2E/截图脚本/3 个 RLS migration/vitest 排除/gitignore）。

## pgTAP 全量回归加固（2026-08-13 深夜 审计）

- 新增 `supabase/migrations/20260813001600_video_idea_column_grants.sql`：恢复 video_ideas 列级权限。根因：`20260813001300` 的表级 `grant all to authenticated` 覆盖了 video_viral_engine 原有的列级 revoke，客户端可伪造 is_viral / ai_analysis 派生字段；新 migration 重新 revoke 表级 insert/update，只放行输入指标列，派生字段仍由服务端维护。
- 加固 7 个 pgTAP 测试文件（companies / products / editing_production / editing_research_records / overview_dashboard / team_memory / market_business_master_data）：全表 `count(*)` 断言改为按 fixture 行 name/title 限定。根因：新 migration 内的种子数据进入 supabase test db 临时库（companies 1 / products 1 / videos 1 / competitor_accounts 6 / gmv_metrics 1 / daily_reports 1 / creators 1 / clients 1），全表计数不再等于 fixture 数。
- market_business_master_data 另同步 clients 策略名断言（owners and business can hard delete clients，对应 `20260813001400` 重命名）。

### 验证

- `SUPABASE_TELEMETRY_OFF=1 pnpm supabase:test`：23 个测试文件 / 401 断言全过（Result: PASS）。
- 新 migration 已手动应用本地 Supabase 库。

### 提交

- `6fa9a09 fix(supabase): restore video_ideas column grants and harden pgtap assertions`

## 2026-08-14 上午 审计修复 + E2E 扩面（中午前收口）

- 币种统一：`formatMoney` 默认参数从 USD 改为 CNY，总览 GMV 图表 Y 轴 `$k` → `¥k`；新增 format 单测（默认 CNY、显式 USD 不受影响）。全项目仅总览两处使用默认参数，商务/市场已显式 CNY，现全部人民币口径。
- PocketBase 冻结：新增 `scripts/supabase/pocketbase-freeze-check.mjs` + 3 个单测（冻结线 15 个 migration），`pnpm check:pb-freeze` 可校验；README 与部署文档声明「只读回退、不再加业务功能」。
- CI 落地：仓库无 remote，GitHub Actions 无法远端执行；本地等效验证已跑通（typecheck/lint/test 228/build/E2E 4 条/pgTAP 401）。待用户提供私有仓库 remote 后 CI 即可生效。
- E2E 扩面：新增 3 条（市场活动新增-删除、剪辑选题新增-删除、设计需求提交-接单闭环），与既有商务客户 CRUD 共 4 条全过。E2E 暴露并修复 2 个真实 bug：
  - `createSupabasePageQuery` 未自动过滤 `deleted_at`，软删除行仍出现在分页列表（影响所有使用该 helper 的列表）；现统一 `is('deleted_at', null)`，补 2 个单测。
  - 设计需求详情弹窗持有静态快照，设计师接单后状态按钮不刷新；现从最新列表数据派生选中项，接单后可立即看到「已交付」流转。
- 验证：`pnpm test` 100 文件 / 228 测试；`pnpm --dir apps/web build` 通过；`pnpm test:e2e` 4/4；`node --test` 38/38（新增冻结 3 个）；pgTAP 23 文件 / 401 断言 PASS。

### 提交

- `00781aa fix(web): 统一人民币口径 + 列表软删除过滤 + 设计需求状态实时刷新`
- `0b6745f feat(e2e): 市场/剪辑/设计三条工作台 E2E 闭环`
- `e290d5b test(pg): 事务内隔离本地残留数据 稳定计数断言`
- `c502b46 chore(pb): 冻结 PocketBase 只读回退 + check:pb-freeze 校验`

## 2026-08-14 上午续：市场活动详情 6 Tab E2E

- 活动详情页代码已含 6 Tab 完整渲染（概览阶段进度、任务看板拖拽、招商/报名列表、财务 CSV+Markdown 导出、进度总览四块指标），此前缺自动化覆盖。
- 新增市场 E2E 用例：新建活动 → 点击进入详情 → 逐 Tab 切换并断言内容（活动阶段/任务看板空态/招商空态/报名空态/导出按钮/进度总览）→ 返回删除回收。
- 验证：E2E 5/5 通过（商务客户、设计需求闭环、剪辑选题、市场活动 CRUD、活动详情六 Tab）；build 通过。
- 验收清单市场「活动详情 6 Tab 可切换」勾选。

## 2026-08-14 上午续二：商务商机 Pipeline E2E + 软删除 RLS 修复

- 新增商务 E2E 用例 `e2e/opportunity-pipeline.spec.ts`：登录董雨辰 → 建客户 → 建商机（客户弹窗+combobox 选客户）→ 看板拖拽「初步接洽 → 方案报价」→ 详情改「已流失」（空原因前端拦截，填原因后落位）→ REST 软删除商机 + UI 删客户回收。
- E2E 暴露真实 bug：`opportunities` 的 SELECT 策略含 `deleted_at is null or owner`，business 软删除时 PostgreSQL 对 UPDATE 新行做 SELECT 可见性检查，返回 403 `new row violates row-level security policy`。修复：新增 migration `20260814000100_opportunity_soft_delete_select_rls.sql`，SELECT 策略放宽为 owner/boss/business 按角色可见（与 `20260813001500` 七表同模式），删除行由前端统一 `.is('deleted_at', null)` 过滤。
- 本地 dev 库补齐此前缺失的 5 个迁移记录（01300/01400/01500/01600/14000100）并应用幂等 SQL；`business_transactions.test.sql` 断言数 24 → 26（新增：business 软删除商机可执行、boss 看不到非软删行、boss 可查看软删行）。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 100 文件 / 228 测试；pgTAP 23 文件 / 403 断言 PASS；E2E 6/6 通过（新增商机 Pipeline，含拖拽与流失必填）。

### 提交

- `cdc1392 feat(e2e): 商务商机看板拖拽+已流失必填闭环`（含 migration 20260814000100 与 pgTAP 断言扩展）

## 2026-08-14 上午续三：朋友圈计划 E2E

- 新增商务 E2E 用例 `e2e/social-plan.spec.ts`：登录董雨辰 → 新增朋友圈计划（日期=今天，确保落入周视图）→ 日历视图可见 → 列表视图状态流转「已计划 → 已发布」→ 删除回收。
- 验证：E2E 7/7 通过（商务客户、商机 Pipeline、朋友圈计划、设计需求、剪辑选题、市场活动 CRUD、活动详情六 Tab）；typecheck/lint 零错误；`pnpm test` 100 文件 / 228 测试；pgTAP 23 文件 / 403 断言 PASS。
- 验收清单商务「朋友圈计划」勾选。

### 提交

- `dac14b2 feat(e2e): 朋友圈计划新增-状态流转-删除闭环`

## 2026-08-14 上午续四：设计工作台软删除 RLS 对齐

- 新增 migration `supabase/migrations/20260814000200_design_soft_delete_select_rls.sql`：设计五表（design_assets / design_tasks / design_requirements / design_references / design_deliverables）SELECT 策略放宽为角色可见（同 `20260814000100` / `20260813001500` 七表模式），软删除行由前端统一 `.is('deleted_at', null)` 过滤，消除软删除 403 根因。
- 本地 dev 库已手工应用该 migration 并记录 `schema_migrations`；`design_workspace.test.sql` 断言 23 → 25（新增：design 软删除素材可执行、boss 可查看软删行）。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 100 文件 / 228 测试；pgTAP 23 文件 / 405 断言 PASS。
- 验收清单无需新增勾选（基础设施修复，不改变验收项）。

### 提交

- `3d733f6 feat(supabase): 设计五表软删除 RLS 对齐 + pgTAP 405`

## 2026-08-14 下午续：活动招商跨工作台 E2E（录入-跟进闭环）

- 新增 E2E 用例 `e2e/sponsorship-flow.spec.ts`：董雨辰在商务工作台录入赞助意向 → 韩素云在市场工作台活动详情「招商跟进」Tab 看到同一数据 → 更新状态为已确认 → 董雨辰侧只读看到状态变化，完成跨工作台共享数据闭环。
- 修复 `switchAccount` 切换登录失效根因：Supabase 会话在 localStorage、用户态在 sessionStorage，只清前者会导致旧用户态残留、`/login` 路由守卫误重定向。修复为同时 `sessionStorage.clear()`。
- 修复赞助公司名不显示：`clients` 表列名为 `company`（非 `company_name`），Supabase join 返回 `clients: { company, name }`。活动详情查询改 `clients(company, name)`，`market-mappers` 映射优先 `company`、空值回退 `company_name`/`name`（补 2 个单测）。
- 修复 REST 直写不触发 react-query 失效：用例改为插入后 `page.reload()` 再断言，避免空态假失败。
- `playwright.config.ts`：baseURL/webServer 固定 IPv4 `127.0.0.1`；支持 `E2E_USE_EXTERNAL_SERVER=1` 跳过内置 webServer（沙箱 EPERM 兼容）。
- `e2e/helpers.ts` 新增 `findRowId` / `insertEventSponsorship` / `softDeleteSponsorship`。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 101 文件 / 234 测试；pgTAP 25 文件 / 450 断言 PASS；E2E 11/11 通过（新增活动招商跨工作台用例）；build 通过。
- 本地 dev 库物理清理历史 E2E 残留（events/event_sponsorships/event_finances/clients/opportunities/channel_orders/social_plans/venues/video_ideas/design_* 等），验证全部 `E2E%` 计数为 0，仅保留种子达人 `E2E可商务达人`（order-status.spec.ts 依赖）。
- 验收清单市场「活动详情招商跟进 Tab（与商务共享数据）」勾选。

### 提交

- `7662882 feat(e2e): 活动招商跨工作台录入-跟进闭环`

## 2026-08-14 上午续五：设计素材审核闭环 E2E + 列表排序修复

- 新增 E2E 用例 `e2e/design-review-loop.spec.ts`：孙铭泽上传素材 → 提审 → 磊哥驳回（空理由被前端拦截，填理由后驳回）→ 孙铭泽看到驳回理由再提审 → 磊哥通过。首次跑暴露真实 bug：`useDesignAssets` Supabase 分支直接按 `params.sort` 的 `updated/created` 排序，而 Supabase 列名为 `updated_at/created_at`，列表请求 400 导致素材库永远空态。修复：新增 `toSupabaseDesignAssetSort` 映射（同 use-creators 模式）+ 单测。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 100 文件 / 229 测试；E2E 8/8 通过（新增设计素材审核闭环）；build 通过；测试残留数据已软删除。
- 验收清单设计「素材上传后提交审核；磊哥通过或驳回（驳回理由必填）」勾选（通知到孙铭泽由 pgTAP notifications 覆盖）。

### 提交

- `3515038 feat(e2e): 设计素材审核闭环 + 列表排序映射修复`

## 2026-08-14 上午续六：软删除 RLS 第四轮全表排查收口

- 全量排查 pg_policies：仍有 21 张软删除表的 SELECT 策略带旧模式 `(deleted_at IS NULL) OR owner`，且存在非 owner 角色可 UPDATE/ALL（同 403 根因）。新增 migration `supabase/migrations/20260814000300_soft_delete_select_rls_round4.sql`，对 20 张表 SELECT 策略放宽为按角色可见：
  - 商务：blog_articles
  - 剪辑：competitor_accounts / competitor_style_analysis / competitor_videos / import_history / trending_topics / video_tasks / videos
  - 市场：venues / event_phases / event_tasks / event_registrations / event_sponsorships / event_templates / event_materials / event_finances / products
  - 总览：gmv_metrics / team_tasks
  - 通知：notifications（recipient 本人）
- 排查结论（本轮不改）：audit_logs / daily_reports / failed_cases / weekly_reports 仅 owner 可写，boss 只读，无软删除 403 路径；event_tasks 的 assigned 角色策略保持原样——触发器 `enforce_event_task_collaborator_update` 已禁止 business/design/editing 修改 deleted_at，不存在软删除路径，不放宽（新增 pgTAP 断言验证其策略仍带 deleted_at 门槛）。
- 新增 `supabase/tests/soft_delete_select_rls_round4.test.sql`：37 个断言（21 策略层 + 16 角色实测），覆盖 market/business/editing/boss/recipient 五类角色软删除（venues / products / blog_articles / videos / competitor_accounts / event_tasks / gmv_metrics / team_tasks / notifications），并验证软删行可查看、活行被 `.is('deleted_at', null)` 过滤。
- 清理本地 dev 库 6 条 E2E/DBG 测试残留（file_name 前缀 E2E素材/DBG素材，已软删后物理清除），恢复 design_workspace 测试计数断言。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 100 文件 / 229 测试；pgTAP 24 文件 / 442 断言 PASS。
- 验收清单无需新增勾选（基础设施修复，不改变验收项）。

### 提交

- `53e280b feat(supabase): 软删除 RLS 第四轮全表收口 + pgTAP 442`

## 2026-08-14 上午续七：市场场地资源 E2E（照片上传 + 详情轮播 + 删除回收）

- 场地卡片新增悬浮删除按钮（`useSoftDeleteVenue`：Supabase 分支软删 `deleted_at`，PocketBase 回退 `delete`），Card 补齐 `group relative` 定位保证按钮随卡片 hover 可见、可点击。
- 新增 E2E 用例 `e2e/venue-resource.spec.ts`：登录韩素云 → 场地资源 Tab → 新增场地（名称/城市必填 + TINY_PNG 照片上传）→ 列表卡片可见且封面渲染 → 点卡片进详情看照片轮播 → 关闭 → 悬浮删除按钮软删回收 → API 兜底清理确认无残留。
- `e2e/helpers.ts` 新增 `softDeleteVenue(page, name)`（复用 `softDeleteDesignAsset` 的 REST PATCH 模式）。
- 本地 dev 库物理清理本轮 E2E 软删除残留（1 条 `E2E素材-*` 设计素材、2 条 `E2E场地-*` 场地），恢复 `design_workspace` 软删计数断言。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 100 文件 / 229 测试；pgTAP 24 文件 / 442 断言 PASS；E2E 9/9 通过；build 通过。
- 验收清单市场「场地资源库：新增/编辑表单支持多图上传、卡片删除」勾选。

### 提交

- `8a84221 feat(e2e): 市场场地照片上传闭环 + 悬浮删除`

## 2026-08-14 下午：渠道商单取消原因（数据库约束 + 前端必填弹窗 + E2E）

- 新增 migration `supabase/migrations/20260814000400_channel_order_cancel_reason.sql`：`channel_orders` 追加 `cancel_reason` 列（≤1000 字符）+ 检查约束 `channel_orders_cancel_reason_check`（status=cancelled 时取消原因必填，数据库兜底）。
- 新增 pgTAP `supabase/tests/channel_order_cancel_reason.test.sql`（8 断言）：列与约束存在、business 可建商单、空原因取消报 23514、带原因可取消并持久化、可流转回 completed。
- 前端：`order-status-update.ts`（cancelled 空原因抛 `CANCEL_REASON_REQUIRED`，3 单测）、`order-mapper.ts` 映射 `cancel_reason`（`OrderRow.cancelReason`）、`orders-workbench.tsx` 状态切「已取消」弹必填原因弹窗，确认后列表状态下拉 title 显示取消原因。
- 新增 E2E `e2e/order-status.spec.ts`：董雨辰建客户 → 建商单（选可商务达人）→ 状态切「已取消」空原因按钮禁用 → 填原因确认 → 列表显示已取消+原因 tooltip → 删除回收。
- 排查并修复 E2E 假失败根因：端口 4173 上残留旧 `vite preview` 进程提供过期 dist，导致「已取消」走旧逻辑被数据库新约束拒绝（400）；重构建 + 重启预览服务后闭环通过。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 101 文件 / 232 测试；pgTAP 25 文件 / 450 断言 PASS；E2E 10/10 通过；build 通过；E2E 测试残留（3 商单 + 3 客户 + 1 达人种子）已物理清理，开发库无残留。
- 验收清单商务「渠道商单：已取消需填原因」勾选。

### 提交

- `7d6f93c feat(business): 渠道商单取消原因必填 + E2E 闭环`

## 2026-08-14 下午续：活动招商跨工作台 E2E（录入-跟进闭环）

- 新增 E2E 用例 `e2e/sponsorship-flow.spec.ts`：董雨辰在商务工作台录入赞助意向 → 韩素云在市场工作台活动详情「招商跟进」Tab 看到同一数据 → 更新状态为已确认 → 董雨辰侧只读看到状态变化，完成跨工作台共享数据闭环。
- 修复 `switchAccount` 切换登录失效根因：Supabase 会话在 localStorage、用户态在 sessionStorage，只清前者会导致旧用户态残留、`/login` 路由守卫误重定向。修复为同时 `sessionStorage.clear()`。
- 修复赞助公司名不显示：`clients` 表列名为 `company`（非 `company_name`），Supabase join 返回 `clients: { company, name }`。活动详情查询改 `clients(company, name)`，`market-mappers` 映射优先 `company`、空值回退 `company_name`/`name`（补 2 个单测）。
- 修复 REST 直写不触发 react-query 失效：用例改为插入后 `page.reload()` 再断言，避免空态假失败。
- `playwright.config.ts`：baseURL/webServer 固定 IPv4 `127.0.0.1`；支持 `E2E_USE_EXTERNAL_SERVER=1` 跳过内置 webServer（沙箱 EPERM 兼容）。
- `e2e/helpers.ts` 新增 `findRowId` / `insertEventSponsorship` / `softDeleteSponsorship`。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 101 文件 / 234 测试；pgTAP 25 文件 / 450 断言 PASS；E2E 11/11 通过（新增活动招商跨工作台用例）；build 通过。
- 本地 dev 库物理清理历史 E2E 残留（events/event_sponsorships/event_finances/clients/opportunities/channel_orders/social_plans/venues/video_ideas/design_* 等），验证全部 `E2E%` 计数为 0，仅保留种子达人 `E2E可商务达人`（order-status.spec.ts 依赖）。
- 验收清单市场「活动详情招商跟进 Tab（与商务共享数据）」勾选。

### 提交

- `7662882 feat(e2e): 活动招商跨工作台录入-跟进闭环`

## 2026-08-14 下午续二：活动财务模板种子 Supabase-first（读取 + 新增 + E2E）

- `use-activity-detail.ts` Supabase 分支补齐 `event_finances` 读取（`is('deleted_at', null)` + `paid_at` 排序），`finances` 不再硬编码空数组；`useCreateActivityFinance` 改为 Supabase-first（insert `event_id/category/type/amount/description/paid_at`），PocketBase 保留显式回退。
- `ActivityRelatedRecord` 新增 `description` 字段，`market-mappers` 映射 `description`（财务模板行描述），`RecordList` 显示回退链补 `description`（财务行显示「赞助收入/场地费」等模板名而非「未命名记录」）。
- `market-mappers.test.ts` 补财务模板行映射用例（gate tests 235 个）。
- `e2e/market-events.spec.ts` 财务复盘 Tab 断言新建活动后自动种出的 7 条模板行可见（赞助收入/票务收入/场地费/布置费/餐饮费/物料印刷/嘉宾差旅）。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 101 文件 / 235 测试；pgTAP 25 文件 / 450 断言 PASS；E2E 11/11 通过；build 通过；E2E 残留（events/event_finances/design/venues/videos/social/orders/opps/clients）已物理清理，仅保留 `E2E可商务达人`。
- 验收清单市场「活动财务模板自动创建并展示」勾选。

### 提交

- `62fcff7 feat(market): 活动财务模板种子 Supabase-first 读取+新增+E2E`

## 2026-08-14 下午续三：团队日历挂起 Bug 根因定位 + 修复 + 跨角色 E2E

- 根因：`use-team-calendar.ts` 的 queryKey 含 `date.toISOString()`（毫秒级时间戳）。顶部时钟组件每分钟触发整页重渲染，React Query 每次渲染都生成新 key、作废旧请求并重新发起 5 个 `/rest/v1/` 请求，浏览器持续重发，请求永远 loading，团队日历只渲染表头不渲染日期格与排期项。
- 修复：`apps/web/src/features/overview/hooks/use-team-calendar.ts` queryKey 改为稳定值 `['overview', 'team-calendar', getFullYear(), getMonth()]`（满足 `@tanstack/query/exhaustive-deps`）。
- 新增稳定性回归测试 `use-team-calendar.stability.test.tsx`：模拟 Ticker 强制重渲染 5 次，断言 5 个表各只请求 1 次。已用「临时还原旧 key → 测试失败 → 恢复 → 通过」验证测试能捕获该 Bug。
- 新增 E2E `e2e/team-calendar.spec.ts`：董雨辰建今天朋友圈计划 → 切磊哥 `/overview/calendar` 看到「朋友圈 · 内容」→ 切回董雨辰软删除回收；`e2e/helpers.ts` 新增 `softDeleteSocialPlansByPrefix`；用例开头先清理 `E2E日历` 前缀数据，断言改切列表视图避免日历视图截断影响。
- 修复 `supabase/tests/design_workspace.test.sql` 第 144 行按 fixture id 限定软删计数，避免被历史 E2E 残留污染（全表 count 导致 1 vs 2 假失败）。
- 本地 dev 库物理清理全部 E2E 残留（event_sponsorships 1 / event_finances 21 / event_phases 0 / event_registrations 0 / channel_orders 1 / opportunities 1 / events 3 / clients 4 / social_plans 6 / venues 1 / video_ideas 1 / design_requirements 1 / design_assets 0），仅保留种子达人 `E2E可商务达人`（order-status.spec.ts 依赖）。
- 关键教训：跑完 rebuild 才部署新代码。此前 E2E 的 vite preview 一直服务旧 dist，修复后仍复现旧行为；`pnpm --dir apps/web build` 后重新跑 E2E 才通过。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 236 测试；pgTAP 25 文件 / 450 断言 PASS；E2E 12/12 通过（33.4s）；build 通过。
- 验收清单总览「跨工作台排期聚合（团队日历）」勾选。

### 提交

- `600110d feat(overview): 团队日历查询键稳定性修复 + 跨角色 E2E`

## 2026-08-14 下午续四：达人商务标记闭环（跨角色 E2E）

- 商务工作台达人管理补齐商务标记三件套：`Creator` 类型新增 `isBizAvailable / cooperationPrice / cooperationNotes`，`creator-mapper.ts` 映射 Supabase 的 `is_biz_available / cooperation_price / cooperation_notes` 并序列化回写（business 经 RLS + `enforce_creator_business_update` 触发器只能改这三个字段）。
- 达人列表新增「商务标记」列（可商务合作 Badge）与「只看可商务合作」筛选（URL 参数 `bizOnly`，Supabase/PocketBase 双源过滤）；`global-search.tsx` 跳转补齐新参数。
- 达人详情抽屉新增「商务合作标记」只读区块：可商务合作 Badge、报价（分→元）、备注。
- 达人表单新增：可商务合作 Switch、合作报价输入（元→分存储）、合作备注 Textarea。
- 新增 E2E `e2e/creator-biz-mark.spec.ts`：谢洁 REST 建达人 → 董雨辰标记可商务合作（报价 ¥880 + 备注）→ 列表 Badge + 详情只读展示 → 只看可商务筛选 → 商单新增表单达人下拉只列可商务达人（含新标记达人）→ 谢洁软删回收；`e2e/helpers.ts` 新增 `insertCreator` / `softDeleteCreatorsByPrefix`。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试（mapper 新增双源序列化断言）；pgTAP 25 文件 / 450 断言 PASS；E2E 13/13 通过（35.9s，新增达人商务标记用例）；build 通过。
- 本地 dev 库按依赖顺序物理清理本轮 E2E 残留（creators 3 / clients 4 / events 3 + 子表 / venues 1 / channel_orders 1 / opportunities 1 / social_plans 2 / design_assets 1 / video_ideas 1），验证各表 `E2E%` 计数为 0，仅保留种子达人 `E2E可商务达人`。
- 验收清单商务「达人商务标记：可商务合作筛选 + 报价/备注只读展示」勾选。

### 提交

- `2a42fc3 feat(business): 达人商务标记闭环 + 跨角色 E2E`

## 2026-08-14 下午续五：设计需求详情参考/交付记录子 Tab E2E 闭环

- 新增 E2E `e2e/design-requirement-subtabs.spec.ts`：孙铭泽建素材并提审 → 磊哥审核通过 → 磊哥提交设计需求 → 孙铭泽在详情「视觉参考」Tab 填图片链接/来源/备注添加参考 → 「交付记录」Tab 选已通过素材 + 尺寸/格式 + 检查勾选添加交付 → 磊哥重新打开详情只读看到交付记录（素材名/尺寸/检查通过 Badge）且无「添加参考/添加交付」编辑表单 → 按依赖顺序软删除回收（交付/参考/素材/需求）。
- `e2e/helpers.ts` 新增通用 `softDeleteRowsByFieldPrefix`（按字段前缀软删除指定设计表记录，调用方需持有对应角色权限）。
- 修复 `e2e/design-request-flow.spec.ts` 残留问题：原用例不回收需求，每次全量跑都留一条 in_progress 残留；追加 boss 侧软删除回收（保留 bossContext 到用例末尾）。
- 修复 pgTAP `design_workspace.test.sql` 交付计数断言被 E2E 软删残留污染（全表 count 1 vs 4 假失败）：改为按 fixture requirement_id 限定计数，永久免疫软删残留。
- 本地 dev 库物理清理本轮失败运行遗留的 E2E 行（3 交付 + 3 参考 + 4 素材 + 5 需求），验证全部 `E2E%` 计数 live=0，仅保留种子达人 `E2E可商务达人`。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；pgTAP 25 文件 / 450 断言 PASS；E2E 14/14 通过（42.2s，新增需求详情子 Tab 用例）；build 通过。
- 验收清单设计「需求详情页展示参考图与交付记录子 Tab」勾选。

### 提交

- `feat(e2e): 设计需求详情参考/交付记录子 Tab 闭环`

## 2026-08-14 下午续六：剪辑工作台对标/热点录入交互 E2E 闭环

- 新增 E2E `e2e/editing-research-entry.spec.ts`（3 条用例）覆盖谢洁侧此前只有代码无真机验证的录入交互：
  - 对标账号爆款视频录入（标题/链接/日期/播放量/点赞/内容标签/为什么爆/可借鉴点）→ 列表回显 → 分析笔记二次编辑回显；
  - 风格分析粘贴解析（六段式 AI 结果 → 解析并保存 → 风格分析历史出现内容定位与可借鉴建议）；
  - 热点话题批量解析入库（`---` 分隔两条结构化结果 → 卡片按热度展示 → 转为选题跳到选题库并预填标题）。
- `e2e/helpers.ts` 新增 `insertCompetitorAccount`（editing 角色 REST 建前置对标账号）与 `softDeleteRowsByFieldValue`（uuid 外键精确值软删，uuid 不支持 like 通配）；`softDeleteRowsByFieldPrefix` 表类型扩展到剪辑 4 表。
- 修复趋势页「调研趋势」按钮二义性（空态 action 与页头按钮各一个），用例改为 `.first()`。
- 本地 dev 库 E2E 残留验证：competitor_accounts / competitor_videos / competitor_style_analysis / trending_topics 的 `E2E%` live 计数均为 0。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；E2E 17/17 通过（49.0s，新增剪辑录入 3 条）；build 通过。
- 验收清单剪辑「对标账号视频录入 / 风格分析录入 / 热点话题批量解析」真机交互项可勾选（代码早已实现，本轮补齐 E2E 证据）。

### 提交

- `2a00558 feat(e2e): 剪辑工作台对标/热点录入交互 E2E 闭环`

## 2026-08-14 下午续七：市场资源库 E2E 闭环（模板/物料/财务导出）

- 新增 E2E `e2e/market-resources.spec.ts`：登录韩素云 → 新建活动 `E2E资源活动-${ts}` → 覆盖三个资源子模块：
  - 文案模板：录入含 `{{活动名称}}` 占位符正文 → 新增 → 列表「使用 0 次」→ 预览保留占位符 → 「套用到活动」后预览替换实际值 → 「使用 1 次」；
  - 物料管理：海报类型 + 上传 TINY_PNG + 备注 → 卡片显示名称/类型/「预览文件」链接；
  - 财务明细：收入/赞助收入 + 金额（元）→ 新增 → 表格显示 `¥120,000.00` → 下载 `event-finances.csv` 与 `event-finances.md` 并读取文件内容断言；
  - finally 按依赖顺序软删模板/物料/财务/活动回收。
- 修复 `useMarkTemplateUsed` Supabase 双重计数：Supabase 已有 `bump_event_template_usage` 触发器按 `last_used_at` 自动 +1，原前端同时写 `usage_count` 与 `last_used_at` 导致实际「使用 2 次」；改为只写 `last_used_at`（PocketBase 分支保留原逻辑）。
- 修复市场资源库财务表格金额显示 bug：`{row.amount}`（分）→ `formatFinanceCny(row.amount)`（元）。
- `e2e/helpers.ts` 清理上一轮遗留的重复 `TINY_PNG` 定义段，当前文件仅一组助手。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试全过；`pnpm --dir apps/web build` 通过；E2E 18/18 全过（51.2s，新增市场资源库用例后 17→18）；残留验证 events/templates/materials/finances `E2E%` live 计数全为 0。
- 验收清单市场第 3 条「录入场地、文案模板、物料与财务明细，验证筛选/搜索/导出」勾选（导出与录入由本用例自动覆盖；筛选/搜索交互留待真机）。

### 提交

- `feat(e2e): 市场资源库模板/物料/财务导出闭环`

## 2026-08-14 下午续八：朋友圈复盘回填闭环（回填交互 + 商机来源自动追加 + E2E）

- 新增 migration `supabase/migrations/20260814000500_social_plan_review_notes.sql`：`social_plans` 关联商机（`linked_opportunity_id`）时由触发器 `social_plan_link_opportunity_notes` 自动在商机 notes 追加「来源：朋友圈 M月D日 内容」；同一行内容幂等不重复追加，另一条朋友圈再追加新行，目标商机必须未软删除。
- pgTAP `team_memory_automation.test.sql` 追加 7 条断言（plan 51→58）：触发器存在、关联后 notes 含来源、断开重连不重复（次数=1）、第二条朋友圈追加（次数=2）。
- 前端 `social-workbench.tsx` 补齐复盘闭环：列表新增「复盘」列（显示 actualResult 或 —）与复盘按钮；「复盘朋友圈计划」弹窗回填实际效果 + 选择转化商机（Supabase 展开客户名，PocketBase `expand: 'client'`）→ 保存写 `actual_result` / `linked_opportunity_id` / status=reviewed。
- `social-plan-mapper.ts` 补 `actualResult` / `linkedOpportunityId` 映射 + 单测。
- 新增 E2E `e2e/social-plan-review.spec.ts`：董雨辰建客户+商机 → 新增朋友圈计划 → 发布 → 复盘弹窗填实际效果并选商机 → 列表显示已复盘与效果 → 商机 notes 被触发器追加「来源：朋友圈」→ 软删商机/朋友圈计划 + UI 删客户回收。
- 本地测试账号密码统一重置为 `TK_OBSERVER_TEST_PASSWORD（仅本机环境变量）`（GoTrue admin API，6 个账号），E2E 密码注入恢复可用。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；pgTAP 25 文件 / 457 断言 PASS；`pnpm --dir apps/web build` 通过；E2E 19/19 全过（新增复盘用例后 18→19）；残留验证 social_plans / opportunities / clients 的 `E2E%` live 计数全为 0。
- 验收清单商务「朋友圈计划：发布后回填结果/转化商机与 notes 自动追加」从部分覆盖改为全勾。

### 提交

- `feat(business): 朋友圈复盘回填 + 商机来源自动追加闭环`

## 2026-08-14 下午续九：市场场地多图上传 E2E 闭环（验收清单最后一项）

- 扩展 E2E `e2e/venue-resource.spec.ts`：新增场地时一次上传 2 张照片（`setInputFiles` 数组），断言列表封面渲染、详情默认显示第 1 张 → 点「下一张」切到第 2 张 → 点「上一张」切回第 1 张 → 关闭删除回收。
- 场地详情轮播的前一张/后一张按钮只在 `photos.length > 1` 时渲染，本轮 E2E 首次真机验证多图分支。
- 验收清单市场「上传场地照片（多图）」从待真机改为全勾，验收清单不再有未勾选项。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；`pnpm --dir apps/web build` 通过；E2E 19/19 全过（场地用例 1.7s）；残留验证 venues `E2E%` live=0。

### 提交

- `test(e2e): 场地多图上传与详情轮播切换闭环`

## 2026-08-14 下午续十：场地/客户筛选搜索 E2E 闭环（验收清单剩余待真机交互转自动覆盖）

- 新增 E2E `e2e/venue-filter.spec.ts`：韩素云建两个不同城市/类型/标签的场地 → 名称搜索（只命中 A）、标签搜索（海景命中 A）、城市筛选（厦门→A / 上海→B）、类型筛选（五星酒店→A / 创意空间→B）、重置后两个都可见 → 删除回收。
- 新增 E2E `e2e/client-filter.spec.ts`：董雨辰建两个不同行业/来源/重要度的客户 → 名称搜索、对接人搜索（都只命中 A）、行业筛选（品牌方→A 可见 B 隐藏）、来源筛选（朋友圈获客→A 隐藏 B 可见）、重要度筛选（S→A 可见 B 隐藏）、重置后两个都可见 → 软删回收。
- 验收清单市场「筛选/搜索交互仍待真机」与商务「行业/来源/重要度筛选交互待真机」均改为自动覆盖；验收清单全部条目均已由自动验收或真机 E2E 覆盖。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；`pnpm --dir apps/web build` 通过；全量 E2E 21/21 全过（1.2m，新增 2 条用例）；残留验证 venues / clients `E2E筛选%` live=0。

### 提交

- `test(e2e): 场地与客户筛选搜索交互闭环`

## 2026-08-14 下午续十一：活动任务看板拖拽 E2E 闭环（验收清单最后一个待真机交互）

- 新增 E2E `e2e/activity-task-board.spec.ts`：韩素云建活动 `E2E任务看板-${ts}` → 详情页 URL 取 eventId → REST 注入 P0 阶段（`event_phases`，`return=representation` 取回 id）与两条任务（todo / in_progress）→ 重载进「任务看板」Tab → 断言待处理/进行中两列各就各位 → 拖拽任务 A（待处理→进行中）→ 断言目标列 +1、源列 -1（实时状态更新）→ 按依赖顺序软删任务 → 阶段 → 活动回收。
- `e2e/helpers.ts` 新增 5 个助手：`insertEventPhase`（返回新阶段 id）、`insertEventTask`、`softDeleteEventTasks`、`softDeleteEventPhases`（复用 `softDeleteRowsByFieldValue` 按 event_id 软删）、`softDeleteEvent`（REST 软删活动，与 UI「删除活动」同行为）。
- 确认 RLS/触发器约束：market 角色对 event_tasks 有 insert/update 权限；`enforce_event_task_collaborator_update` 仅限制 business/design/editing 改 status/notes 之外字段，market 软删任务不受阻；拖拽状态更新走 `useUpdateActivityTask`（PATCH status），阶段完成度由 `handle_event_task_phase_completion` 自动刷新。
- 验收清单市场「阶段进度自动计算；看板拖拽交互待真机」改为自动覆盖（E2E 证据），验收清单全部「待真机」交互项均已由自动验收或 E2E 覆盖（动效/实时到达/移动端真机项除外，属用户预览范畴）。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；`pnpm --dir apps/web build` 通过；单跑新用例 1/1 通过（1.8s）；全量 E2E 22/22 全过（1.2m，21→22）；残留验证 events / event_tasks / event_phases `E2E任务看板%` live=0。

### 提交

- `test(e2e): 活动任务看板拖拽闭环`

## 2026-08-14 下午续十二：设计任务看板拖拽 E2E 闭环

- 新增 E2E `e2e/design-task-board.spec.ts`：孙铭泽登录 → 设计工作台「设计任务」Tab → 「新增任务」弹窗建 `E2E设计任务-${ts}`（默认落待设计列）→ 断言待设计列卡片可见 → `dragTo` 拖到「进行中」列 → 目标列 +1、源列 0（实时状态更新）→ `softDeleteRowsByFieldValue` 按 title 软删回收。
- 复用商机看板已验证的 HTML5 dataTransfer 拖拽模式（`design-tasks-board.tsx` onDrop 读 `dataTransfer.getData('text/plain')`），与 `opportunity-pipeline.spec.ts` 同一机制，无需改业务代码。
- 验收清单设计新增「设计任务四列看板：新增落待设计 + 拖拽流转」自动覆盖项。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；`pnpm --dir apps/web build` 通过；单跑新用例 1.7s 通过；全量 E2E 23/23 全过（1.2m，22→23）；残留验证 design_tasks `E2E设计任务%` live=0。

### 提交

- `test(e2e): 设计任务看板拖拽闭环`

## 2026-08-14 下午续十三：场地快速匹配 E2E 闭环（城市/人数/类型组合筛选）

- 新增 E2E `e2e/venue-quick-match.spec.ts`：韩素云建两个不同城市/类型/容纳人数的场地（A 厦门/五星酒店/50-100，B 上海/创意空间/200-300）→ 打开「快速匹配」面板 → 城市=厦门 只命中 A → 人数 80 仍只命中 A → 城市=上海+人数 80 两个都不命中 → 人数 250 只命中 B → 清空人数 → 城市=全部 → 类型=五星酒店 只命中 A → 收起面板 → 软删回收。
- `e2e/helpers.ts` 新增 `softDeleteVenuesByPrefix`（按名称前缀 + 未软删列出 id 逐条 PATCH，仿 `softDeleteSocialPlansByPrefix`）；`venue-quick-match.spec.ts` 与 `venue-filter.spec.ts` 登录后先按各自前缀清理历史失败残留，失败运行遗留脏数据不再污染断言。
- 清理历史残留：`docker exec psql` 将 4 条 `E2E匹配场地%` 未软删行软删（UPDATE 4），最终残留 live=0。
- 验收清单市场「录入场地…验证筛选/搜索/导出」条目补充快速匹配组合筛选自动覆盖。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 102 文件 / 237 测试；`pnpm --dir apps/web build` 通过；单跑 2 条场地用例 11.4s 全过；全量 E2E 24/24 全过（1.3m，23→24）；残留验证 venues `E2E匹配场地%` / `E2E筛选场地%` live=0。

### 提交

- `test(e2e): 场地快速匹配城市/人数/类型组合筛选闭环`

## 2026-08-14 下午续十四：客户详情关联商机/商单点击跳转闭环

- 前端业务改动（直达路由 + 自动定位）：客户详情「关联商机/关联商单」面板条目由静态展示改为可点击按钮（ArrowUpRight 图标），点击后：
  - 跳转商务工作台对应 Tab，`business/index.tsx` 的 `recordType` 扩为 `'creator' | 'company' | 'opportunity' | 'order'`，`onFocus` 把 `recordType/recordId/tab` 写进 URL；
  - `OpportunitiesWorkbench` 支持 `focusId`：数据加载后自动打开对应商机详情（consumedFocus 防重复）；`OrdersWorkbench` 支持 `focusId`：目标行 `bg-primary/5` 高亮并 `scrollIntoView` 定位。
- `RelationBlock` 从 `clients-workbench.tsx` 导出，支持 `onOpenRelated` 回调；新增 UI 测试 `relation-block.test.tsx`（3 条：点击回调传类型+ID、空态无按钮）。
- `e2e/helpers.ts` 新增 `softDeleteChannelOrder`、`softDeleteRowsByFieldLike`；新增 E2E `client-relation-jump.spec.ts`：建客户+商机+商单 → 详情点「关联商机」→ 跳商机 Pipeline 自动开详情 → Esc 关闭 → 点「关联商单」→ 跳渠道商单并断言高亮 → 软删回收。修复过程：Dialog 关闭按钮 role 不可靠导致上一版卡住，改用 `page.keyboard.press('Escape')` 后通过。
- 验收清单商务新增「客户详情关联面板：商机/商单点击跳转自动覆盖」。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 103 文件 / 240 测试；`pnpm --dir apps/web build` 通过；单跑新用例 6.9s 通过；全量 E2E 25/25 全过（1.4m，24→25）；残留验证 clients / opportunities / channel_orders `E2E关联%` live=0。

### 提交

- `feat(business): 客户详情关联商机/商单点击跳转闭环`

## 2026-08-14 续十五：商机成交自动通知磊哥 + 铃铛 Realtime 实时到达 E2E

- 后端：新 migration `supabase/migrations/20260814000600_opportunity_won_notification.sql`：
  - notifications 类型检查约束追加 `opportunity_won`（drop + add，兼容旧数据）；
  - security definer 触发器 `notify_boss_on_opportunity_won()`：商机 stage 由非 won 变为 won 时，为所有 active 的 boss 角色用户建通知（标题「商机已成交」，内容含商机标题与人民币金额，同一商机不重复），link=/business；函数 revoke public 仅触发器内部执行。
- 前端：
  - `types/notification.ts` 追加 `opportunity_won`；`notification-bell.tsx` 图标映射补 CircleDollarSign；
  - `use-notifications.ts` Supabase 分支由「服务端 filter（recipient_id=eq…）」改为全表订阅 + 任意变更即 invalidateQueries，列表内容由 REST 按 recipient_id 精确过滤。根因：本地 Supabase Realtime 服务端 filter 报 invalid column；且 `supabase_realtime_admin` 对 notifications 无 SELECT 权限，事件 record 解码返回 `{}` + errors 401——事件仍会到达并触发回调，故事件失效查询方案可行（调试日志实证：订阅成功、INSERT 事件到达、回调触发、REST 重查 2→3 行）。
- E2E：`notification-realtime.spec.ts` 双上下文：磊哥（boss）总览页铃铛保持打开 → 董雨辰（business）建客户+商机 → REST 将 stage 置 won（`updateOpportunityStage` 助手）触发 DB 触发器 → 磊哥页面不刷新，铃铛弹出列表出现商机标题与「商机已成交」、未读 +1 → 软删通知/商机 + UI 删客户回收。`helpers.ts` 新增 `updateOpportunityStage`、`softDeleteNotificationsByContentPrefix`。
- 调试记录：首轮正式单测失败根因是 dist 为旧构建（改 hook 后未重新 build），重建 dist 后单测稳定通过；期间清理全部历史 E2E 残留（E2E成交 / E2ERT / RT-DEBUG 系列软删）。
- 验证：`pnpm typecheck`、`pnpm lint` 零错误；`pnpm test` 103 文件 / 240 测试；`pnpm build` 通过；`supabase test db` 26 文件 / 469 断言 PASS（含新 opportunity_won_notification.test.sql 12 断言与 team_memory_automation 加固）；单跑新用例 4.1s 通过；全量 E2E 26/26 全过（1.4m，25→26）；残留验证 notifications / opportunities / clients `E2E成交%` live=0。

### 提交

- `feat(business): 商机成交自动通知磊哥 + Realtime 到达 E2E`

## 2026-08-14 续十六：Storage 文件本体迁移 + 抽样验证

- 新增 `scripts/supabase/migrate-files.mjs`：PocketBase → Supabase Storage 文件本体迁移工具。
  - `FILE_MAP` 覆盖 6 张文件承载表：design_assets.file_path→design-assets、videos.file_path→video-files、venues.photo_paths→venue-photos（数组列拆平）、event_materials.file_path→event-materials、event_finances.receipt_path→finance-receipts、profiles.avatar_path→avatars；
  - 幂等：已存在对象跳过（按 bucket 列表核对），软删行不处理；
  - 源文件发现：递归扫描 `backend/pb_data/storage/**`（忽略 .attrs），按文件名（不区分大小写）匹配 DB 路径；
  - MIME 校验：按扩展名推断类型并与 `storage.buckets.allowed_mime_types` 对齐（BUCKET_ALLOWED_MIMES），bucket 不允许的类型标为 rejected（mime_not_allowed），不强行上传；
  - `--verify` 模式：核对「活跃行文件路径 ↔ Storage 对象」一致性（MIME 不符为已知例外，不计失败），并每个有活跃文件的 bucket 抽 1 个对象做签名 URL 读取（HTTP 200 判定）；
  - 报告写入 `/tmp/tk-observer-supabase/file-migration-report.json`；无 service key 时自动降级 dry-run，不访问网络。
- 新增 `scripts/supabase/migrate-files.test.mjs`（8 个测试）：表映射、数组拆平、PB 文件递归发现、计划分类（已存在/缺源）、MIME 拒绝（PNG 进 video-files）、dry-run 汇总、verify 缺数据源降级。
- 实跑迁移（本地 Supabase）：活跃设计素材 1 个（favicon_hxrhielkec.png）已上传到 design-assets（metadata mimetype=image/png、494B）；活跃视频行 1 个（favicon_zcn4kmtcq6.png，导入的测试数据）因 MIME 不符被拒绝并记录在案；其余活跃文件路径 0 缺口（E2E 遗留大量软删行不处理）。最终缺对象 0。
- 抽样验证（真实角色令牌）：
  - design 角色读 design-assets → 签名 URL fetch 200；
  - editing / business 角色读 design-assets → 签名接口 400 拒绝（RLS 生效）；
  - 一致性核对：活跃路径 2，缺对象 0，MIME 不符 1（已知例外）。
- 说明：本地 `ENABLE_IMAGE_TRANSFORMATION=false`，前端缩略图沿用签名 URL 原图渲染（浏览器缩放），生产远程部署如需图片变换再开启；Storage 策略矩阵已由 pgTAP storage_access 12 断言覆盖。
- 验证：`node --test scripts/supabase/*.test.mjs` 44/44；`migrate-files.mjs --verify` FILE_VERIFY_PASSED。

### 提交

- `feat(data): Storage 文件本体迁移脚本与抽样验证`

## 2026-08-14 续十七：PWA 离线壳 + 移动端视口自动化验证

- 新增 `apps/web/e2e/pwa-mobile-shell.spec.ts`（4 条用例，无需登录）：
  1. manifest 元数据可访问且图标可加载：`/manifest.webmanifest` 返回 name=「TK观察工作台」/ short_name=「TK工作台」/ start_url=/ / display=standalone，每个图标 HTTP 200；
  2. service worker 注册并被接管：生产 preview 下 `/sw.js` 注册达到 activated，reload 后 `navigator.serviceWorker.controller` 接管页面；
  3. 离线状态应用外壳仍可渲染：在线热身后 `context.setOffline(true)`，reload 仍渲染登录页标题与邮箱输入框（SW 外壳缓存 + 运行时资源缓存回退）；
  4. 移动端视口（iPhone 13 仿真）登录页无横向溢出：`scrollWidth <= clientWidth`。
- 说明：真机仍需人工点验，但 PWA 三要素（manifest / SW 注册 / 离线壳）与移动端布局溢出已转自动覆盖；e2e tsconfig 无 DOM lib，回调内用结构化类型收窄浏览器全局，不引入 `any`。
- 验证：全量 E2E 扩至 30/30 全过（1.5m）；`pnpm lint` 零错误；`tsc -b --force` 零错误；`pnpm test` 103 文件 / 240 测试全过。

### 提交

- `test(e2e): PWA 离线壳与移动端视口自动化验证`

## 2026-08-14 续十八：PocketBase 回退演练 dry-run 自动判定

- `pocketbase-rollback.mjs` 新增 `evaluateReadiness()`（三项就绪判定：data.db 存在、migration 文件数 ≥ 15、Supabase 导出目录存在）+ `--drill` 参数：输出 `DRILL_READY_PASS/FAIL` 并以退出码 0/1 供脚本化门禁使用；不写文件、不启动服务、不访问网络。
- `pocketbase-rollback.test.mjs` 增 2 个单测（就绪通过 / 任一缺失返回具体原因），共 8 个测试全过。
- `docs/pocketbase-rollback-drill.md` 验收标准第一条勾选并给出自动判定命令与实跑结果。
- 实跑：`node scripts/supabase/pocketbase-rollback.mjs --drill` → DRILL_READY_PASS（data.db 843776 字节、migration 21 个、导出目录 15 个文件）。
- 说明：真实回切（provider 切换 + 启动 PocketBase + 前端抽查）属人工步骤，按安全红线不代跑，待用户执行。

### 提交

- `feat(data): 回退演练 dry-run 自动判定与验收勾选`
## 2026-08-20 飞书运行时静态检查

- 本地安装 Deno 2.9.5（Apple Silicon），用于 Edge Function runtime 检查。
- `feishu-oauth/index.ts`：Deno check 通过。
- `feishu-sync/index.ts`：补齐 `SyncItem`、`SyncPage` 及回调参数类型后 Deno check 通过。
- 未部署函数、未配置 Secrets、未调用外部飞书 API；远程上线仍需生产凭据和正式回调地址。

## 2026-08-20 飞书部署前配置门禁

- 抽出 `requireSyncConfig`，同步函数在 Supabase URL、service role 或 32 字节加密密钥缺失时 fail-closed。
- 新增同步 gate/eval 配置边界测试，专项 Node 测试 10/10 通过，Deno 静态检查通过。

## 2026-08-21 搜索性能切片

- 追加 migration `20260821000100_search_performance.sql`，启用 `pg_trgm`，为 creators、clients、events、opportunities、video_ideas、companies、products 的常用搜索字段建立软删除条件 GIN 索引。
- 全局搜索输入防抖从 300ms 调整为 250ms，保持现有结果、权限和 provider 回退逻辑不变。
- 本地 migration 已应用；搜索 gate/eval 10/10 通过。
- 用户确认后已推送远程 Supabase；`supabase migration list` 核对本地/远程均为 `20260821000100`。

## 2026-08-21 搜索索引命中修正

- 追加 `20260821000200_search_column_trgm.sql`，将拼接表达式索引改为按实际 `ilike` 查询列拆分的 12 个 trigram GIN 索引。
- 专项 gate/eval 15/15 通过；前端门禁通过。
- 远程推送待重新登录 Supabase CLI；本地 Supabase 服务停止导致全量 pgTAP 暂无法重跑。
