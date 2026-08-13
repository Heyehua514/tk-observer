# 2026-08-13 PocketBase Hook → Supabase 自动化对齐矩阵

> 目的：确认 PocketBase 侧每个自动化钩子在 Supabase 侧有等价实现，列出尚未对齐的项与处置建议。
> 方法：只读比对 `backend/pb_hooks/*.pb.js` 与 `supabase/migrations/*.sql`（函数、触发器、cron）。

## 矩阵

| PB hook | 用途 | Supabase 等价 | 状态 |
|---|---|---|---|
| daily-report.pb.js | 每日 18:00 日报 | `generate_daily_report` + cron 18:00（`20260813000900`） | ✅ 已对齐 |
| weekly-report.pb.js | 每周一 08:00 周报 | `generate_weekly_report` + cron 周一 08:00 | ✅ 已对齐 |
| deadline-check.pb.js | 当日到期任务/商机提醒 | `run_deadline_checks` + cron 08:00（重复运行去重） | ✅ 已对齐 |
| failed-case-recorder.pb.js | 流失商机/过期任务沉淀 | `record_lost_opportunity_case` + `record_overdue_event_task_case` + `sweep_overdue_event_tasks`（cron 08:30 兜底） | ✅ 已对齐 |
| closed-loop-rules.pb.js | 招商客户级别 / 设计稿文件 / 财务校验 | `enforce_sponsorship_client_level` + `enforce_design_review_file`；财务校验由 `event_finances` 表 CHECK 约束承担 | ✅ 已对齐 |
| event_finance_templates.pb.js | 活动创建自动生成 7 条收支模板 | `seed_event_finance_templates` 触发器（`20260813001100`，本轮新增） | ✅ 已对齐 |
| video_ideas.pb.js | 选题 is_viral 自动计算 | `20260811000300` 视频爆款引擎 + 视图 | ✅ 已对齐 |
| blog_articles.pb.js | 文章 is_viral 自动计算 | `recompute_blog_article_viral_flags` / `sync_blog_article_viral_flags`（`20260813000800`） | ✅ 已对齐 |
| notifications.pb.js | 审批/达标通知 | `notifications` 表 + 自动化通知写入（`20260813000400` / `20260813000900`） | ✅ 已对齐 |
| auto-analyze.pb.js | WorkBuddy AI 视频分析 | 无等价 | ⚠️ 待决策（AI 服务未接入 Supabase） |
| feishu-auth / feishu-sync / knowledge-process | 飞书认证、文档同步、知识提炼 | 无等价 | ⚠️ 待决策（外部服务，独立于迁移） |
| registration.pb.js | 姓名白名单自助注册 | Supabase Auth（邮箱/邀请）+ profiles 角色 | ⚠️ 需切换为受控邀请 |
| account_exists.pb.js | 登录邮箱枚举提示 | Supabase Admin API 等价查询 | ⚠️ 公网前限流/统一错误 |

## 说明

- 已对齐项全部只加不改：函数 security definer 服务端调用，客户端不可绕过；cron 均为北京时间。
- 模板种子与金额约束：`20260813001100` 把 `event_finances.amount` 约束从 `> 0` 放宽为 `>= 0`（与 PocketBase `min: 0` 对齐），模板行以 0 占位待韩素云填写；手动录入校验不变。
- 未对齐项均属外部服务或账号策略，不影响业务表迁移；其中 auto-analyze 的 AI 分析在后续“LLM 服务接入”阶段处理。
