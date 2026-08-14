/**
 * 商务工作台渠道商单取消原因端到端
 * 用途：登录董雨辰 → 建客户 → 建商单 → 状态切「已取消」空原因被禁 → 填原因确认 → 列表显示取消原因 → 清理回收。
 * 前置：本地 Supabase 已有「E2E可商务达人」（is_biz_available=true）。
 * 所属工作台：商务（董雨辰）
 * 权限：需要 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import { accounts, login, TEST_PASSWORD } from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('渠道商单取消原因必填闭环', async ({ page }) => {
  await login(page, accounts.business)
  const ts = Date.now()
  const clientName = `E2E取消客户-${ts}`
  const orderTitle = `E2E取消商单-${ts}`

  // 1. 新增客户
  await page.goto('/business?tab=clients')
  await page.getByRole('button', { name: '新增客户' }).click()
  const clientDialog = page.getByRole('dialog')
  await clientDialog.locator('input').first().fill(clientName)
  await clientDialog.locator('input').nth(2).fill('E2E对接人')
  await clientDialog.getByRole('button', { name: '保存' }).click()
  const clientRow = page.locator('tbody tr', { hasText: clientName })
  await expect(clientRow).toHaveCount(1)

  // 2. 新增商单（选择可商务达人）
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

  // 3. 状态切「已取消」→ 弹窗必填原因 → 确认后列表带出取消原因
  await orderRow.getByRole('combobox').click()
  await page.getByRole('option', { name: '已取消' }).click()
  const cancelDialog = page.getByRole('dialog')
  await expect(cancelDialog.getByText('取消商单')).toBeVisible()
  const confirmButton = cancelDialog.getByRole('button', { name: '确认取消' })
  await expect(confirmButton).toBeDisabled()
  await cancelDialog.locator('textarea').fill('客户预算调整')
  await expect(confirmButton).toBeEnabled()
  await confirmButton.click()

  await expect(orderRow.getByText('已取消')).toHaveCount(1)
  await expect(orderRow.getByRole('combobox')).toHaveAttribute(
    'title',
    /取消原因：客户预算调整/
  )

  // 4. 清理回收
  await orderRow.getByRole('button', { name: '删除商单' }).click()
  await expect(page.locator('tbody tr', { hasText: orderTitle })).toHaveCount(0)
  await page.goto('/business?tab=clients')
  await page
    .locator('tbody tr', { hasText: clientName })
    .getByRole('button', { name: '删除客户' })
    .click()
  await expect(page.locator('tbody tr', { hasText: clientName })).toHaveCount(0)
})
