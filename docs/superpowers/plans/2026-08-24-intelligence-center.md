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

- [x] Write failing pgTAP checks for columns, source/status checks, unique active dedupe key, owner update RLS and soft-delete filtering.
- [x] Run the focused test and verify failure was caused by the missing table.
- [x] Add the append-only table, indexes, grants and policies.
- [x] Run local reset and focused/full Supabase tests; all pass.
- [x] Commit `536cd7a feat(intelligence): add first phase intelligence center`.

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

- [x] Write pure tests for safe URL protocols, required fields and status/workspace filters.
- [x] Run the focused Vitest file and verify the missing model failure.
- [x] Implement the pure model and Supabase-first/PocketBase read-only hooks.
- [x] Run focused tests and verify GREEN.

### Task 3: Build the intelligence page and route

**Files:**
- Create: `apps/web/src/features/intelligence/intelligence-page.tsx`
- Create: `apps/web/src/features/intelligence/intelligence-page.test.tsx`
- Create: `apps/web/src/features/intelligence/index.ts`
- Create: `apps/web/src/routes/_app/intelligence.tsx`
- Modify: `apps/web/src/components/layout/app-sidebar.tsx`

- [x] Write browser tests for page title, safe external link and required form fields.
- [x] Run the focused browser test, fix the hook mock path, and verify GREEN.
- [x] Implement the page with shared loading/error/empty components and confirmation-only task intent.
- [x] Add `/intelligence` to sidebar for all authenticated roles and route guard.
- [x] Run browser tests and verify GREEN.

### Task 4: Documentation, full gates, and local delivery

**Files:**
- Modify: `docs/2026-08-12-workflow-progress.md`
- Modify: `docs/daily-logs/2026-08-24.md`
- Modify: `/Users/liyuzhen/Desktop/TK观察工作台-PRD交付包/TK观察工作台-产品需求文档-当前版.md`

- [x] Record schema, security boundary, source limitations and test counts in progress log, daily log and PRD V1.53.
- [x] Run all local gates: typecheck, lint, 145/331 frontend tests, schema inventory, 41 SQL files / 582 tests, eval 11/14, build and diff check.
- [x] Run efficiency report and todo archive.
- [x] Commit docs and delivery record. Remote migration and deployment intentionally remain pending.
