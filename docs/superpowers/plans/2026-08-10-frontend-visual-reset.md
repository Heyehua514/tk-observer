# Frontend Visual Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有五角色业务工作流的前提下，以共享 Token 和组件完成高端商业控制台视觉重置。

**Architecture:** 视觉系统集中在 `theme.css` 与共享组件，业务页面只添加语义 className 和现有 Framer Motion 包装。PocketBase Hook、TanStack Query、路由、权限和表单契约不进入本轮修改范围。

**Tech Stack:** React 18、TypeScript、Tailwind CSS 4、shadcn/ui、Framer Motion、TanStack Router、Tauri 2。

## Global Constraints

- 不修改 PocketBase migration、Hook、Collection 或业务数据。
- 不删除或重构现有业务组件结构。
- 不新增 Redux、MobX、UI 框架或第二套动画运行时。
- 使用现有 `framer-motion`，所有持续动画支持 `prefers-reduced-motion`。
- 首轮页面级修改最多覆盖 `overview` 与 `business` 两个 feature 目录。

---

### Task 1: 共享视觉契约与应用壳

**Files:**
- Create: `apps/web/src/components/shared/visual-system.test.tsx`
- Create: `apps/web/src/components/shared/visual-system.eval.test.tsx`
- Modify: `apps/web/src/styles/theme.css`
- Modify: `apps/web/src/styles/index.css`
- Modify: `apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/src/components/layout/header.tsx`
- Modify: `apps/web/src/components/layout/app-sidebar.tsx`
- Modify: `apps/web/src/components/shared/page-header.tsx`

**Interfaces:**
- Consumes: 现有 `SidebarInset`、`Header`、`PageTransition` 和角色导航过滤。
- Produces: `data-workspace-shell`、`data-signal-rail`、`data-page-header` 三个稳定视觉契约和全局语义 Token。

- [ ] **Step 1: 写失败的共享视觉契约测试**

渲染 `PageHeader` 和不依赖 Provider 的视觉契约组件，断言稳定 data 属性、可访问标题和 reduced-motion 静态标识存在。

- [ ] **Step 2: 运行测试确认 RED**

Run: `pnpm --dir apps/web test visual-system.test.tsx`

Expected: FAIL，因为共享视觉契约尚不存在。

- [ ] **Step 3: 实现 Token、工作区纹理和壳层样式**

将设计规格中的六个颜色映射为语义 Token；应用壳增加不可点击、`aria-hidden` 的信号轨道层；侧边栏与顶部栏只改 className。

- [ ] **Step 4: 运行共享测试确认 GREEN**

Run: `pnpm --dir apps/web test visual-system.test.tsx`

Expected: PASS。

### Task 2: 共享 shadcn 组件重置

**Files:**
- Modify: `apps/web/src/components/ui/card.tsx`
- Modify: `apps/web/src/components/ui/button.tsx`
- Modify: `apps/web/src/components/ui/table.tsx`
- Modify: `apps/web/src/components/ui/tabs.tsx`
- Test: `apps/web/src/components/shared/visual-system.test.tsx`

**Interfaces:**
- Consumes: Task 1 的 Token。
- Produces: 保持原 props API 的 Card、Button、Table、Tabs 新视觉。

- [ ] **Step 1: 扩展失败测试**

断言 Card 使用 8px 层级、Table 保留语义结构、Tabs 保留 Radix selected 状态且组件可键盘访问。

- [ ] **Step 2: 运行测试确认 RED**

Run: `pnpm --dir apps/web test visual-system.test.tsx`

Expected: FAIL，因为新视觉属性尚不存在。

- [ ] **Step 3: 只修改共享组件 className**

不改变导出、Radix Primitive、ref、事件或 children 结构。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `pnpm --dir apps/web test visual-system.test.tsx`

Expected: PASS。

### Task 3: 总览与商务驾驶舱层级

**Files:**
- Modify: `apps/web/src/features/overview/components/overview-dashboard.tsx`
- Modify: `apps/web/src/features/business/dashboard/business-dashboard.tsx`
- Test: `apps/web/src/components/shared/visual-system.eval.test.tsx`

**Interfaces:**
- Consumes: 现有 `AnimatedNumber`、Recharts、dashboard summary 和导航回调。
- Produces: 指标卡分层与 stagger，业务行为保持不变。

- [ ] **Step 1: 写失败的视觉质量 eval**

断言总览与商务指标具备可识别的 KPI 分组、状态色不只靠颜色表达、主要操作仍可访问，并检查 reduced-motion 分支。

- [ ] **Step 2: 运行 eval 确认 RED**

Run: `pnpm --dir apps/web test visual-system.eval.test.tsx`

Expected: FAIL，因为 KPI 视觉契约尚不存在。

- [ ] **Step 3: 添加语义 className 与现有 Motion stagger**

只包装现有指标循环，不修改 metric 数值、格式化、查询和点击回调。

- [ ] **Step 4: 运行 eval 与原业务测试确认 GREEN**

Run: `pnpm --dir apps/web test visual-system.eval.test.tsx business-dashboard.eval.test.tsx`

Expected: PASS。

### Task 4: 完整验证与视觉验收

**Files:**
- Modify: `docs/superpowers/specs/2026-08-10-frontend-visual-reset-design.md` only if runtime evidence requires clarification.

**Interfaces:**
- Consumes: Tasks 1-3 的完整视觉实现。
- Produces: 可复现的代码门禁和桌面/移动截图证据。

- [ ] **Step 1: 运行完整门禁**

Run: `pnpm typecheck && pnpm lint && pnpm --dir apps/web format:check && pnpm test && pnpm --dir apps/web test:eval && pnpm build && git diff --check`

Expected: 零错误、零警告、零失败。

- [ ] **Step 2: 浏览器验收**

使用测试账号检查总览、商务、市场、设计、剪辑的共享视觉，检查 1440px、移动宽度、深色模式和 reduced-motion。

- [ ] **Step 3: 提交**

Run: `git add apps/web/src docs/superpowers && git commit -m "feat(ui): reset workbench visual system"`

Expected: 提交成功；若仓库无 remote，明确报告未 push。

