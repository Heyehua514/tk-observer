/**
 * 商务工作台朋友圈复盘闭环端到端
 * 用途：登录董雨辰 → 建客户+商机 → 新增朋友圈计划 → 发布 → 复盘回填实际效果并关联商机
 *       → 商机 notes 自动追加「来源：朋友圈」→ 清理回收。
 * 所属工作台：商务（董雨辰）
 * 权限：需要 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  readOpportunityNotes,
  softDeleteOpportunity,
  softDeleteSocialPlansByPrefix,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('朋友圈计划复盘回填-商机来源自动追加-清理回收', async ({ page }) => {
  await login(page, accounts.business)
  const ts = Date.now()
  const clientName = `E2E复盘客户-${ts}`
  const oppTitle = `E2E复盘商机-${ts}`
  const content = `E2E朋友圈复盘-${ts}`
  const actualResult = `E2E复盘实际效果-${ts}`
  const today = new Date().toISOString().slice(0, 10)

  // 1. 新增客户
  await page.goto('/business?tab=clients')
  await page.getByRole('button', { name: '新增客户' }).click()
  const clientDialog = page.getByRole('dialog')
  await clientDialog.locator('input').first().fill(clientName)
  await clientDialog.locator('input').nth(2).fill('E2E复盘对接人')
  await clientDialog.getByRole('button', { name: '保存' }).click()
  await expect(page.locator('tbody tr', { hasText: clientName })).toHaveCount(1)

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
  await expect(page.locator('article', { hasText: oppTitle })).toHaveCount(1)

  // 3. 新增朋友圈计划（今天）
  await page.goto('/business?tab=social')
  await page.getByRole('button', { name: '新增计划' }).click()
  const planDialog = page.getByRole('dialog')
  await planDialog.locator('input[type=date]').fill(today)
  await planDialog.locator('textarea').fill(content)
  await planDialog.locator('input:not([type=date])').nth(0).fill('TikTok 品牌方负责人')
  await planDialog.locator('input:not([type=date])').nth(1).fill('引导私信咨询商单')
  await planDialog.getByRole('button', { name: '保存' }).click()

  // 4. 列表视图：已计划 → 已发布
  await page.getByRole('tab', { name: '列表视图' }).click()
  const row = page.locator('tbody tr', { hasText: content })
  await expect(row).toHaveCount(1)
  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: '已发布' }).click()
  await expect(row).toContainText('已发布')

  // 5. 复盘：回填实际效果 + 关联商机
  await row.getByRole('button', { name: '复盘计划' }).click()
  const reviewDialog = page.getByRole('dialog')
  await reviewDialog.locator('textarea').fill(actualResult)
  await reviewDialog.getByRole('combobox').click()
  await page.getByRole('option', { name: oppTitle }).click()
  await reviewDialog.getByRole('button', { name: '保存复盘' }).click()

  // 6. 列表显示已复盘 + 实际效果
  await expect(row).toContainText('已复盘')
  await expect(row).toContainText(actualResult)

  // 7. 商机 notes 被触发器自动追加来源
  const notes = await readOpportunityNotes(page, oppTitle)
  expect(notes).toContain('来源：朋友圈')
  expect(notes).toContain(content)

  // 8. 清理回收：软删商机 + 朋友圈计划，UI 删客户
  const cleaned = await softDeleteOpportunity(page, oppTitle)
  expect(cleaned).toBe(true)
  await softDeleteSocialPlansByPrefix(page, 'E2E朋友圈复盘-')
  await page.goto('/business?tab=clients')
  const clientRow = page.locator('tbody tr', { hasText: clientName })
  await clientRow.getByRole('button', { name: '删除客户' }).click()
  await expect(page.locator('tbody tr', { hasText: clientName })).toHaveCount(0)
})
