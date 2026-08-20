# 商务商机详情抽屉 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将商机详情从居中 Dialog 改为可保持列表上下文的右侧 Sheet，并补齐可验证的交互测试。

**Architecture:** 保留 `OpportunitiesWorkbench` 当前查询和 mutation，在同一功能边界内替换详情展示组件。详情组件继续接收 `OpportunityView`、保存状态和回调，通过已有 `Sheet` 原语承载桌面右侧面板与移动端响应式宽度；不新增数据层和数据库字段。

**Tech Stack:** React 18, TypeScript, TanStack Query, Radix Sheet, Vitest Browser Mode, Tailwind CSS。

## Global Constraints

- 不改数据库表结构、Supabase functions 或 migration。
- 不修改另一窗口正在处理的 `agents.md`、`package.json`、`deno.lock` 和 `supabase/functions/`。
- 详情保存沿用 `opportunityDetailPatch` 和现有 mutation。
- 业务表格保持高不透明度，玻璃效果只用于详情抽屉和导航层。
- 必须增加测试与 eval，并运行 `git diff --check`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm --dir apps/web test:eval`、`pnpm build`。

---

### Task 1: 为详情抽屉建立回归测试

**Files:**
- Modify: `apps/web/src/features/business/opportunities/opportunities-workbench.test.tsx`
- Read: `apps/web/src/components/ui/sheet.tsx`

**Interfaces:**
- Consumes: existing `OpportunitiesWorkbench` props and PocketBase mocks.
- Produces: browser tests that assert the selected opportunity renders in a right-side Sheet and that saving preserves the existing mutation contract.

- [ ] **Step 1: Extend the query mock with one opportunity record**

Return a record with `id`, `title`, `client`, expanded client name, `amount`, `stage`, `expected_close`, `notes`, and `probability`, matching the shape accepted by `mapOpportunityRecord`.

- [ ] **Step 2: Write the failing open-and-save test**

Click the rendered opportunity card, assert the title and Sheet content are present, edit the notes field, click `保存详情`, and poll `pocketBase.update` for the same id and the expected detail patch.

- [ ] **Step 3: Write the failing close-context test**

Open the opportunity, close the Sheet using its accessible close button, and assert the opportunity card remains rendered. This verifies closing the detail view does not clear the list query.

- [ ] **Step 4: Run the focused test**

Run: `pnpm --dir apps/web exec vitest run src/features/business/opportunities/opportunities-workbench.test.tsx`

Expected: FAIL because the current detail view is a Dialog and the fixture/test expects Sheet semantics.

- [ ] **Step 5: Commit the test-only change**

```bash
git add apps/web/src/features/business/opportunities/opportunities-workbench.test.tsx
git commit -m "test: specify opportunity detail drawer behavior"
```

### Task 2: Replace the detail Dialog with a responsive Sheet

**Files:**
- Modify: `apps/web/src/features/business/opportunities/opportunities-workbench.tsx`

**Interfaces:**
- Consumes: `OpportunityView`, `OpportunityDetailDraft`, `onOpenChange`, `onSave`, and existing Radix Sheet exports.
- Produces: `OpportunityDetailDrawer` with the same save callback and draft shape, so the parent mutation remains unchanged.

- [ ] **Step 1: Import Sheet primitives and anchor icons only from existing component libraries**

Use `Sheet`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, and `SheetTitle` from `@/components/ui/sheet`. Use existing Lucide icons for section anchors and close/save affordances when needed.

- [ ] **Step 2: Replace the `OpportunityDetailDialog` call site**

Keep `key={selected?.id || 'empty'}`, `selected` state, `updateDetail.isPending`, and the existing `onSave` mutation callback. Change only the rendered component name and its prop contract.

- [ ] **Step 3: Implement `OpportunityDetailDrawer` using the Sheet primitives**

Use `side='right'` and a responsive width class such as `w-full sm:max-w-xl`. Keep the header visible, put editable content in an independently scrolling body, and keep `保存详情` in `SheetFooter` so it remains reachable on small screens.

- [ ] **Step 4: Add the three requested visual anchors**

Render stable ids `opportunity-overview`, `opportunity-follow-up`, and `opportunity-relations`. The overview contains customer, amount, stage, and expected close. Follow-up contains notes and lost reason when needed. Relations contains an explicit empty state because no relation data is currently provided by this component.

- [ ] **Step 5: Preserve the existing validation and save behavior**

Keep `opportunityDetailPatch(draft)` as the only conversion path. Do not add a second mutation. The drawer closes only through the parent `onSave` success path or explicit close.

- [ ] **Step 6: Run the focused test and typecheck**

Run: `pnpm --dir apps/web exec vitest run src/features/business/opportunities/opportunities-workbench.test.tsx` and `pnpm typecheck`.

Expected: PASS with no changes to the PocketBase/Supabase payload contract.

- [ ] **Step 7: Commit the component change**

```bash
git add apps/web/src/features/business/opportunities/opportunities-workbench.tsx
git commit -m "feat: add opportunity detail drawer"
```

### Task 3: Add the eval and complete the quality gate

**Files:**
- Create or modify: `apps/web/src/features/business/opportunities/opportunities-workbench.eval.test.tsx`
- Modify: `docs/2026-08-20-glass-observatory-ui.md` only if the delivered interaction needs a documented entry

**Interfaces:**
- Consumes: the rendered `OpportunitiesWorkbench` and its existing test mocks.
- Produces: a UI eval for desktop right-side presentation, mobile width constraints, and visible anchor sections.

- [ ] **Step 1: Add the eval cases**

Assert that opening a card renders the detail title, the three anchor ids, and no element reports horizontal overflow in the narrow viewport fixture.

- [ ] **Step 2: Run the eval**

Run: `pnpm --dir apps/web test:eval`

Expected: PASS for the new eval and all existing evals.

- [ ] **Step 3: Run the complete required gates**

```bash
git diff --check
pnpm typecheck
pnpm lint
pnpm test
pnpm --dir apps/web test:eval
pnpm build
```

- [ ] **Step 4: Review the final diff for parallel-worktree safety**

Run `git status --short` and verify only the planned opportunity component, its tests/eval, and documentation are included. Do not stage or clean unrelated files.

- [ ] **Step 5: Commit the verification/documentation change**

```bash
git add apps/web/src/features/business/opportunities/opportunities-workbench.eval.test.tsx docs/2026-08-20-glass-observatory-ui.md
git commit -m "test: verify opportunity drawer responsive behavior"
```
