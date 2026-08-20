/**
 * 移动端侧边栏抽屉（C6）端到端
 * 用途：验证 iPhone 视口下标题栏触发按钮会弹出 Sheet 抽屉，抽屉展示工作台菜单并可控关闭。
 * 所属工作台：全局（应用壳 / 移动端）
 * 权限：需要已登录账号（boss）；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test, devices } from 'playwright/test'
import { accounts, login } from './helpers'

test.skip(
  !process.env.TK_OBSERVER_TEST_PASSWORD,
  '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例'
)

test.describe('移动端侧边栏抽屉', () => {
  test('iPhone 视口可拉出抽屉、看到工作台菜单并关闭', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 13'] })
    const page = await context.newPage()

    await login(page, accounts.boss)

    // 应用壳标题栏的移动端触发按钮（sidebar.tsx 的 data-sidebar=trigger）
    const trigger = page.locator('[data-sidebar="trigger"]')
    await expect(trigger).toBeVisible()
    await trigger.click()

    // Sheet 抽屉弹出：移动端 sidebar 用 data-mobile=true 渲染
    const drawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
    await expect(drawer).toBeVisible()

    // 抽屉内应含品牌标识与「最近访问」分组
    await expect(drawer.getByText('TK观察工作台')).toBeVisible()
    await expect(drawer.getByText('最近访问').first()).toBeVisible()

    // 点抽屉内一个菜单项应能跳转（用于确保菜单确实可交互，不只是一张静态面板）
    await drawer.getByText('总览工作台').first().click()
    await page.waitForURL(/\/overview/)

    // 再次展开并关闭抽屉
    await trigger.click()
    await expect(drawer).toBeVisible()
    const closeBtn = drawer
      .locator('button')
      .filter({ hasText: 'Close' })
      .first()
    await closeBtn.click()
    await expect(drawer).not.toBeVisible()

    await context.close()
  })
})
