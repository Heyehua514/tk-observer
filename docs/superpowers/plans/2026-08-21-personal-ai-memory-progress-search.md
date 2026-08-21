# 个人 AI 记忆与推进搜索实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with checkpoints.

**Goal:** 让每位成员在自己的工作台中使用角色化 AI，按需读取本人任务上下文，并在人工确认后保存、检索和删除个人 AI 记忆。

**Architecture:** 复用现有 `AiAssistantPanel`、WorkBuddy 本地网关和 `ai_notes`。新增一张追加 migration 保存 owner-scoped `ai_memory`，前端通过 hooks 查询本人任务摘要与记忆，调用前只拼接限量上下文；AI 永远只返回建议，不直接修改业务数据。

**Tech Stack:** React 18、TanStack Query、Supabase-first、PocketBase 显式回退、Vitest、现有 shadcn/ui。

## Global Constraints

- 不修改已发布 migration，只追加时间戳 migration。
- 不引入 Express、NestJS、Django、Redux、MobX 或外部 AI API。
- WorkBuddy 只通过本机 `127.0.0.1:8877` 网关执行。
- 个人记忆按 `owner_id = auth.uid()` 隔离；boss 不默认读取成员完整记忆。
- AI 不得自动修改任务、金额、负责人、截止日期或商机阶段。
- 每个代码切片必须有 gate test 和 eval；完成后跑 typecheck、lint、test、build、diff check。

### Task 1: 角色配置与上下文模型

**Files:**
- Create: `apps/web/src/features/shared-ai/ai-profile.ts`
- Create: `apps/web/src/features/shared-ai/ai-profile.test.ts`
- Create: `apps/web/src/features/shared-ai/ai-context.ts`
- Create: `apps/web/src/features/shared-ai/ai-context.test.ts`

- [ ] 角色配置覆盖 boss/business/market/design/editing，并给出名称、任务类型和建议重点。
- [ ] 上下文模型只保留标题、状态、截止日期、备注和来源，最多 12 条，按逾期/未完成/最近更新排序。
- [ ] 测试角色映射、敏感字段不进入上下文、数量上限和排序。

### Task 2: 个人记忆 migration 与 hooks

**Files:**
- Create: `supabase/migrations/20260821000300_ai_memory.sql`
- Create: `supabase/tests/ai_memory.test.sql`
- Create: `supabase/tests/ai_memory.eval.test.sql`
- Create: `apps/web/src/features/shared-ai/hooks/use-ai-memory.ts`
- Create: `apps/web/src/features/shared-ai/hooks/use-ai-memory.test.ts`

- [ ] 建立 `ai_memory`：owner、memory_type、memory_key、memory_value、confidence、source、last_used_at、created_at、updated_at、deleted_at。
- [ ] 仅本人 select/insert/update，boss 不绕过 owner RLS 读取全文；支持本人软删。
- [ ] hook 提供查询、新增、软删，Supabase-first，PocketBase fallback 使用空列表并保留显式边界。

### Task 3: AI 面板联动

**Files:**
- Modify: `apps/web/src/features/shared-ai/ai-assistant-panel.tsx`
- Create: `apps/web/src/features/shared-ai/ai-assistant-panel.test.tsx` additions
- Create: `apps/web/src/features/shared-ai/ai-assistant-panel.eval.test.tsx`

- [ ] 面板显示“我的 X 助手”，角色配置驱动任务类型和快捷重点。
- [ ] 用户点击执行时才读取任务摘要和个人记忆，拼接到 WorkBuddy prompt，限制上下文长度。
- [ ] 结果增加“记住这条”人工确认按钮，确认后写入 `ai_memory`。
- [ ] 增加推进搜索模式和当前工作台搜索词，结果仍需人工确认。

### Task 4: 任务入口与视频路径收口

**Files:**
- Modify: `apps/web/src/features/editing/components/video-ai-panel.tsx`
- Modify: `apps/web/src/features/editing/ai-assistant/use-video-ai-analysis.ts`
- Create: `apps/web/src/features/shared-ai/task-ai-entry.tsx`
- Create: `apps/web/src/features/shared-ai/task-ai-entry.test.tsx`

- [ ] 任务卡可用当前任务上下文打开 AI，不直接修改任务。
- [ ] 视频 AI 统一调用真实本地网关，移除占位返回。
- [ ] 网关不可用、空数据和超时均有中文错误态。

### Task 5: 门禁、文档与发布

**Files:**
- Modify: `docs/daily-logs/2026-08-21.md`
- Modify: `docs/2026-08-12-workflow-progress.md`
- Modify: `/Users/liyuzhen/Desktop/TK观察工作台-PRD交付包/TK观察工作台-产品需求文档-当前版.md`

- [ ] 每个任务独立提交。
- [ ] 运行前端门禁；本地 Supabase 可用时追加 pgTAP，否则记录明确阻塞。
- [ ] 发布静态前端并记录预览地址，不推送生产 migration，除非用户完成生产确认。
