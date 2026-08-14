/**
 * 市场工作台场地资源端到端
 * 用途：登录韩素云 → 新增场地（多张照片上传）→ 列表卡片可见 → 详情照片轮播可切换 → 删除回收。
 * 所属工作台：市场（韩素云）
 * 权限：需要 market 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteVenue,
  TEST_PASSWORD,
  TINY_PNG,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('场地新增-多图上传-详情轮播切换-删除回收', async ({ page }) => {
  await login(page, accounts.market)
  const name = `E2E场地-${Date.now()}`
  await page.goto('/market')
  await page.getByRole('tab', { name: '场地资源' }).click()

  // 1. 新增场地：必填字段 + 照片上传
  await page.getByRole('button', { name: '新增场地' }).click()
  const form = page.getByRole('dialog')
  const textInputs = form.locator(
    'input:not([type=file]):not([type=number]):not([type=date])'
  )
  await textInputs.nth(0).fill(name)
  await textInputs.nth(1).fill('厦门')
  await form.locator('input[type=file]').setInputFiles([
    { name: 'venue-1.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'venue-2.png', mimeType: 'image/png', buffer: TINY_PNG },
  ])
  await form.getByRole('button', { name: '保存' }).click()

  // 2. 列表卡片可见，封面渲染
  const card = page.locator('[data-slot=card]', { hasText: name })
  await expect(card).toHaveCount(1)
  await expect(card.locator(`img[alt="${name}"]`)).toBeVisible()

  // 3. 详情：照片轮播可见
  await card.click()
  const detail = page.getByRole('dialog')
  await expect(detail.getByRole('heading', { name })).toBeVisible()
  await expect(
    detail.locator(`img[alt^="${name} 场地照片"]`)
  ).toBeVisible()
  // 多图：默认第 1 张，切到第 2 张
  await expect(detail.locator(`img[alt="${name} 场地照片 1"]`)).toBeVisible()
  await detail.getByRole('button', { name: '下一张' }).click()
  await expect(detail.locator(`img[alt="${name} 场地照片 2"]`)).toBeVisible()
  await detail.getByRole('button', { name: '上一张' }).click()
  await expect(detail.locator(`img[alt="${name} 场地照片 1"]`)).toBeVisible()
  await detail.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // 4. 删除回收（软删除）
  const card2 = page.locator('[data-slot=card]', { hasText: name })
  await card2.getByRole('button', { name: '删除场地' }).click()
  await expect(page.locator('[data-slot=card]', { hasText: name })).toHaveCount(
    0
  )

  // 5. 兜底清理：确认数据库中无残留
  await expect.poll(() => softDeleteVenue(page, name)).toBe(true)
})
