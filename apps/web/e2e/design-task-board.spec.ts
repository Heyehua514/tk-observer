/**
 * 设计工作台任务看板拖拽端到端
 * 用途：孙铭泽新增设计任务 → 四列看板拖拽（待设计→进行中）→ 状态列变化断言 → 软删回收。
 * 所属工作台：设计（孙铭泽）
 * 权限：需要 design 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteRowsByFieldValue,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('设计任务看板新增-拖拽流转-清理回收', async ({ page }) => {
  await login(page, accounts.design)
  const title = `E2E设计任务-${Date.now()}`
  await page.goto('/design')
  await page.getByRole('tab', { name: '设计任务' }).click()

  // 1. 新增任务（默认落待设计列）
  await page.getByRole('button', { name: '新增任务' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name=title]').fill(title)
  await dialog.locator('input[name=dueAt]').fill('2026-09-20')
  await dialog.getByRole('button', { name: '保存任务' }).click()
  const card = page.locator('article', { hasText: title })
  await expect(card).toHaveCount(1)
  const sectionByLabel = (label: string) =>
    page.locator('section.rounded-lg', { hasText: label })
  const todoSection = sectionByLabel('待设计')
  const doingSection = sectionByLabel('进行中')
  await expect(todoSection.locator('article', { hasText: title })).toHaveCount(
    1
  )

  // 2. 拖拽：待设计 → 进行中
  await card.dragTo(doingSection)
  await expect(doingSection.locator('article', { hasText: title })).toHaveCount(
    1
  )
  await expect(todoSection.locator('article', { hasText: title })).toHaveCount(
    0
  )

  // 3. 清理回收：软删任务（design 有 update 权限）
  await expect
    .poll(() => softDeleteRowsByFieldValue(page, 'design_tasks', 'title', title))
    .toBe(true)
})
