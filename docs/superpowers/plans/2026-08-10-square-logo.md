# TK观察正方形 Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个以“观察之眼”为单一主体、包含 TK 几何字标的商业级正方形 Logo 资产包。

**Architecture:** SVG 是唯一设计源，PNG 由本地 Playwright 确定性渲染生成。测试读取 SVG 源码验证画布、语义标记、颜色上限和无字体依赖，eval 验证单主体与小尺寸约束。

**Tech Stack:** SVG 1.1、Vitest、Playwright 1.59、Node.js 20+。

## Global Constraints

- 保留现有深绿色品牌识别，不复制 GitHub 项目的商标。
- 主标必须为 1:1，PNG 必须精确为 1024 x 1024。
- SVG 不允许 `<text>`、外链、滤镜和字体依赖。
- 不修改登录逻辑和业务组件。

---

### Task 1: Logo Contract

**Files:**
- Create: `apps/web/src/assets/brand/tk-observer-logo.test.ts`
- Create: `apps/web/src/assets/brand/tk-observer-logo.eval.test.ts`

**Interfaces:**
- Consumes: filesystem SVG assets under `apps/web/src/assets/brand/`
- Produces: deterministic asset contract used by both test lanes

- [ ] Write tests that require a 1024 square viewBox, original geometry metadata, no text/font/filter dependencies, and at most four brand colors.
- [ ] Run `pnpm --dir apps/web test -- src/assets/brand/tk-observer-logo.test.ts` and confirm failure because the SVG asset is absent.
- [ ] Run `pnpm --dir apps/web test:eval -- src/assets/brand/tk-observer-logo.eval.test.ts` and confirm failure because the SVG asset is absent.

### Task 2: Vector Assets

**Files:**
- Create: `apps/web/src/assets/brand/tk-observer-mark.svg`
- Create: `apps/web/src/assets/brand/tk-observer-mark-symbol.svg`
- Create: `apps/web/src/assets/brand/tk-observer-mark-mono.svg`
- Create: `apps/web/src/assets/brand/README.md`

**Interfaces:**
- Consumes: the color and geometry contract from Task 1
- Produces: canonical SVG sources for product UI and exports

- [ ] Draw the deep-green rounded-square primary mark with one observation eye, fused TK path, and one blue signal point.
- [ ] Derive the transparent symbol and single-color mark without adding alternate geometry.
- [ ] Document usage, safe area, minimum size, palette, and GitHub references.
- [ ] Run the Task 1 test and eval commands and confirm both pass.

### Task 3: PNG Rendering And Visual Proof

**Files:**
- Create: `scripts/render-brand-logo.mjs`
- Create: `design-assets/tk-observer-logo/tk-observer-mark-1024.png`
- Create: `design-assets/tk-observer-logo/tk-observer-mark-symbol-1024.png`
- Create: `design-assets/tk-observer-logo/tk-observer-mark-mono-1024.png`
- Create: `design-assets/tk-observer-logo/tk-observer-logo-preview.png`

**Interfaces:**
- Consumes: canonical SVG sources from Task 2
- Produces: reproducible commercial preview and raster exports

- [ ] Render each SVG with Playwright at 1024 x 1024 and preserve alpha for transparent assets.
- [ ] Render a preview showing white, dark, glass, and 32px use cases.
- [ ] Verify PNG dimensions and alpha channels with deterministic file inspection.
- [ ] Run `pnpm typecheck`, focused tests, `pnpm --dir apps/web test:eval`, `pnpm build`, and `git diff --check`.
