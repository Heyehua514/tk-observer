/**
 * 商务工作台客户筛选端到端
 * 用途：登录董雨辰 → 建两个不同行业/来源/重要度的客户 → 行业/来源/重要度筛选 + 名称/对接人搜索 → 重置 → 软删回收。
 * 所属工作台：商务（董雨辰）
 * 权限：需要 business 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteRowsByFieldValue,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('客户行业/来源/重要度筛选 + 搜索 + 重置回收', async ({ page }) => {
  const ts = Date.now()
  const nameA = `E2E筛选客户A-${ts}`
  const nameB = `E2E筛选客户B-${ts}`
  const contactA = `对接人A-${ts}`
  await login(page, accounts.business)
  await page.goto('/business?tab=clients')

  async function createClient(
    name: string,
    contact: string,
    industry: string,
    source: string,
    level: string
  ) {
    await page.getByRole('button', { name: '新增客户' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input').nth(0).fill(name)
    await dialog.locator('input').nth(2).fill(contact)
    const combos = dialog.getByRole('combobox')
    await combos.nth(0).click()
    await page.getByRole('option', { name: industry }).click()
    await combos.nth(1).click()
    await page.getByRole('option', { name: source }).click()
    await combos.nth(2).click()
    await page.getByRole('option', { name: level }).click()
    await dialog.getByRole('button', { name: '保存' }).click()
    await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(1)
  }

  // A：品牌方 / 活动获客 / S；B：MCN / 朋友圈获客 / A
  await createClient(nameA, contactA, '品牌方', '活动获客', 'S')
  await createClient(nameB, '', 'MCN', '朋友圈获客', 'A')

  const rowA = page.locator('tbody tr', { hasText: nameA })
  const rowB = page.locator('tbody tr', { hasText: nameB })
  const search = page.getByPlaceholder('搜索客户、对接人或公司')
  const combos = page.getByRole('combobox')

  // 1. 名称搜索：只命中 A
  await search.fill(nameA)
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(rowA).toHaveCount(1)

  // 2. 对接人搜索：只命中 A
  await search.fill(contactA)
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(rowA).toHaveCount(1)

  // 3. 行业筛选：品牌方 → A 可见，B 隐藏
  await search.fill('')
  await combos.nth(0).click()
  await page.getByRole('option', { name: '品牌方' }).click()
  await expect(rowA).toHaveCount(1)
  await expect(rowB).toHaveCount(0)

  // 4. 来源筛选（先复位行业）：朋友圈获客 → A 隐藏，B 可见
  await combos.nth(0).click()
  await page.getByRole('option', { name: '全部行业' }).click()
  await combos.nth(1).click()
  await page.getByRole('option', { name: '朋友圈获客' }).click()
  await expect(rowA).toHaveCount(0)
  await expect(rowB).toHaveCount(1)

  // 5. 重要度筛选（先复位来源）：S → A 可见，B 隐藏
  await combos.nth(1).click()
  await page.getByRole('option', { name: '全部来源' }).click()
  await combos.nth(2).click()
  await page.getByRole('option', { name: 'S' }).click()
  await expect(rowA).toHaveCount(1)
  await expect(rowB).toHaveCount(0)

  // 6. 重置后两个客户都可见
  await page.getByRole('button', { name: '重置' }).click()
  await expect(rowA).toHaveCount(1)
  await expect(rowB).toHaveCount(1)

  // 7. 软删回收
  await expect.poll(() =>
    softDeleteRowsByFieldValue(page, 'clients', 'name', nameA)
  ).toBe(true)
  await expect.poll(() =>
    softDeleteRowsByFieldValue(page, 'clients', 'name', nameB)
  ).toBe(true)
})
