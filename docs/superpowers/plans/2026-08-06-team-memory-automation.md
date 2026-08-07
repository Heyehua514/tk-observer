# Team Memory Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增日报、周报、失败案例三张表和五个 PocketBase 自动化 hook，并在磊哥总览展示可追踪的团队记忆闭环。

**Architecture:** 用一个只追加的新 migration 创建三张表，并为现有 notifications、opportunities、video_ideas 增加自动化所需字段。五个 `.pb.js` hook 各自拥有清晰入口；三个 cron 同时暴露仅 superuser 可用的手动触发路由。总览只读查询新表与现有 audit_logs/event_templates，不修改现有业务写入流程。

**Tech Stack:** PocketBase 0.39.10 JSVM、React 18、TanStack Query、TypeScript、Vitest Browser、Framer Motion。

## Global Constraints

- 不改旧 migration，只新增时间戳 migration。
- 不调用任何外部 LLM API；自动分析只允许本地 `claude` CLI。
- 所有新增 hook 和组件文件顶部写用途、工作台和权限说明。
- cron 使用北京时间口径；部署环境必须设置 `TZ=Asia/Shanghai`。
- 手动触发路由只允许 PocketBase superuser。
- 所有重复执行必须幂等，不重复创建同一天报告、提醒或失败案例。
- 完成后运行 typecheck、lint、format check、69+ 测试、eval、build 和 PocketBase 集成自检。

---

### Task 1: Automation collections migration

**Files:**
- Create: `backend/pb_migrations/1786001000_create_team_memory_automation.js`

- [ ] 创建 `daily_reports`、`weekly_reports`、`failed_cases`，只允许 boss 读取，客户端不可写。
- [ ] 为 `notifications.type` 追加 `deadline`，为 `opportunities` 追加 `created_by`，为 `video_ideas` 追加 `ai_analysis` 与 `analyzed_at`。
- [ ] 在 down migration 中仅移除本轮新增字段和表。
- [ ] 对临时 PocketBase 数据目录执行 migration，确认启动零错误。

### Task 2: Deadline and report cron hooks

**Files:**
- Create: `backend/pb_hooks/deadline-check.pb.js`
- Create: `backend/pb_hooks/daily-report.pb.js`
- Create: `backend/pb_hooks/weekly-report.pb.js`

- [ ] 实现每日 08:00 截止提醒、幂等通知和 `deadline-check` 自检日志。
- [ ] 在机会创建请求中保存 `created_by`，保证后续提醒有明确接收人。
- [ ] 实现每日 18:00 日报与阶段变化审计，重复触发更新同一天记录。
- [ ] 实现每周一 08:00 周报，本周与上周口径固定为北京时间周一边界。
- [ ] 为三个 cron 增加 superuser 手动触发路由，并写入 `audit_logs` 的 `cron_run` 轨迹。

### Task 3: Failure and local-Claude hooks

**Files:**
- Create: `backend/pb_hooks/failed-case-recorder.pb.js`
- Create: `backend/pb_hooks/auto-analyze.pb.js`

- [ ] 商机首次进入 lost 时创建失败案例，reason 使用 `lost_reason`。
- [ ] 过期且未完成任务发生更新时创建失败案例，重复更新不重复记录。
- [ ] `video_ideas` 创建后查找未分析记录，通过 `$os.cmd('claude', ...)` 调用本地 Claude Code，结果写入独立字段。
- [ ] Claude CLI 缺失或执行失败时保留未分析状态并打印明确失败日志，禁止伪造结论。
- [ ] 增加 superuser 手动分析路由，便于安装 Claude 后复跑。

### Task 4: Team memory UI with TDD and eval

**Files:**
- Create: `apps/web/src/features/overview/team-memory/types.ts`
- Create: `apps/web/src/features/overview/team-memory/team-memory-metrics.ts`
- Create: `apps/web/src/features/overview/team-memory/team-memory-metrics.test.ts`
- Create: `apps/web/src/features/overview/team-memory/use-team-memory.ts`
- Create: `apps/web/src/features/overview/team-memory/team-memory.tsx`
- Create: `apps/web/src/features/overview/team-memory/team-memory.eval.test.tsx`
- Create: `apps/web/src/features/overview/team-memory/index.ts`
- Modify: `apps/web/src/features/overview/components/overview-dashboard.tsx`

- [ ] 先写失败测试：失败原因分组 TOP 3、cron 次数、模板使用量、失败沉淀数。
- [ ] 实现纯函数与跨表只读 hook。
- [ ] 写失败 eval：今日简报、本月教训、闭环仪表和引导空状态均可见。
- [ ] 实现团队记忆区域，并将总览成员头像替换为统一角色头像。
- [ ] 总览指标使用 count-up；只有存在真实比较值时显示绿色上箭头或红色下箭头。

### Task 5: Full integration self-check

**Files:**
- Modify: `README.md`

- [ ] 备份本地 SQLite 后应用 migration，启动 PocketBase 并检查 hook 注册日志。
- [ ] 用临时 superuser 手动触发 daily/weekly/deadline 路由，检查报告和日志。
- [ ] 模拟商机 lost 和任务过期更新，检查 `failed_cases` 与 notifications。
- [ ] 运行 typecheck、lint、format check、全量测试、eval 和 build。
- [ ] 登录 boss 总览，在 1440px 与 390px 截图，确认团队记忆无溢出和控制台错误。
- [ ] 报告 Claude CLI 可用性；只有真实分析写回时才报告 auto-analyze 通过。
