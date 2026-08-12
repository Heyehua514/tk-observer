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

## 验证

- `git diff --check`：通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，63 个测试文件，159 个测试。

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
- 待提交：Supabase 默认入口与商务基础数据切换。

## 外部状态

- 当前仓库未配置 `git remote`，无法执行 push。
- 本轮未修改已发布 PocketBase migration，未新增后端框架，未启动服务，未访问外部 API。
