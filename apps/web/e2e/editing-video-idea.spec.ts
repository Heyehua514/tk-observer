/**
 * 剪辑工作台选题新增端到端
 * 用途：登录谢洁 → 新增选题 → 列表可见 → 删除回收。
 * 所属工作台：剪辑（谢洁）
 * 权限：需要 editing 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import { accounts, login, TEST_PASSWORD } from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('选题新增-列表可见-删除回收', async ({ page }) => {
  await login(page, accounts.editing)
  const title = `E2E选题-${Date.now()}`
  await page.goto('/editing')

  await page.getByRole('button', { name: '新增选题' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog
    .locator('input[placeholder="例如：东南亚选品最容易踩的 3 个坑"]')
    .fill(title)
  await dialog.getByRole('button', { name: '新增选题' }).click()

  const row = page.locator('tbody tr', { hasText: title })
  await expect(row).toHaveCount(1)

  await row.getByRole('button', { name: '选题操作' }).click()
  await page.getByRole('menuitem', { name: '删除' }).click()
  await page.getByRole('button', { name: '确认删除' }).click()
  await expect(page.locator('tbody tr', { hasText: title })).toHaveCount(0)
})
