# Notification List Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full notification list with category and unread filters while reusing the existing Supabase-first query, read mutation, and deep-link behavior.

**Architecture:** Keep notification data access in `useNotifications`; put filtering in a pure model function; add a dedicated `/notifications` route and reuse the existing notification item interaction from the bell. No migration or provider changes.

**Tech Stack:** React 18, TypeScript, TanStack Router/Query, shadcn/ui, Vitest browser tests, existing Supabase/PocketBase fallback.

## Global Constraints

- Do not modify historical migrations or add a new migration.
- Keep Supabase-first with explicit PocketBase fallback.
- Do not change notification trigger behavior or database permissions.
- Preserve deep links, mark-read behavior, reduced-motion support, and existing user files.

### Task 1: Notification filtering model

**Files:**
- Create: `apps/web/src/features/notifications/notification-list-model.ts`
- Test: `apps/web/src/features/notifications/notification-list-model.test.ts`

**Interfaces:**
- `NotificationFilter = 'all' | 'unread' | NotificationType`
- `filterNotifications(items, filter): AppNotification[]`

- [ ] Add tests for all, unread, deadline, design_review, and opportunity_won/comment filters.
- [ ] Implement stable, non-mutating filtering.
- [ ] Run the focused Vitest test.

### Task 2: Full notification list page

**Files:**
- Create: `apps/web/src/features/notifications/notifications-page.tsx`
- Create: `apps/web/src/routes/_app/notifications.tsx`

**Interfaces:**
- Consume `useNotifications`, `useMarkNotificationRead`, `filterNotifications`, and existing notification target semantics.
- Produce `/notifications` with filter controls, loading/error/empty states, and read/unread actions.

- [ ] Add filter tabs and count labels.
- [ ] Reuse the existing notification icon and Beijing-time display conventions.
- [ ] Keep single-item deep links and “全部已读” behavior.
- [ ] Add a focused page rendering test for filters and empty guidance.

### Task 3: Bell entry and gates

**Files:**
- Modify: `apps/web/src/components/shared/notification-bell.tsx`
- Test: `apps/web/src/components/shared/notification-bell.test.tsx`
- Modify: `docs/2026-08-12-workflow-progress.md`
- Modify: `/Users/liyuzhen/Desktop/TK观察工作台-PRD交付包/TK观察工作台-产品需求文档-当前版.md`

- [ ] Add a “查看全部” link to `/notifications`.
- [ ] Run typecheck, lint, all frontend tests, build, and diff check.
- [ ] Update progress and PRD, then commit as one focused change.
