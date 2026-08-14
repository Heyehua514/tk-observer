/**
 * E2E 通用登录辅助
 * 用途：多角色账号登录与会话切换。
 * 所属工作台：全局（质量门禁）
 * 权限：需要本地 Supabase 与 6 个测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import type { Page } from 'playwright/test'

export const TEST_PASSWORD = process.env.TK_OBSERVER_TEST_PASSWORD ?? ''

export const accounts = {
  boss: 'leige@tk-observer.test',
  business: 'dongyuchen@tk-observer.test',
  market: 'hansuyun@tk-observer.test',
  design: 'sunmingze@tk-observer.test',
  editing: 'xiejie@tk-observer.test',
} as const

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.locator('input[type=email]').fill(email)
  await page.locator('input[type=password]').fill(TEST_PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/\/(overview|business|market|design|editing)/)
  await page.waitForLoadState('domcontentloaded')
}

export async function switchAccount(page: Page, email: string) {
  await page.evaluate(() => localStorage.clear())
  await page.context().clearCookies()
  await login(page, email)
}
