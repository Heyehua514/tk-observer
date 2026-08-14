/**
 * 商务工作台商机 Pipeline 端到端
 * 用途：登录董雨辰 → 建客户 → 建商机 → 看板拖拽流转 → 详情改已流失（必填原因）→ 清理回收。
 * 所属工作台：商务（董雨辰）
 * 权限：需要 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteOpportunity,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('商机看板拖拽-已流失必填-清理回收', async ({ page }) => {
  await login(page, accounts.business)
  const ts = Date.now()
  const clientName = `E2E商机客户-${ts}`
  const oppTitle = `E2E商机-${ts}`

  // 1. 新增客户
  await page.goto('/business?tab=clients')
  await page.getByRole('button', { name: '新增客户' }).click()
  const clientDialog = page.getByRole('dialog')
  await clientDialog.locator('input').first().fill(clientName)
  await clientDialog.locator('input').nth(2).fill('E2E对接人')
  await clientDialog.getByRole('button', { name: '保存' }).click()
  const clientRow = page.locator('tbody tr', { hasText: clientName })
  await expect(clientRow).toHaveCount(1)

  // 2. 新增商机
  await page.goto('/business?tab=opportunities')
  await page.getByRole('button', { name: '新增商机' }).click()
  const oppDialog = page.getByRole('dialog')
  await oppDialog.locator('input').first().fill(oppTitle)
  await oppDialog.getByRole('combobox').click()
  await page.getByRole('option', { name: clientName }).click()
  await oppDialog.locator('input').nth(2).fill('50000')
  await oppDialog.locator('input').nth(3).fill('2026-09-30')
  await oppDialog.getByRole('button', { name: '保存' }).click()
  const card = page.locator('article', { hasText: oppTitle })
  await expect(card).toHaveCount(1)
  await expect(
    page.locator('section', { hasText: '初步接洽' }).locator('article', { hasText: oppTitle })
  ).toHaveCount(1)

  // 3. 拖拽：初步接洽 → 方案报价
  const proposalCol = page.locator('section', { hasText: '方案报价' })
  await card.dragTo(proposalCol)
  await expect(
    proposalCol.locator('article', { hasText: oppTitle })
  ).toHaveCount(1)
  await expect(
    page.locator('section', { hasText: '初步接洽' }).locator('article', { hasText: oppTitle })
  ).toHaveCount(0)

  // 4. 详情：改已流失，空原因被前端拒绝，填原因后落位
  await card.click()
  const detail = page.getByRole('dialog')
  await detail.getByRole('combobox').click()
  await page.getByRole('option', { name: '已流失' }).click()
  await detail.getByRole('button', { name: '保存详情' }).click()
  await expect(page.getByText('流失原因必填')).toBeVisible()

  await detail.locator('input').nth(2).fill('预算不足')
  await detail.getByRole('button', { name: '保存详情' }).click()
  await expect(
    page.locator('section', { hasText: '已流失' }).locator('article', { hasText: oppTitle })
  ).toHaveCount(1)

  // 5. 清理：软删除商机（business update 权限），UI 删除客户
  const cleaned = await softDeleteOpportunity(page, oppTitle)
  expect(cleaned).toBe(true)
  await page.goto('/business?tab=clients')
  const row = page.locator('tbody tr', { hasText: clientName })
  await row.getByRole('button', { name: '删除客户' }).click()
  await expect(page.locator('tbody tr', { hasText: clientName })).toHaveCount(0)
})
