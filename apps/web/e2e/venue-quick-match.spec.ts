/**
 * 市场工作台场地快速匹配端到端
 * 用途：韩素云建两个不同城市/类型/容纳人数的场地 → 快速匹配面板按城市、活动人数、场地类型组合筛选 → 收起面板 → 软删回收。
 * 所属工作台：市场（韩素云）
 * 权限：需要 market 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteVenue,
  softDeleteVenuesByPrefix,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('场地快速匹配城市/人数/类型组合筛选-收起-回收', async ({ page }) => {
  const ts = Date.now()
  const nameA = `E2E匹配场地A-${ts}`
  const nameB = `E2E匹配场地B-${ts}`
  await login(page, accounts.market)
  // 清理历史失败运行残留，避免污染匹配断言
  await softDeleteVenuesByPrefix(page, 'E2E匹配场地')
  await page.goto('/market')
  await page.getByRole('tab', { name: '场地资源' }).click()

  async function createVenue(
    name: string,
    city: string,
    typeLabel: string,
    minCap: string,
    maxCap: string
  ) {
    await page.getByRole('button', { name: '新增场地' }).click()
    const form = page.getByRole('dialog')
    const textInputs = form.locator(
      'input:not([type=file]):not([type=number]):not([type=date])'
    )
    await textInputs.nth(0).fill(name)
    await textInputs.nth(1).fill(city)
    const numbers = form.locator('input[type=number]')
    await numbers.nth(0).fill(minCap)
    await numbers.nth(1).fill(maxCap)
    await form.getByRole('combobox').click()
    await page.getByRole('option', { name: typeLabel }).click()
    await form.getByRole('button', { name: '保存' }).click()
    await expect(
      page.locator('[data-slot=card]', { hasText: name })
    ).toHaveCount(1)
  }

  await createVenue(nameA, '厦门', '五星酒店', '50', '100')
  await createVenue(nameB, '上海', '创意空间', '200', '300')

  const cardA = page.locator('[data-slot=card]', { hasText: nameA })
  const cardB = page.locator('[data-slot=card]', { hasText: nameB })
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(1)

  // 打开快速匹配面板并定位其专属控件
  await page.getByRole('button', { name: '快速匹配' }).click()
  const panel = page.locator('div.rounded-md.border', {
    hasText: '快速匹配活动需求',
  })
  await expect(panel).toHaveCount(1)
  const cityCombo = panel.getByRole('combobox').nth(0)
  const typeCombo = panel.getByRole('combobox').nth(1)
  const attendees = panel.locator('input[type=number]')

  // 1. 城市=厦门 → 只命中 A
  await cityCombo.click()
  await page.getByRole('option', { name: '厦门' }).click()
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  // 2. 活动人数=80（A 容量 50-100 命中，B 被城市排除）
  await attendees.fill('80')
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  // 3. 城市=上海 + 人数 80（B 容量 200-300 不命中）→ 两个都不显示
  await cityCombo.click()
  await page.getByRole('option', { name: '上海' }).click()
  await expect(cardA).toHaveCount(0)
  await expect(cardB).toHaveCount(0)

  // 4. 人数=250 → B 命中，A 被城市排除
  await attendees.fill('250')
  await expect(cardA).toHaveCount(0)
  await expect(cardB).toHaveCount(1)

  // 5. 清空人数（否则 250 超出 A 容量）→ 城市=全部 → 类型=五星酒店 → 只命中 A
  await attendees.fill('')
  await cityCombo.click()
  await page.getByRole('option', { name: '全部城市' }).click()
  await typeCombo.click()
  await page.getByRole('option', { name: '五星酒店' }).click()
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  // 6. 收起面板
  await panel.getByRole('button', { name: '收起匹配' }).click()
  await expect(panel).toHaveCount(0)

  // 7. 清理回收：软删两个场地
  expect(await softDeleteVenue(page, nameA)).toBe(true)
  expect(await softDeleteVenue(page, nameB)).toBe(true)
})
