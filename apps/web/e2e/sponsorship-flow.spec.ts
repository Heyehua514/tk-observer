/**
 * 商务/市场活动招商跨工作台端到端
 * 用途：董雨辰建客户 → 韩素云建活动并录入招商意向 → 市场详情招商 Tab 展示 → 商务活动招商面板改状态 → 清理回收。
 * 所属工作台：市场（韩素云）+ 商务（董雨辰）
 * 权限：需要 market/business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  findRowId,
  insertEventSponsorship,
  login,
  softDeleteSponsorship,
  switchAccount,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('活动招商录入-展示-商务跟进-清理回收', async ({ page }) => {
  await login(page, accounts.business)
  const ts = Date.now()
  const clientName = `E2E赞助客户-${ts}`
  const eventName = `E2E招商活动-${ts}`

  // 1. 董雨辰新建客户
  await page.goto('/business?tab=clients')
  await page.getByRole('button', { name: '新增客户' }).click()
  const clientDialog = page.getByRole('dialog')
  await clientDialog.locator('input').first().fill(clientName)
  await clientDialog.locator('input').nth(2).fill('E2E对接人')
  await clientDialog.getByRole('button', { name: '保存' }).click()
  await expect(
    page.locator('tbody tr', { hasText: clientName })
  ).toHaveCount(1)
  const clientId = await findRowId(page, 'clients', 'name', clientName)
  expect(clientId).toBeTruthy()

  // 2. 韩素云新建活动并进入详情
  await switchAccount(page, accounts.market)
  await page.goto('/market')
  await page.getByRole('tab', { name: '活动排期' }).click()
  await page.getByPlaceholder('活动名称').fill(eventName)
  await page.getByPlaceholder('城市').fill('厦门')
  await page
    .locator('input[type=date]')
    .filter({ visible: true })
    .fill('2026-09-01')
  await page.getByRole('button', { name: '新建活动' }).click()
  const eventRow = page.locator('tbody tr', { hasText: eventName })
  await expect(eventRow).toHaveCount(1)
  await eventRow.getByRole('link').click()
  await page.waitForURL(/\/market\/events\/.+/)
  const eventId = page.url().split('/').pop() ?? ''
  expect(eventId).toBeTruthy()

  // 3. 录入一条招商意向（market 有插入权限）
  const inserted = await insertEventSponsorship(page, {
    eventId,
    clientId,
    contactName: 'E2E联系人',
    amount: 200000,
  })
  expect(inserted).toBe(true)
  // 外部 REST 写入不触发 react-query 失效，重载详情页重新拉取共享表数据
  await page.reload()
  await page.waitForLoadState('domcontentloaded')

  // 4. 市场活动详情招商跟进 Tab 展示赞助公司
  await page.getByRole('tab', { name: '招商跟进' }).click()
  await expect(page.getByText(clientName)).toBeVisible()

  // 5. 董雨辰活动招商面板可见并推进到已签约
  await switchAccount(page, accounts.business)
  await page.goto('/business?tab=sponsorships')
  const sponsorshipRow = page.locator('tbody tr', { hasText: eventName })
  await expect(sponsorshipRow).toHaveCount(1)
  await expect(sponsorshipRow.getByText(clientName)).toBeVisible()
  await sponsorshipRow.getByRole('combobox').click()
  await page.getByRole('option', { name: '已签约' }).click()
  await expect(sponsorshipRow.getByText('已签约')).toHaveCount(1)

  // 6. 清理回收：软删招商 → 删活动 → 删客户
  expect(await softDeleteSponsorship(page, eventId)).toBe(true)
  await switchAccount(page, accounts.market)
  await page.goto('/market')
  await page.getByRole('tab', { name: '活动排期' }).click()
  await page
    .locator('tbody tr', { hasText: eventName })
    .getByRole('button', { name: '删除活动' })
    .click()
  await expect(
    page.locator('tbody tr', { hasText: eventName })
  ).toHaveCount(0)
  await switchAccount(page, accounts.business)
  await page.goto('/business?tab=clients')
  await page
    .locator('tbody tr', { hasText: clientName })
    .getByRole('button', { name: '删除客户' })
    .click()
  await expect(
    page.locator('tbody tr', { hasText: clientName })
  ).toHaveCount(0)
})
