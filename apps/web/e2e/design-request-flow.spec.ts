/**
 * 设计工作台需求闭环端到端
 * 用途：磊哥提交设计需求 → 孙铭泽登录看到并接单（pending → in_progress）。
 * 所属工作台：设计（孙铭泽）
 * 权限：需要 boss + design 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteRowsByFieldPrefix,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('需求提交-设计师接单闭环', async ({ browser }) => {
  const title = `E2E需求-${Date.now()}`
  const bossContext = await browser.newContext()
  const bossPage = await bossContext.newPage()
  await login(bossPage, accounts.boss)
  await bossPage.goto('/design')
  await bossPage.getByRole('button', { name: '提交设计需求' }).click()
  const form = bossPage.getByRole('dialog')
  await form.locator('input[name=title]').fill(title)
  await form.locator('input[name=dueDate]').fill('2026-09-01')
  await form.locator('input[name=targetSize]').fill('1080×1920')
  await form.locator('input[name=usageScene]').fill('朋友圈海报')
  await form.locator('input[name=deliveryFormat]').fill('PNG')
  await form.locator('textarea[name=description]').fill('E2E 回归需求描述')
  await form.locator('textarea[name=copyContent]').fill('E2E 回归文案')
  await form.getByRole('button', { name: '提交需求' }).click()
  await expect(
    bossPage.locator('tbody tr', { hasText: title })
  ).toHaveCount(1)
  // 注意：bossContext 保留到用例结束，用于最终软删除回收

  const designContext = await browser.newContext()
  const designPage = await designContext.newPage()
  await login(designPage, accounts.design)
  await designPage.goto('/design')
  const row = designPage.locator('tbody tr', { hasText: title })
  await expect(row).toHaveCount(1)
  await row.click()
  const detail = designPage.getByRole('dialog')
  await expect(detail.getByRole('button', { name: '制作中' })).toBeVisible()
  await detail.getByRole('button', { name: '制作中' }).click()
  await expect(detail.getByRole('button', { name: '已交付' })).toBeVisible()
  await expect(detail.getByText('制作中')).toBeVisible()

  // 回收：磊哥软删除需求，避免残留污染计数
  await expect
    .poll(() =>
      softDeleteRowsByFieldPrefix(
        bossPage,
        'design_requirements',
        'title',
        title
      )
    )
    .toBe(true)
  await bossContext.close()
  await designContext.close()
})
