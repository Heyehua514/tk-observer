# Feishu Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Move Feishu connection metadata and document synchronization to Supabase-first while preserving PocketBase as an explicit fallback until production credentials and callback configuration are available.

**Architecture:** Supabase stores per-user Feishu connection metadata, encrypted tokens, documents, and sync cursors behind RLS. A Supabase Edge Function will own OAuth code exchange and scheduled synchronization; the browser never receives app secrets or access tokens. Existing PocketBase OAuth/sync remains a fallback path during rollout.

**Tech Stack:** Supabase PostgreSQL/RLS, Supabase Edge Functions (Deno), React 18, TanStack Query, existing PocketBase fallback, pgTAP, Vitest.

## Global Constraints

- Supabase-first; PocketBase is an explicit fallback only.
- Published migrations are immutable; add timestamped migrations only.
- No credentials, access tokens, refresh tokens, or test passwords in source, logs, screenshots, or docs.
- No new Express/NestJS/Django/Redux/MobX backend.
- Every feature includes a gate test and an eval in the same commit.
- Remote Supabase changes require explicit production approval; local verification comes first.
- Each task ends with typecheck/lint/test/build/diff checks appropriate to its files.

### Task 1: Supabase Feishu schema and RLS

**Files:**
- Create: `supabase/migrations/20260820000400_feishu_supabase_foundation.sql`
- Test: `supabase/tests/feishu_supabase_foundation.test.sql`
- Test: `supabase/tests/feishu_supabase_foundation.eval.test.sql`

Create `feishu_connections`, `feishu_documents`, and `feishu_sync_state`. Store only encrypted token values in `feishu_connections`; enforce one connection per user, owner-only reads, and service-role-only writes. Documents and sync state are owner-readable and service-writeable. Add indexes for owner/source URL and cursor lookups.

### Task 2: Supabase-first connection status hook

**Files:**
- Modify: `apps/web/src/features/settings/hooks/use-feishu-connection.ts`
- Modify: `apps/web/src/features/settings/feishu-connect.tsx`
- Test: `apps/web/src/features/settings/hooks/use-feishu-connection.test.ts`
- Eval: `apps/web/src/features/settings/feishu-connect.eval.test.tsx`

Read connection status from Supabase first and fall back to PocketBase only when the Supabase request is unavailable. Keep OAuth exchange behind a provider boundary so the current PocketBase endpoint remains usable until the Edge Function exists.

### Task 3: Edge Function OAuth exchange

**Files:**
- Create: `supabase/functions/feishu-oauth/index.ts`
- Test: `supabase/functions/feishu-oauth/index.test.ts`
- Eval: `supabase/functions/feishu-oauth/index.eval.test.ts`
- Modify: `apps/web/src/features/settings/hooks/use-feishu-connection.ts`

Validate the authenticated Supabase user, exchange the authorization code server-side, encrypt token material with Web Crypto using a function secret, and write only connection status to the database. Return no token fields to the browser. Missing secrets return a clear non-sensitive configuration error.

### Task 4: Edge Function sync and scheduled trigger

**Files:**
- Create: `supabase/functions/feishu-sync/index.ts`
- Create: `supabase/functions/feishu-sync/index.test.ts`
- Create: `supabase/functions/feishu-sync/index.eval.test.ts`
- Create: `supabase/migrations/20260820000500_feishu_sync_schedule.sql`

Port the existing bounded pagination, deduplication, cursor commit, retry, per-user timeout, and five-failure disable behavior. Use `pg_cron`/`pg_net` only with secrets stored outside the repository. Keep sync idempotent by `(owner_user, source_url)`.

### Task 5: Documentation and rollout gate

**Files:**
- Modify: `docs/部署与多端说明.md`
- Modify: `docs/2026-08-12-workflow-progress.md`
- Modify: `/Users/liyuzhen/Desktop/TK观察工作台-PRD交付包/TK观察工作台-产品需求文档-当前版.md`
- Create: `docs/feishu-supabase-rollout.md`

Document local setup, required Supabase secrets, Feishu callback allow-list, free-plan monitoring, rollback to PocketBase, and the explicit production approval step. Never include secret values.

## Verification

For every task run the focused test first, then `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm supabase:test`, and `git diff --check` as applicable. Apply migrations locally only. Do not push remote migrations in this plan without explicit production approval.
