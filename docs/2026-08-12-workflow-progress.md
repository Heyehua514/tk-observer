# 2026-08-12 工作台推进记录

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
