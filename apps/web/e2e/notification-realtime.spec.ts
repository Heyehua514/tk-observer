/**
 * 总览通知实时到达端到端
 * 用途：商机成交自动通知磊哥（DB 触发器）→ 铃铛通过 Supabase Realtime 即时刷新，无需刷新页面。
 * 所属工作台：总览（磊哥）/ 商务（董雨辰）
 * 权限：需要 boss 与 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test, type Page } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteNotificationsByContentPrefix,
  softDeleteOpportunity,
  TEST_PASSWORD,
  updateOpportunityStage,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

async function readUnreadCount(page: Page): Promise<number> {
  const header = page.getByText(/(\d+) 条未读|已全部读取/)
  await expect(header.first()).toBeVisible()
  const text = (await header.first().textContent()) || ''
  const match = text.match(/(\d+) 条未读/)
  return match ? Number(match[1]) : 0
}

test('商机成交自动通知磊哥：铃铛 Realtime 实时到达', async ({
  page,
  browser,
}) => {
  const ts = Date.now()
  const oppTitle = `E2E成交-${ts}`
  const clientName = `E2E成交客户-${ts}`

  // 上下文 A：磊哥（boss）总览页，铃铛订阅保持打开
  await login(page, accounts.boss)
  await page.goto('/overview')
  const bell = page.getByRole('button', { name: '通知' })
  await expect(bell).toBeVisible()

  // 清理历史残留通知（内容前缀）
  const cleaned = await softDeleteNotificationsByContentPrefix(
    page,
    '「E2E成交-'
  )
  expect(cleaned).toBe(true)

  // 记录插入前未读数
  await bell.click()
  const before = await readUnreadCount(page)
  await page.keyboard.press('Escape')

  // 上下文 B：董雨辰（business）建客户 + 商机 → 阶段置为已成交（触发通知触发器）
  const bizContext = await browser.newContext()
  const bizPage = await bizContext.newPage()
  await login(bizPage, accounts.business)
  await bizPage.goto('/business?tab=clients')
  await bizPage.getByRole('button', { name: '新增客户' }).click()
  const clientDialog = bizPage.getByRole('dialog')
  await clientDialog.locator('input').first().fill(clientName)
  await clientDialog.locator('input').nth(2).fill('E2E对接人')
  await clientDialog.getByRole('button', { name: '保存' }).click()
  await expect(
    bizPage.locator('tbody tr', { hasText: clientName })
  ).toHaveCount(1)

  await bizPage.goto('/business?tab=opportunities')
  await bizPage.getByRole('button', { name: '新增商机' }).click()
  const oppDialog = bizPage.getByRole('dialog')
  await oppDialog.locator('input').first().fill(oppTitle)
  await oppDialog.getByRole('combobox').click()
  await bizPage.getByRole('option', { name: clientName }).click()
  await oppDialog.locator('input').nth(2).fill('50000')
  await oppDialog.getByRole('button', { name: '保存' }).click()
  await expect(
    bizPage.locator('article', { hasText: oppTitle })
  ).toHaveCount(1)

  const stageUpdated = await updateOpportunityStage(
    bizPage,
    oppTitle,
    'won'
  )
  expect(stageUpdated).toBe(true)

  // 磊哥页面不刷新：Realtime 推送后铃铛列表即时出现新通知（以商机标题为唯一标识断言）
  await bell.click()
  await expect(page.getByText(oppTitle).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('商机已成交').first()).toBeVisible()
  const after = await readUnreadCount(page)
  expect(after).toBe(before + 1)
  await page.keyboard.press('Escape')

  // 清理：磊哥软删通知；董雨辰软删商机 + UI 删除客户
  const notifCleaned = await softDeleteNotificationsByContentPrefix(
    page,
    `「${oppTitle}`
  )
  expect(notifCleaned).toBe(true)
  const oppCleaned = await softDeleteOpportunity(bizPage, oppTitle)
  expect(oppCleaned).toBe(true)
  await bizPage.goto('/business?tab=clients')
  const row = bizPage.locator('tbody tr', { hasText: clientName })
  await row.getByRole('button', { name: '删除客户' }).click()
  await expect(
    bizPage.locator('tbody tr', { hasText: clientName })
  ).toHaveCount(0)
  await bizContext.close()
})
