# 2026-08-12 工作台推进记录

## 完成模块

- 市场工作台首屏补齐竞品监测和投放摘要。
- 市场竞品监测 Tab 接入共享 `competitor_accounts` 表。
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
- 商务核心链路继续切 Supabase：商机 Pipeline、渠道商单、朋友圈计划默认走 Supabase，PocketBase 保留显式回退。
- 商务驾驶舱已切 Supabase：总客户数、本月新增、进行中商机、预计成交金额、本月商单默认读取 Supabase。
- 剪辑工作台核心链路开始切 Supabase：选题 CRUD、CSV 导入/导出、分析视图、导入历史、视频任务、成片归档、对标账号、对标视频、热点话题和风格分析默认走 Supabase，PocketBase 保留显式回退。
- 市场活动共享表开始切 Supabase：活动列表/保存/软删除、活动详情的阶段/任务/报名/招商读取、活动任务状态更新默认走 Supabase。
- 市场资源表开始切 Supabase：场地库、文案模板、活动物料、活动财务新增 Supabase schema；场地列表/保存/历史活动、模板列表/保存/使用记录、物料列表/上传/保存、财务列表/保存默认走 Supabase，PocketBase 保留显式回退。
- 设计工作台开始切 Supabase：新增 `design_assets`、`design_tasks`、`design_requirements`、`design_references`、`design_deliverables` Supabase schema；素材上传/审批、需求接收/状态流转/参考/交付、任务看板默认走 Supabase，PocketBase 保留显式回退。
- 总览团队记忆开始切 Supabase：新增 `daily_reports`、`weekly_reports`、`failed_cases`、`audit_logs` Supabase schema；今日简报、本月教训、闭环仪表默认读取 Supabase，PocketBase 保留显式回退。
- 通知铃铛开始切 Supabase：新增 `notifications` Supabase schema；当前用户通知列表、Realtime 失效和已读更新默认走 Supabase，PocketBase 保留显式回退。
- 总览团队日历开始切 Supabase：活动、活动任务、设计需求、朋友圈计划、渠道商单排期默认聚合 Supabase 数据，PocketBase 保留显式回退。
- 总览首页开始切 Supabase：新增 `gmv_metrics`、`team_tasks` Supabase schema；GMV 趋势、签约达人数、待办任务、出片数量、团队动态和成员进度默认读取 Supabase，PocketBase 保留显式回退。
- 市场选品库开始切 Supabase：新增 `products` Supabase schema；市场首页商品卡片、搜索和毛利模型默认读取 Supabase，PocketBase 保留显式回退。
- 商务公司/供应商名录开始切 Supabase：新增 `companies` Supabase schema；公司列表、筛选、搜索、新增、编辑、软删除默认走 Supabase，PocketBase 保留显式回退。
- 全局搜索开始切 Supabase：达人、公司/供应商、商品和视频跨工作台搜索默认查询 Supabase，PocketBase 保留显式回退。
- 全局搜索详情抽屉开始切 Supabase：达人、公司/供应商、商品和视频详情读取，以及商品关联视频读取默认走 Supabase，PocketBase 保留显式回退。
- 商务活动招商面板开始切 Supabase：活动招商列表、活动/客户展开和跟进阶段更新默认走 Supabase，PocketBase 保留显式回退。

## 验证

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，83 个测试文件，197 个测试。
- `pnpm supabase:schema:test`：通过，2 个 Node schema 测试。

## 提交

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

## 外部状态

- 当前仓库未配置 `git remote`，无法执行 push。
- 本轮未修改已发布 PocketBase migration，未新增后端框架，未启动服务，未访问外部 API。
