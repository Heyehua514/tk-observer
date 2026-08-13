/**
 * 商务工作台客户 CRUD 端到端
 * 用途：登录后走通「新增客户 → 检索命中 → 删除回收」闭环。
 * 所属工作台：商务
 * 权限：需要 boss/business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test, type Page } from 'playwright/test'

const PASSWORD = process.env.TK_OBSERVER_TEST_PASSWORD ?? ''
const EMAIL = process.env.TK_OBSERVER_TEST_EMAIL ?? 'leige@tk-observer.test'

async function login(page: Page) {
  await page.goto('/login')
  await page.locator('input[type=email]').fill(EMAIL)
  await page.locator('input[type=password]').fill(PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForURL('**/overview**')
}

test.skip(!PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('客户新增-检索-删除闭环', async ({ page }) => {
  await login(page)
  const name = `E2E客户-${Date.now()}`
  await page.goto('/business?tab=clients')

  await page.getByRole('button', { name: '新增客户' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input').first().fill(name)
  await dialog.locator('input').nth(2).fill('E2E对接人')
  await dialog.getByRole('button', { name: '保存' }).click()

  const row = page.locator('tbody tr', { hasText: name })
  await expect(row).toHaveCount(1)

  await page.getByPlaceholder('搜索客户、对接人或公司').fill(name)
  await expect(page.locator('tbody tr')).toHaveCount(1)

  await row.getByRole('button', { name: '删除客户' }).click()
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(0)
})
