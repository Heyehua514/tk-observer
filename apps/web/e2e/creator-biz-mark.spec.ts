/**
 * 商务工作台达人商务标记端到端
 * 用途：谢洁建达人 → 董雨辰标记可商务合作（报价/备注）→ 列表与详情只读展示 → 商单达人搜索只列可商务达人 → 谢洁软删回收。
 * 所属工作台：商务（董雨辰）+ 剪辑（谢洁）跨角色
 * 权限：需要 editing 测试账号建达人（RLS：business 只能更新商务字段）；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  insertCreator,
  login,
  softDeleteCreatorsByPrefix,
  switchAccount,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('达人商务标记：可商务合作标记 + 只读展示 + 商单筛选', async ({ page }) => {
  const ts = Date.now()
  const nickname = `E2E商务标记-${ts}`
  const prefix = 'E2E商务标记-'

  // 0. 谢洁先清理历史失败运行残留，再建测试达人
  await login(page, accounts.editing)
  await softDeleteCreatorsByPrefix(page, prefix)
  await expect(
    await insertCreator(page, {
      nickname,
      tiktokUrl: `https://www.tiktok.com/@e2e-biz-${ts}`,
    })
  ).toBe(true)

  // 1. 董雨辰打开达人管理，搜索到新达人（默认未标记）
  await switchAccount(page, accounts.business)
  await page.goto('/business?tab=creators')
  await page.getByPlaceholder('搜索昵称、主页或对接人').fill(nickname)
  const row = page.locator('tbody tr', { hasText: nickname })
  await expect(row).toHaveCount(1)
  await expect(row.getByText('可商务合作')).toHaveCount(0)

  // 2. 编辑：打开可商务合作 + 填报价与备注
  await row.getByRole('button', { name: '达人操作' }).click()
  await page.getByRole('menuitem', { name: '编辑' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('switch').click()
  await dialog.getByPlaceholder('留空表示待议').fill('880')
  await dialog.getByPlaceholder('如：含植入脚本、素材授权范围等').fill('含脚本植入授权')
  await dialog.getByRole('button', { name: '保存修改' }).click()

  // 3. 列表出现商务标记，详情只读展示三个字段
  await expect(row.getByText('可商务合作')).toHaveCount(1)
  await row.getByRole('button', { name: nickname }).click()
  await expect(page.getByText('含脚本植入授权')).toBeVisible()
  await expect(page.getByText('¥880')).toBeVisible()
  await page.keyboard.press('Escape')

  // 4. 「只看可商务合作」筛选仍能看到该达人
  await page.getByRole('combobox').filter({ hasText: '全部达人' }).click()
  await page.getByRole('option', { name: '只看可商务合作' }).click()
  await expect(row).toHaveCount(1)

  // 5. 商单新增表单的达人搜索只列可商务达人（含刚标记的达人）
  await page.goto('/business?tab=orders')
  await page.getByRole('button', { name: '新增商单' }).click()
  const orderDialog = page.getByRole('dialog')
  await orderDialog.getByRole('combobox').nth(1).click()
  await expect(page.getByRole('option', { name: new RegExp(nickname) })).toBeVisible()
  await expect(
    page.getByRole('option', { name: /E2E可商务达人/ })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  // 6. 谢洁软删回收测试达人
  await switchAccount(page, accounts.editing)
  await expect(
    await softDeleteCreatorsByPrefix(page, prefix)
  ).toBe(true)
})
