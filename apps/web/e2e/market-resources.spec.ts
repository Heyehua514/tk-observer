/**
 * 市场资源库端到端（模板 / 物料 / 财务）
 * 用途：登录韩素云 → 录入文案模板（占位符预览+套用计数）→ 物料上传 → 财务明细录入+导出 → 软删回收。
 * 所属工作台：市场（韩素云）
 * 权限：需要 market 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { readFileSync } from 'node:fs'
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteRowsByFieldValue,
  TEST_PASSWORD,
  TINY_PNG,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('文案模板-物料上传-财务明细-导出回收', async ({ page }) => {
  const ts = Date.now()
  const eventName = `E2E资源活动-${ts}`
  const templateName = `E2E模板-${ts}`
  const materialName = `E2E物料-${ts}`
  const financeDesc = `E2E财务-${ts}-赞助到账`

  await login(page, accounts.market)

  // 前置：建一场活动，供模板套用与财务明细关联
  await page.goto('/market')
  await page.getByRole('tab', { name: '活动排期' }).click()
  await page.getByPlaceholder('活动名称').fill(eventName)
  await page.getByPlaceholder('城市').fill('厦门')
  await page
    .locator('input[type=date]')
    .filter({ visible: true })
    .fill('2026-09-01')
  await page.getByRole('button', { name: '新建活动' }).click()
  await expect(
    page.locator('tbody tr', { hasText: eventName })
  ).toHaveCount(1)

  await page.getByRole('tab', { name: '模板 / 物料 / 财务' }).click()

  try {
    // ── 文案模板：录入 → 占位符预览 → 套用活动 → 使用次数 +1
    await page.getByPlaceholder('模板名称').fill(templateName)
    await page.getByPlaceholder('标签，逗号分隔').fill('沙龙,邀约')
    await page
      .getByPlaceholder('模板正文，支持 {{活动名称}}')
      .fill(
        `诚邀您参加 {{活动名称}}，地点 {{活动城市}}，主题 {{活动主题}}，期待与您相见。`
      )
    await page.getByRole('button', { name: '新增模板' }).click()

    const templateRow = page.locator('button', { hasText: templateName })
    await expect(templateRow).toHaveCount(1)
    await expect(templateRow).toContainText('使用 0 次')
    await templateRow.click()

    const previewPanel = page.locator(
      'div.min-h-56.rounded-md.bg-muted.p-4'
    )
    await expect(previewPanel).toContainText('{{活动名称}}')
    await expect(previewPanel).toContainText('{{活动城市}}')

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:4173',
    })
    await page
      .locator('select')
      .filter({ visible: true })
      .last()
      .selectOption({ label: eventName })
    await expect(page.getByRole('button', { name: '套用并复制' })).toBeEnabled()
    await page.getByRole('button', { name: '套用并复制' }).click()
    await expect(previewPanel).toContainText(eventName)
    await expect(templateRow).toContainText('使用 1 次')

    // ── 物料管理：上传文件 → 卡片展示名称/类型/预览入口
    await page.getByRole('tab', { name: '物料管理' }).click()
    await page.getByPlaceholder('物料名称').fill(materialName)
    await page
      .locator('select')
      .filter({ visible: true })
      .nth(1)
      .selectOption({ label: '海报' })
    await page
      .locator('input[type=file]')
      .filter({ visible: true })
      .setInputFiles({
        name: 'material.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      })
    await page.getByPlaceholder('备注').fill('主视觉候选稿')
    await page.getByRole('button', { name: '新增物料' }).click()

    const materialCard = page
      .locator('div.rounded-md.border.p-4', { hasText: materialName })
      .last()
    await expect(materialCard).toContainText('海报')
    await expect(
      materialCard.getByRole('link', { name: '预览文件' })
    ).toBeVisible()

    // ── 财务明细：选活动 → 收入/赞助收入 → 金额 120000 元 → 新增 → 导出 CSV/Markdown
    await page.getByRole('tab', { name: '财务明细' }).click()
    const financeSelects = page.locator('select').filter({ visible: true })
    await financeSelects.nth(0).selectOption({ label: eventName })
    await financeSelects.nth(1).selectOption({ label: '收入' })
    await financeSelects.nth(2).selectOption({ label: '赞助收入' })
    await page.getByPlaceholder('金额（人民币/元）').fill('120000')
    await page.getByPlaceholder('说明').fill(financeDesc)
    await page
      .locator('input[type=date]')
      .filter({ visible: true })
      .fill('2026-08-14')
    await page.getByRole('button', { name: '新增明细' }).click()

    const financeRow = page.locator('tbody tr', { hasText: financeDesc })
    await expect(financeRow).toHaveCount(1)
    await expect(financeRow).toContainText('¥120,000.00')
    await expect(page.getByText('¥120,000.00').first()).toBeVisible()

    const csvDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSV' }).click()
    const csv = await csvDownload
    expect(csv.suggestedFilename()).toBe('event-finances.csv')
    const csvPath = await csv.path()
    expect(readFileSync(csvPath, 'utf8')).toContain(financeDesc)
    expect(readFileSync(csvPath, 'utf8')).toContain('¥120,000.00')

    const mdDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Markdown' }).click()
    const md = await mdDownload
    expect(md.suggestedFilename()).toBe('event-finances.md')
    const mdPath = await md.path()
    expect(readFileSync(mdPath, 'utf8')).toContain('# 活动财务复盘')
    expect(readFileSync(mdPath, 'utf8')).toContain(financeDesc)
  } finally {
    // 兜底清理：软删模板 / 物料 / 财务 / 活动，避免残留污染计数
    await expect
      .poll(() => softDeleteRowsByFieldValue(page, 'event_templates', 'name', templateName))
      .toBe(true)
    await expect
      .poll(() => softDeleteRowsByFieldValue(page, 'event_materials', 'name', materialName))
      .toBe(true)
    await expect
      .poll(() =>
        softDeleteRowsByFieldValue(page, 'event_finances', 'description', financeDesc)
      )
      .toBe(true)
    await expect
      .poll(() => softDeleteRowsByFieldValue(page, 'events', 'name', eventName))
      .toBe(true)
  }
})
