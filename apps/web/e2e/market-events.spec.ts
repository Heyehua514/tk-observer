/**
 * 市场工作台活动管理端到端
 * 用途：登录韩素云 → 新建活动 → 列表可见 → 删除回收。
 * 所属工作台：市场（韩素云）
 * 权限：需要 market 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import { accounts, login, TEST_PASSWORD } from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('活动新增-列表可见-删除回收', async ({ page }) => {
  await login(page, accounts.market)
  const name = `E2E活动-${Date.now()}`
  await page.goto('/market')
  await page.getByRole('tab', { name: '活动排期' }).click()

  await page.getByPlaceholder('活动名称').fill(name)
  await page.getByPlaceholder('城市').fill('厦门')
  await page.locator('input[type=date]').filter({ visible: true }).fill('2026-09-01')
  await page.getByRole('button', { name: '新建活动' }).click()

  const row = page.locator('tbody tr', { hasText: name })
  await expect(row).toHaveCount(1)

  await row.getByRole('button', { name: '删除活动' }).click()
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(0)
})
