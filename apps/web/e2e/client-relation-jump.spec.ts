/**
 * 商务客户详情关联面板点击跳转端到端
 * 用途：董雨辰建客户 + 商机 + 渠道商单 → 客户详情右侧「关联商机/关联商单」面板点击条目 → 商机跳转 Pipeline 并自动打开商机详情、商单跳转渠道商单并高亮对应行 → 清理回收。
 * 前置：本地 Supabase 已有「E2E可商务达人」（is_biz_available=true）。
 * 所属工作台：商务（董雨辰）
 * 权限：需要 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteChannelOrder,
  softDeleteOpportunity,
  softDeleteRowsByFieldLike,
  softDeleteRowsByFieldValue,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('客户详情关联商机/商单点击跳转闭环', async ({ page }) => {
  await login(page, accounts.business)
  // 清理历史失败运行残留，避免污染关联面板断言
  await softDeleteRowsByFieldLike(page, 'channel_orders', 'title', 'E2E关联商单-')
  await softDeleteRowsByFieldLike(page, 'opportunities', 'title', 'E2E关联商机-')
  await softDeleteRowsByFieldLike(page, 'clients', 'name', 'E2E关联客户-')
  const ts = Date.now()
  const clientName = `E2E关联客户-${ts}`
  const oppTitle = `E2E关联商机-${ts}`
  const orderTitle = `E2E关联商单-${ts}`

  // 1. 新增客户
  await page.goto('/business?tab=clients')
  await page.getByRole('button', { name: '新增客户' }).click()
  const clientDialog = page.getByRole('dialog')
  await clientDialog.locator('input').first().fill(clientName)
  await clientDialog.locator('input').nth(2).fill('E2E关联对接人')
  await clientDialog.getByRole('button', { name: '保存' }).click()
  const clientRow = page.locator('tbody tr', { hasText: clientName })
  await expect(clientRow).toHaveCount(1)

  // 2. 新增商机（关联该客户）
  await page.goto('/business?tab=opportunities')
  await page.getByRole('button', { name: '新增商机' }).click()
  const oppDialog = page.getByRole('dialog')
  await oppDialog.locator('input').first().fill(oppTitle)
  await oppDialog.getByRole('combobox').click()
  await page.getByRole('option', { name: clientName }).click()
  await oppDialog.locator('input').nth(2).fill('50000')
  await oppDialog.getByRole('button', { name: '保存' }).click()
  await expect(page.locator('article', { hasText: oppTitle })).toHaveCount(1)

  // 3. 新增渠道商单（关联该客户 + 可商务达人）
  await page.goto('/business?tab=orders')
  await page.getByRole('button', { name: '新增商单' }).click()
  const orderDialog = page.getByRole('dialog')
  await orderDialog.locator('input').first().fill(orderTitle)
  await orderDialog.getByRole('combobox').nth(0).click()
  await page.getByRole('option', { name: clientName }).click()
  await orderDialog.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: /E2E可商务达人/ }).click()
  await orderDialog.locator('input').nth(1).fill('800')
  await orderDialog.getByRole('button', { name: '保存' }).click()
  const orderRow = page.locator('tbody tr', { hasText: orderTitle })
  await expect(orderRow).toHaveCount(1)

  // 4. 打开客户详情，点击关联商机 → 跳转商机 Pipeline 并自动打开商机详情
  await page.goto('/business?tab=clients')
  await clientRow.getByRole('button', { name: '查看客户详情' }).click()
  const detail = page.getByRole('dialog')
  await expect(detail.getByRole('heading', { name: '关联商机' })).toBeVisible()
  await expect(detail.getByRole('button', { name: new RegExp(oppTitle) })).toBeVisible()
  await detail.getByRole('button', { name: new RegExp(oppTitle) }).click()
  await expect(page).toHaveURL(/tab=opportunities/)
  await expect(page).toHaveURL(/recordType=opportunity/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: oppTitle })).toBeVisible()

  // 5. 关闭商机详情，回到客户列表，再打开客户详情，点击关联商单 → 跳转渠道商单并高亮该行
  await page.keyboard.press('Escape')
  await page.goto('/business?tab=clients')
  await clientRow.getByRole('button', { name: '查看客户详情' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: new RegExp(orderTitle) })
    .click()
  await expect(page).toHaveURL(/tab=orders/)
  await expect(page).toHaveURL(/recordType=order/)
  const jumpedRow = page.locator('tbody tr', { hasText: orderTitle })
  await expect(jumpedRow).toHaveCount(1)
  await expect(jumpedRow).toHaveClass(/bg-primary/)

  // 6. 清理回收：软删商单 + 商机，UI 删客户
  expect(await softDeleteChannelOrder(page, orderTitle)).toBe(true)
  expect(await softDeleteOpportunity(page, oppTitle)).toBe(true)
  expect(
    await softDeleteRowsByFieldValue(page, 'clients', 'name', clientName)
  ).toBe(true)
})
