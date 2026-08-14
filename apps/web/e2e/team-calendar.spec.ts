/**
 * 总览工作台团队日历端到端
 * 用途：董雨辰创建今天的朋友圈计划 → 切磊哥在团队日历月视图看到「朋友圈 · 内容」→ 切回董雨辰回收。
 * 所属工作台：总览（磊哥）/ 商务（董雨辰）跨角色共享
 * 权限：需要 business + boss 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteSocialPlansByPrefix,
  switchAccount,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('团队日历聚合朋友圈排期-跨角色可见-清理回收', async ({ page }) => {
  await login(page, accounts.business)
  const content = `E2E日历-${Date.now()}`
  const today = new Date().toISOString().slice(0, 10)

  // 1. 董雨辰创建今天的朋友圈计划
  await page.goto('/business?tab=social')
  await softDeleteSocialPlansByPrefix(page, 'E2E日历')
  await page.getByRole('button', { name: '新增计划' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=date]').fill(today)
  await dialog.locator('textarea').fill(content)
  await dialog.locator('input:not([type=date])').nth(0).fill('内部团队')
  await dialog.locator('input:not([type=date])').nth(1).fill('汇总到团队日历')
  await dialog.getByRole('button', { name: '保存' }).click()
  // 日历视图每格最多渲染 2 条，残留数据会挡住新计划；切列表视图断言更稳定。
  await page.getByRole('tab', { name: '列表视图' }).click()
  await expect(page.locator('tbody tr', { hasText: content })).toHaveCount(1)

  // 2. 磊哥在团队日历看到朋友圈排期
  await switchAccount(page, accounts.boss)
  await page.goto('/overview/calendar')
  await expect(page.getByText(`朋友圈 · ${content}`)).toBeVisible()

  // 3. 切回董雨辰软删除回收
  await switchAccount(page, accounts.business)
  await page.goto('/business?tab=social')
  await page.getByRole('tab', { name: '列表视图' }).click()
  const row = page.locator('tbody tr', { hasText: content })
  await expect(row).toHaveCount(1)
  await row.getByRole('button', { name: '删除计划' }).click()
  await expect(page.locator('tbody tr', { hasText: content })).toHaveCount(0)
})
