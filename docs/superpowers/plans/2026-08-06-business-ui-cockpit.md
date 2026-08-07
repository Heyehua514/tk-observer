# Business UI Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将商务工作台首页升级为包含真实指标、动态 Pipeline、行动队列和执行结果的运营驾驶舱，并统一全局微交互、角色头像、北京时间、空状态与 Toast。

**Architecture:** 共享表现能力放在 `components/shared`，业务数据聚合与纯计算放在 `features/business/dashboard`，现有商务路由只负责 tab 状态。所有驾驶舱数据通过 PocketBase 只读查询现有 collections，Pipeline 状态更新继续复用现有规则，不修改后端 schema。

**Tech Stack:** React 18、TypeScript、TanStack Query/Router、PocketBase、Tailwind CSS、shadcn/ui、Framer Motion、Vitest Browser。

## Global Constraints

- 不修改 PocketBase collections、migration、权限和业务规则。
- 指标和趋势必须来自真实数据；缺少上期比较时显示“暂无对比”。
- 动画时长：数字 0.6 秒、页面 0.2 秒、Recharts 800ms。
- 支持 `prefers-reduced-motion`。
- 头像为 34px、8px 圆角、14px 粗体白字；未知姓名按角色颜色回退。
- 只修改共享组件、商务 feature、商务路由和应用壳接线。
- 完成后运行 typecheck、lint、format check、测试和生产构建。

---

### Task 1: Shared identity and time components

**Files:**
- Create: `apps/web/src/components/shared/role-avatar.tsx`
- Create: `apps/web/src/components/shared/role-avatar.test.tsx`
- Create: `apps/web/src/components/shared/beijing-clock.tsx`
- Create: `apps/web/src/components/shared/beijing-clock.test.ts`
- Create: `apps/web/src/components/shared/login-greeting.tsx`
- Create: `apps/web/src/components/shared/login-greeting.test.ts`
- Modify: `apps/web/src/components/shared/user-menu.tsx`
- Modify: `apps/web/src/components/layout/app-shell.tsx`

**Interfaces:**
- Produces: `RoleAvatar({ name, role, className })`
- Produces: `formatBeijingClock(date: Date): string`
- Produces: `getGreetingForBeijingHour(hour: number): string`

- [ ] **Step 1: Write failing identity and time tests**

```tsx
expect(getRoleAvatarPresentation('董雨辰', 'business')).toEqual({
  label: '雨辰',
  color: '#8B5CF6',
})
expect(getRoleAvatarPresentation('杨振康', 'business')).toEqual({
  label: '振康',
  color: '#8B5CF6',
})
expect(formatBeijingClock(new Date('2026-08-06T01:05:00Z'))).toContain('09:05')
expect(getGreetingForBeijingHour(8)).toBe('早上好，打工人')
expect(getGreetingForBeijingHour(13)).toBe('中午好，打工人')
expect(getGreetingForBeijingHour(20)).toBe('晚上好，打工人')
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm --dir apps/web test src/components/shared/role-avatar.test.tsx src/components/shared/beijing-clock.test.ts src/components/shared/login-greeting.test.ts`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement shared components**

Use the fixed name colors from the approved spec, with role-color fallback for test users. `BeijingClock` refreshes on the next minute boundary and then every minute. `LoginGreeting` stores a per-session user key in `sessionStorage`, animates once after login, and respects reduced motion.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Task 1 command again. Expected: all Task 1 tests pass.

### Task 2: Shared motion, table and notification feedback

**Files:**
- Create: `apps/web/src/components/shared/animated-number.tsx`
- Create: `apps/web/src/components/shared/page-transition.tsx`
- Modify: `apps/web/src/components/shared/notification-bell.tsx`
- Modify: `apps/web/src/components/shared/empty-state.tsx`
- Modify: `apps/web/src/components/ui/table.tsx`
- Modify: `apps/web/src/components/ui/sonner.tsx`
- Modify: `apps/web/src/routes/__root.tsx`
- Modify: `apps/web/src/components/layout/app-shell.tsx`

**Interfaces:**
- Produces: `AnimatedNumber({ value, format, duration })`
- Produces: `PageTransition({ children, transitionKey })`

- [ ] **Step 1: Write the failing shared behavior test**

Add a browser test proving `AnimatedNumber` renders its final accessible value and a reduced-motion test proving it skips transitional output.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --dir apps/web test src/components/shared/animated-number.test.tsx`

Expected: FAIL because `AnimatedNumber` does not exist.

- [ ] **Step 3: Implement motion and shared polish**

Use Framer Motion for the page, number, bell and drag feedback. Make table rows stable with transform-only hover, apply subtle alternating rows, use small tracked headers, replace the notification empty copy with `EmptyState`, and set Sonner to top-center.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Task 2 test command. Expected: all Task 2 tests pass.

### Task 3: Deterministic dashboard metrics and action queue

**Files:**
- Create: `apps/web/src/features/business/dashboard/types.ts`
- Create: `apps/web/src/features/business/dashboard/dashboard-metrics.ts`
- Create: `apps/web/src/features/business/dashboard/dashboard-metrics.test.ts`
- Create: `apps/web/src/features/business/dashboard/use-business-dashboard.ts`

**Interfaces:**
- Produces: `calculateBusinessDashboard(input, now): BusinessDashboardSummary`
- Produces: `useBusinessDashboard(): UseQueryResult<BusinessDashboardData>`

- [ ] **Step 1: Write failing metric tests**

Use literal fixtures to verify total clients, current-month clients, active opportunities, active amount, monthly published orders, overdue actions, seven-day due actions and recent results. Verify missing previous-period data yields `comparison: null`.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm --dir apps/web test src/features/business/dashboard/dashboard-metrics.test.ts`

Expected: FAIL because the calculator module does not exist.

- [ ] **Step 3: Implement minimal pure calculation and query mapper**

Fetch `clients`, `opportunities`, `channel_orders` and `social_plans` in one query. Map PocketBase records at the boundary, then pass plain typed data into the pure calculator. Do not calculate metrics inside JSX.

- [ ] **Step 4: Run metric tests and verify GREEN**

Run the Task 3 command. Expected: all metric tests pass.

### Task 4: Business cockpit and reusable Pipeline

**Files:**
- Create: `apps/web/src/features/business/dashboard/business-dashboard.tsx`
- Create: `apps/web/src/features/business/dashboard/business-dashboard.eval.test.tsx`
- Create: `apps/web/src/features/business/dashboard/index.ts`
- Create: `apps/web/src/features/business/opportunities/types.ts`
- Create: `apps/web/src/features/business/opportunities/use-opportunities.ts`
- Create: `apps/web/src/features/business/opportunities/opportunity-pipeline.tsx`
- Modify: `apps/web/src/features/business/opportunities/opportunities-workbench.tsx`
- Modify: `apps/web/src/features/business/components/business-workbench.tsx`
- Modify: `apps/web/src/routes/_app/business/index.tsx`
- Modify: `apps/web/src/features/business/index.ts`

**Interfaces:**
- Consumes: `BusinessDashboardSummary`, `AnimatedNumber`, `RoleAvatar`
- Produces: `BusinessDashboard({ onNavigate })`
- Produces: `OpportunityPipeline({ opportunities, onStageChange, compact })`

- [ ] **Step 1: Write failing cockpit eval**

Render the cockpit with a literal summary and verify the user can see the five metrics, six Pipeline stages, overdue action, recent order and social plan, and can invoke the correct tab callback from an action.

- [ ] **Step 2: Run eval and verify RED**

Run: `pnpm --dir apps/web test src/features/business/dashboard/business-dashboard.eval.test.tsx`

Expected: FAIL because `BusinessDashboard` does not exist.

- [ ] **Step 3: Implement cockpit and Pipeline extraction**

Add a `dashboard` tab and make it the default business route. The first layer is five metrics, the second is a 60/40 Pipeline and action queue, and the third is recent orders, social plans and customer activity. Empty and partial states use guided actions. Existing full Pipeline CRUD keeps the same mutation rules.

- [ ] **Step 4: Run cockpit eval and opportunity tests**

Run: `pnpm --dir apps/web test src/features/business/dashboard/business-dashboard.eval.test.tsx src/features/business/opportunities/opportunity-rules.test.ts`

Expected: all selected tests pass.

### Task 5: Verification, visual QA and documentation

**Files:**
- Modify: `apps/web/package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: `test:eval` command for the cockpit eval lane.

- [ ] **Step 1: Add the eval command and concise UI documentation**

Add `"test:eval": "vitest run --browser.headless src/**/*.eval.test.tsx"` and document the cockpit, reduced-motion behavior and preview command.

- [ ] **Step 2: Run full deterministic gates**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm --dir apps/web format:check
pnpm --dir apps/web test
pnpm --dir apps/web test:eval
pnpm build
```

Expected: every command exits 0 with no warnings.

- [ ] **Step 3: Start services and complete visual QA**

Start PocketBase and Vite, then verify desktop and mobile in the browser. Check that the page is nonblank, no text overlaps, Pipeline scrolls safely on narrow screens, animations run once, and reduced motion remains usable.

- [ ] **Step 4: Inspect the final diff**

Confirm no migration, auth rule, unrelated feature or user-owned change was overwritten. Record exact test counts and preview URL.
