/**
 * 商务工作台朋友圈计划端到端
 * 用途：登录董雨辰 → 新增朋友圈计划（周视图可见）→ 列表视图状态流转（已计划→已发布）→ 删除回收。
 * 所属工作台：商务（董雨辰）
 * 权限：需要 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import { accounts, login, TEST_PASSWORD } from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('朋友圈计划新增-状态流转-删除回收', async ({ page }) => {
  await login(page, accounts.business)
  const ts = Date.now()
  const content = `E2E朋友圈计划-${ts}`
  const today = new Date().toISOString().slice(0, 10)

  await page.goto('/business?tab=social')

  // 1. 新增计划：日期=今天（确保落入本周周视图）
  await page.getByRole('button', { name: '新增计划' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=date]').fill(today)
  await dialog.locator('textarea').fill(content)
  await dialog.locator('input:not([type=date])').nth(0).fill('TikTok 品牌方负责人')
  await dialog.locator('input:not([type=date])').nth(1).fill('引导私信咨询商单')
  await dialog.getByRole('button', { name: '保存' }).click()

  // 2. 日历视图可见
  await expect(
    page.locator('div[title="' + content + '"]')
  ).toHaveCount(1)

  // 3. 列表视图：状态流转 已计划 → 已发布
  await page.getByRole('tab', { name: '列表视图' }).click()
  const row = page.locator('tbody tr', { hasText: content })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('已计划')
  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: '已发布' }).click()
  await expect(row).toContainText('已发布')

  // 4. 删除回收（软删除）
  await row.getByRole('button', { name: '删除计划' }).click()
  await expect(page.locator('tbody tr', { hasText: content })).toHaveCount(0)
})
