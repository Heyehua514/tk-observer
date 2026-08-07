# Opportunity CNY Amount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make opportunity expected amounts accept RMB yuan while preserving integer fen storage.

**Architecture:** A focused opportunity amount module owns exact string-to-fen conversion and CNY formatting. The workbench keeps the draft as a string, blocks invalid submissions, converts at the mutation boundary, and displays stored fen through the shared formatter.

**Tech Stack:** React 18, TypeScript, Vitest Browser, TanStack Query, PocketBase

## Global Constraints

- PocketBase continues to store integer minor units.
- No migration or existing record rewrite.
- No unrelated icon or UI styling changes.
- Gate tests must remain deterministic and local.

---

### Task 1: Opportunity Amount Contract

**Files:**
- Create: `apps/web/src/features/business/opportunities/opportunity-amount.ts`
- Test: `apps/web/src/features/business/opportunities/opportunity-amount.test.ts`

**Interfaces:**
- Consumes: `formatMoney(amountMinor: number, currency?: string)` from `@/lib/format`
- Produces: `yuanToFen(value: string): number | null` and `formatCny(amountFen: number): string`

- [ ] **Step 1: Write failing conversion and formatting tests**

```ts
expect(yuanToFen('10000')).toBe(1_000_000)
expect(yuanToFen('9999.50')).toBe(999_950)
expect(yuanToFen('12.345')).toBeNull()
expect(yuanToFen('-1')).toBeNull()
expect(formatCny(1_000_000)).toBe('¥10,000.00')
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --dir apps/web test opportunity-amount.test.ts`
Expected: FAIL because `opportunity-amount.ts` does not exist.

- [ ] **Step 3: Implement exact string conversion and CNY formatting**

Use a decimal string regular expression, pad the fractional part to two digits, reject unsafe integers, and delegate display to `formatMoney(amountFen, 'CNY')`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --dir apps/web test opportunity-amount.test.ts`
Expected: PASS with all amount cases green.

### Task 2: Opportunity Form Integration

**Files:**
- Modify: `apps/web/src/features/business/opportunities/opportunities-workbench.tsx`
- Test: `apps/web/src/features/business/opportunities/opportunities-workbench.test.tsx`

**Interfaces:**
- Consumes: `yuanToFen` and `formatCny` from Task 1.
- Produces: a form labeled `预计金额（人民币/元）` that sends integer fen to PocketBase.

- [ ] **Step 1: Write a failing component behavior test**

Render the workbench with mocked query data and PocketBase creation. Open `新增商机`, select a client, type `10000`, save, and assert the create payload contains `amount: 1_000_000`.

- [ ] **Step 2: Run the component test and verify RED**

Run: `pnpm --dir apps/web test opportunities-workbench.test.tsx`
Expected: FAIL because the current form label is `预计金额（美分）` and submits the raw input.

- [ ] **Step 3: Integrate RMB input at the mutation boundary**

Keep `draft.amount` as a string, derive `amountFen`, disable save for invalid amounts, pass the converted payload to `create.mutate`, and render cards with `formatCny`.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
pnpm --dir apps/web test opportunity-amount.test.ts opportunities-workbench.test.tsx
pnpm typecheck
pnpm lint
pnpm --dir apps/web format:check
pnpm --dir apps/web test
pnpm --dir apps/web test:eval
pnpm build
git diff --check
```

Expected: every command exits zero with no warnings.

- [ ] **Step 5: Commit only the scoped implementation**

```bash
git add apps/web/src/features/business/opportunities/opportunity-amount.ts \
  apps/web/src/features/business/opportunities/opportunity-amount.test.ts \
  apps/web/src/features/business/opportunities/opportunities-workbench.tsx \
  apps/web/src/features/business/opportunities/opportunities-workbench.test.tsx \
  docs/superpowers/plans/2026-08-07-opportunity-cny-amount.md
git commit -m "fix: use RMB yuan for opportunity amounts"
```
