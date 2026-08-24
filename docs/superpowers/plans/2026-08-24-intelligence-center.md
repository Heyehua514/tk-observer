# 每日情报中心第一期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不接入未授权平台的前提下，交付统一情报池的 Supabase 数据边界、Supabase-first 列表页面、手动录入和状态管理。

**Architecture:** 新增 `intelligence_items` 追加 migration，RLS 限制成员只能修改自己创建的记录；前端新增独立 `/intelligence` 路由和 `features/intelligence` 模块，查询通过 Supabase，PocketBase 仅回退只读列表。纯函数负责筛选、URL 校验和 CSV 行校验，页面复用现有 `PageHeader`、`EmptyState`、`LoadStateError` 和 shadcn 表单控件。

**Tech Stack:** Supabase/PostgreSQL migration、React 18、TanStack Router、TanStack Query、Vitest browser tests、现有 shadcn/ui。

## Global Constraints

- Supabase-first，PocketBase 仅显式回退。
- migration 只追加，不修改历史 migration。
- 不调用外部 AI、TikTok、视频号或飞书未授权接口。
- AI 只可通过本机 WorkBuddy，第一期不调用 AI。
- 不提交密码、token、账号、hosts 或用户未跟踪工作流文件。
- 每个行为改动必须有 gate 测试和 eval；完成后运行 typecheck、lint、test、build、diff check。

### Task 1: 追加情报池 migration 和数据库测试

**Files:**
- Create: `supabase/migrations/20260824000200_intelligence_items.sql`
- Create: `supabase/tests/intelligence_items.test.sql`
- Create: `supabase/tests/intelligence_items.eval.test.sql`

**Interfaces:**
- Produces table `public.intelligence_items` with `title`, `summary`, `source_name`, `source_type`, `source_url`, `captured_at`, `region`, `language`, `topic`, `heat_score`, `confidence`, `dedupe_key`, `workspaces`, `status`, `created_by`, timestamps and `deleted_at`.

- [ ] Write failing pgTAP checks for columns, source/status checks, unique active dedupe key, owner update RLS and soft-delete filtering.
- [ ] Run `pnpm supabase:test -- supabase/tests/intelligence_items.test.sql` and verify failure is caused by missing table.
- [ ] Add migration with append-only table, indexes, grants and policies. Use `source_type in ('official','rss','authorized','public','manual','csv')`, `status in ('unread','read','saved','ignored','tasked')`, URL length 2000, title length 300, summary length 5000, heat/confidence bounds 0..100/0..1.
- [ ] Run `pnpm supabase:reset && pnpm supabase:test` and verify the new gate/eval passes.
- [ ] Commit `feat(intelligence): add scoped intelligence pool`.

### Task 2: Add deterministic intelligence models and Supabase/PocketBase hooks

**Files:**
- Create: `apps/web/src/features/intelligence/intelligence-model.ts`
- Create: `apps/web/src/features/intelligence/intelligence-model.test.ts`
- Create: `apps/web/src/features/intelligence/hooks/use-intelligence-items.ts`
- Create: `apps/web/src/features/intelligence/hooks/use-create-intelligence-item.ts`

**Interfaces:**
- `isSafeExternalUrl(value: string): boolean`
- `validateIntelligenceDraft(draft): string[]`
- `filterIntelligenceItems(items, filters): IntelligenceItem[]`
- `useIntelligenceItems(filters)` and `useCreateIntelligenceItem()`.

- [ ] Write failing pure tests for safe URL protocols, required fields, duplicate draft keys and status/workspace filters.
- [ ] Run the focused Vitest file and verify RED.
- [ ] Implement the pure model and hook using existing provider patterns; PocketBase hook must only query and must not expose Supabase-only status writes.
- [ ] Run focused tests and verify GREEN.

### Task 3: Build the intelligence page and route

**Files:**
- Create: `apps/web/src/features/intelligence/intelligence-page.tsx`
- Create: `apps/web/src/features/intelligence/intelligence-page.test.tsx`
- Create: `apps/web/src/features/intelligence/index.ts`
- Create: `apps/web/src/routes/_app/intelligence.tsx`
- Modify: `apps/web/src/components/layout/app-sidebar.tsx`

- [ ] Write failing browser tests for page title, empty state, filters, safe external link and required form fields.
- [ ] Run the focused browser test and verify RED.
- [ ] Implement the page with shared loading/error/empty components; state actions update only the current intelligence row, and “转为任务” opens a confirmation panel without creating a task.
- [ ] Add `/intelligence` to sidebar for all authenticated roles and route guard.
- [ ] Run browser tests and verify GREEN.

### Task 4: Documentation, full gates, and local delivery

**Files:**
- Modify: `docs/2026-08-12-workflow-progress.md`
- Modify: `docs/daily-logs/2026-08-24.md`
- Modify: `/Users/liyuzhen/Desktop/TK观察工作台-PRD交付包/TK观察工作台-产品需求文档-当前版.md`

- [ ] Record schema, security boundary, source limitations and test counts.
- [ ] Run `git diff --check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm supabase:schema:test`, `pnpm supabase:test`, and `pnpm build`.
- [ ] Run `python3 /Users/liyuzhen/skill/tools/效率模式生成器.py tk report ...` and `... tk todo`.
- [ ] Commit docs and delivery record. Do not deploy or push remote migration in this slice.
