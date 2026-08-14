/**
 * 市场工作台场地筛选/搜索端到端
 * 用途：登录韩素云 → 建两个不同城市/类型/标签的场地 → 名称搜索、标签搜索、城市筛选、类型筛选 → 重置 → 删除回收。
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

test('场地名称/标签搜索 + 城市/类型筛选 + 重置回收', async ({ page }) => {
  const ts = Date.now()
  const nameA = `E2E筛选场地A-${ts}`
  const nameB = `E2E筛选场地B-${ts}`
  await login(page, accounts.market)
  // 清理历史失败运行残留，避免污染筛选断言
  await softDeleteVenuesByPrefix(page, 'E2E筛选场地')
  await page.goto('/market')
  await page.getByRole('tab', { name: '场地资源' }).click()

  async function createVenue(
    name: string,
    city: string,
    typeLabel: string,
    tags: string
  ) {
    await page.getByRole('button', { name: '新增场地' }).click()
    const form = page.getByRole('dialog')
    const textInputs = form.locator(
      'input:not([type=file]):not([type=number]):not([type=date])'
    )
    await textInputs.nth(0).fill(name)
    await textInputs.nth(1).fill(city)
    await textInputs.nth(4).fill(tags)
    await form.getByRole('combobox').click()
    await page.getByRole('option', { name: typeLabel }).click()
    await form.getByRole('button', { name: '保存' }).click()
    await expect(
      page.locator('[data-slot=card]', { hasText: name })
    ).toHaveCount(1)
  }

  await createVenue(nameA, '厦门', '五星酒店', '私密,海景')
  await createVenue(nameB, '上海', '创意空间', '网红,有LED屏')

  const cardA = page.locator('[data-slot=card]', { hasText: nameA })
  const cardB = page.locator('[data-slot=card]', { hasText: nameB })
  const search = page.getByPlaceholder('搜索场地名称或标签')
  const combos = page.getByRole('combobox')

  // 1. 名称搜索：只命中 A
  await search.fill(nameA)
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  // 2. 标签搜索：只命中 A（海景）
  await search.fill('海景')
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  // 3. 城市筛选：厦门 → A；上海 → B
  await search.fill('')
  await combos.nth(0).click()
  await page.getByRole('option', { name: '厦门' }).click()
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  await combos.nth(0).click()
  await page.getByRole('option', { name: '上海' }).click()
  await expect(cardA).toHaveCount(0)
  await expect(cardB).toHaveCount(1)

  // 4. 类型筛选：五星酒店 → A；创意空间 → B
  await combos.nth(0).click()
  await page.getByRole('option', { name: '全部城市' }).click()
  await combos.nth(1).click()
  await page.getByRole('option', { name: '五星酒店' }).click()
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(0)

  // 5. 重置后两个场地都可见
  await combos.nth(1).click()
  await page.getByRole('option', { name: '全部类型' }).click()
  await expect(cardA).toHaveCount(1)
  await expect(cardB).toHaveCount(1)

  // 6. 删除回收
  await cardA.getByRole('button', { name: '删除场地' }).click()
  await expect(cardA).toHaveCount(0)
  await expect.poll(() => softDeleteVenue(page, nameA)).toBe(true)
  await cardB.getByRole('button', { name: '删除场地' }).click()
  await expect(cardB).toHaveCount(0)
  await expect.poll(() => softDeleteVenue(page, nameB)).toBe(true)
})
