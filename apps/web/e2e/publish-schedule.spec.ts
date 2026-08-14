/**
 * 剪辑工作台发布排期端到端
 * 用途：登录谢洁 → 新建排期 → 列表可见 → 状态流转 → 删除回收。
 * 覆盖：publish_schedules RLS（editing 建/改/软删）、表单校验字段、状态机下拉。
 * 所属工作台：剪辑（谢洁）
 * 权限：需要 editing 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import { accounts, login } from './helpers'

test.skip(
  !process.env.TK_OBSERVER_TEST_PASSWORD,
  '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例'
)

test('发布排期-新建可见-状态流转-删除回收', async ({ page }) => {
  await login(page, accounts.editing)
  const title = `E2E排期-${Date.now()}`

  await page.goto('/editing')
  await page.getByRole('tab', { name: '视频任务与归档' }).click()
  await page.getByRole('tab', { name: '发布排期' }).click()

  await page.getByRole('button', { name: '新建排期' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog
    .locator('input[placeholder="如：厦门闭门沙龙切片"]')
    .fill(title)
  await dialog.locator('input[type="datetime-local"]').fill('2026-09-20T10:00')
  await dialog.getByRole('button', { name: '保存' }).click()
  await expect(dialog).toHaveCount(0)

  const row = page.locator('tbody tr', { hasText: title })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('已排期')

  // 状态流转：已排期 → 已发布
  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: '已发布' }).click()
  await expect(row).toContainText('已发布')

  // 删除回收（window.confirm 接受）
  page.on('dialog', (dialog) => void dialog.accept())
  await row.getByRole('button', { name: `删除 ${title}` }).click()
  await expect(page.locator('tbody tr', { hasText: title })).toHaveCount(0)
})
