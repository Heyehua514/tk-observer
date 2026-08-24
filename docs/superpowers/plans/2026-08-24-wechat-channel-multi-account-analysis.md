# 微信视频号多账号分析接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有微信视频号内容工作台中，按视频号区分视频数据，补充评论指标、账号粉丝快照、每日涨粉和同步状态，并保留现有 CSV 导入与分析流程。

**Architecture:** Supabase 增加视频号账号、粉丝快照和同步批次表；现有 `video_ideas` 通过 `video_account_id` 关联账号，同时保留 `account` 旧字段兼容历史数据。前端复用现有 TanStack Query、筛选、表格和 Recharts，采集端只需提交版本化的标准批次 payload，后续可由 Android/ADB 适配器或人工 CSV 导入。

**Tech Stack:** Supabase SQL migrations/RLS/views, React 18, TypeScript strict, TanStack Query, TanStack Table, Recharts, Vitest/browser tests.

## Global Constraints

- 不修改已发布 migration；所有数据库变化使用新的时间戳 migration。
- 不把微信密码、token、设备信息或真实账号凭据写入仓库、日志或前端。
- 账号与视频数据仅对 `owner`、`boss`、`editing` 可读写，RLS 是安全边界。
- `follower_gain` 表示视频级涨粉；账号日涨粉由相邻粉丝快照计算，不混用字段。
- 采集端不是本次前端改动的一部分；本次交付定义可幂等写入的同步契约和手动同步状态。
- 必须补 gate tests/evals，并运行 typecheck、lint、format、web tests、build、diff check。

---

### Task 1: 数据库账号、快照与同步批次模型

**Files:**
- Create: `supabase/migrations/20260824000300_video_account_sync.sql`
- Test: `supabase/tests/video_account_sync.test.sql`
- Modify: `apps/web/src/types/database.generated.ts` via the existing Supabase type generation command

**Interfaces:**
- Produces `video_accounts`, `video_account_snapshots`, `video_sync_runs` tables and `video_account_daily_stats` view.
- `video_accounts` fields: `id`, `name`, `platform`, `external_account_id`, `wechat_owner_label`, `status`, `created_at`, `updated_at`, `deleted_at`.
- `video_account_snapshots` fields: `video_account_id`, `snapshot_date`, `follower_count`, `captured_at`, unique `(video_account_id, snapshot_date)`.
- `video_sync_runs` fields: `id`, `source`, `status`, `started_at`, `finished_at`, `total_rows`, `inserted_rows`, `updated_rows`, `error_message`, `metadata`.
- `video_account_daily_stats` returns account name, current follower count, previous follower count and `follower_gain`.

- [ ] **Step 1: Write pgTAP tests** for table columns, uniqueness, non-negative follower counts, status enum, view delta calculation, and RLS denying `market`.
- [ ] **Step 2: Run the focused Supabase test** and verify it fails because the migration is absent.
- [ ] **Step 3: Add the append-only migration** with indexes, `updated_at` triggers, RLS, grants, and a security-invoker daily stats view.
- [ ] **Step 4: Run the focused test again** and verify all assertions pass on the local Supabase database.

### Task 2: Domain types and Supabase mappers

**Files:**
- Modify: `apps/web/src/features/editing/types.ts`
- Modify: `apps/web/src/features/editing/hooks/editing-supabase-mappers.ts`
- Modify: `apps/web/src/features/editing/hooks/video-idea-csv.ts`
- Test: `apps/web/src/features/editing/hooks/video-account-mappers.test.ts`

**Interfaces:**
- Produces `VideoAccountRecord`, `VideoAccountSnapshot`, `VideoSyncRun`, `VideoAccountDailyStats` types.
- `VideoIdea` gains optional `videoAccountId`, `accountName`, `syncSource`, and `lastSyncedAt` while legacy `account` remains supported.
- `VideoSyncPayload` accepts `{ source, accountExternalId, accountName, snapshot?, videos[] }` and rejects negative metrics or invalid completion rates.

- [ ] **Step 1: Add failing mapper and payload validation tests** covering account identity, comments, video-level follower gain, and snapshot-to-daily-delta mapping.
- [ ] **Step 2: Run the focused test and confirm failure.**
- [ ] **Step 3: Implement types, zod validation, CSV headers, and Supabase row mappers without using `any` or type suppression.
- [ ] **Step 4: Run the focused test and verify it passes.**

### Task 3: Account and sync query/mutation hooks

**Files:**
- Create: `apps/web/src/features/editing/hooks/use-video-accounts.ts`
- Create: `apps/web/src/features/editing/hooks/use-video-sync-runs.ts`
- Create: `apps/web/src/features/editing/hooks/use-video-account-snapshots.ts`
- Modify: `apps/web/src/features/editing/hooks/use-video-ideas.ts`
- Modify: `apps/web/src/features/editing/hooks/use-import-video-ideas.ts`
- Test: `apps/web/src/features/editing/hooks/video-account-hooks.test.ts`

**Interfaces:**
- `useVideoAccounts()` lists active accounts and exposes `create/update/archive` mutations.
- `useVideoSyncRuns()` lists recent runs and exposes `start/finish/fail` mutations.
- `useVideoAccountSnapshots(accountId)` reads the account trend and daily delta.
- Existing idea queries invalidate `video_ideas`, `video_accounts`, snapshots and sync-run keys together after a batch import.

- [ ] **Step 1: Add hook tests** for account filtering, sync status transitions, idempotent batch keys and query invalidation.
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement Supabase-first hooks with explicit PocketBase fallback disabled for new sync tables.
- [ ] **Step 4: Run focused tests and verify pass.**

### Task 4: Existing workbench table and filters

**Files:**
- Modify: `apps/web/src/features/editing/components/video-idea-table.tsx`
- Modify: `apps/web/src/features/editing/components/editing-workbench.tsx`
- Modify: `apps/web/src/features/editing/components/video-idea-detail.tsx`
- Modify: `apps/web/src/features/editing/components/editing-workbench.test.tsx`
- Test: `apps/web/src/features/editing/components/video-account-filter.test.tsx`

**Interfaces:**
- Produces an account selector backed by `video_accounts`, a visible comments column, sync status badge, last sync time, and a `同步视频号` action that creates a pending sync run.
- Existing CSV import/export, URL query filters, pagination, bulk delete and detail drawer remain intact.

- [ ] **Step 1: Add component tests** for account selection, comments rendering, sync status labels, and empty/error states.
- [ ] **Step 2: Run focused browser tests and confirm failure.**
- [ ] **Step 3: Implement the UI using existing shared controls and icon buttons/tooltips; do not add a second card nesting layer.
- [ ] **Step 4: Run focused browser tests and verify pass.**

### Task 5: Classification and account comparison analytics

**Files:**
- Modify: `supabase/migrations/20260824000300_video_account_sync.sql`
- Modify: `apps/web/src/features/editing/components/idea-analytics.tsx`
- Modify: `apps/web/src/features/editing/hooks/use-video-idea-analytics.ts`
- Modify: `apps/web/src/features/editing/types.ts`
- Test: `apps/web/src/features/editing/components/video-account-analytics.test.tsx`

**Interfaces:**
- Produces account comparison metrics for views, average completion, likes, comments, video follower gain and account daily follower gain.
- Classification remains the existing `video_type` taxonomy; no hidden AI classification is introduced.

- [ ] **Step 1: Add analytics tests** for account totals, type averages, comments and daily follower delta.
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Extend read-only views/mappers and render account/type comparison charts with explicit empty/loading/error states.
- [ ] **Step 4: Run focused tests and verify pass.**

### Task 6: Sync contract, documentation and full verification

**Files:**
- Create: `docs/video-account-sync-contract.md`
- Create: `apps/web/src/features/editing/hooks/video-sync-contract.test.ts`
- Modify: `README.md`

**Interfaces:**
- Defines the JSON batch contract, idempotency key, field semantics, retry behavior, and the boundary between a future Android/ADB collector and Supabase.
- A valid batch must identify exactly one video account and carry a captured timestamp; duplicate video rows update metrics rather than create duplicates.

- [ ] **Step 1: Add contract tests** for valid payloads, duplicate rows, missing account identity and invalid metrics.
- [ ] **Step 2: Implement the contract validator and documentation examples using fake data only.
- [ ] **Step 3: Run `pnpm typecheck`, `pnpm lint`, `pnpm --dir apps/web format:check`, `pnpm --dir apps/web test`, `pnpm --dir apps/web test:eval`, `pnpm build`, and `git diff --check`.
- [ ] **Step 4: Record any external blocker plainly:** the GitHub Android collector still needs a device-side adapter and cannot be claimed as official WeChat API access.

