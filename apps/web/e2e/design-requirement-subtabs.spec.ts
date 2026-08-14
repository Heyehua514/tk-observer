/**
 * 设计需求详情子 Tab 端到端
 * 用途：孙铭泽建素材并提审 → 磊哥审核通过 → 磊哥提需求 → 孙铭泽在详情加视觉参考与交付记录 → 磊哥只读看到交付记录、无编辑表单。
 * 所属工作台：设计（孙铭泽 / 磊哥）
 * 权限：需要 boss + design 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteDesignAsset,
  softDeleteRowsByFieldPrefix,
  TEST_PASSWORD,
  TINY_PNG,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('需求详情-参考与交付记录闭环', async ({ browser }) => {
  const ts = Date.now()
  const assetName = `E2E素材-子Tab-${ts}`
  const reqTitle = `E2E需求-子Tab-${ts}`
  const source = `E2E参考-${ts}`
  const size = `E2E尺寸-${ts}`

  // 1. 孙铭泽上传素材并提审
  const designContext = await browser.newContext()
  const designPage = await designContext.newPage()
  await login(designPage, accounts.design)
  await designPage.goto('/design')
  await designPage.getByRole('tab', { name: '素材库' }).click()
  await designPage.getByRole('button', { name: '上传素材' }).click()
  const upload = designPage.getByRole('dialog')
  await upload.locator('input[name=fileName]').fill(assetName)
  await upload
    .locator('input[type=file]')
    .setInputFiles({ name: 'e2e.png', mimeType: 'image/png', buffer: TINY_PNG })
  await upload.locator('input[name=dimensions]').fill('1080 x 1920')
  await upload.getByRole('button', { name: '上传素材' }).click()
  const designCard = designPage.locator('article', { hasText: assetName })
  await expect(designCard.getByText('草稿')).toBeVisible()
  await designCard.getByRole('button', { name: '提交审核' }).click()
  await expect(designCard.getByText('待审核')).toBeVisible()

  // 2. 磊哥审核通过
  const bossContext = await browser.newContext()
  const bossPage = await bossContext.newPage()
  await login(bossPage, accounts.boss)
  await bossPage.goto('/design')
  await bossPage.getByRole('tab', { name: '素材库' }).click()
  const bossCard = bossPage.locator('article', { hasText: assetName })
  await expect(bossCard).toHaveCount(1)
  await bossCard.getByRole('button', { name: '审核' }).click()
  await bossPage.getByRole('dialog').getByRole('button', { name: '通过' }).click()
  await expect(bossCard.getByText('已通过')).toBeVisible()

  // 3. 磊哥提需求
  await bossPage.goto('/design')
  await bossPage.getByRole('button', { name: '提交设计需求' }).click()
  const form = bossPage.getByRole('dialog')
  await form.locator('input[name=title]').fill(reqTitle)
  await form.locator('input[name=dueDate]').fill('2026-09-01')
  await form.locator('input[name=targetSize]').fill('1080×1920')
  await form.locator('input[name=usageScene]').fill('朋友圈海报')
  await form.locator('input[name=deliveryFormat]').fill('PNG')
  await form.locator('textarea[name=description]').fill('E2E 参考与交付闭环需求描述')
  await form.locator('textarea[name=copyContent]').fill('E2E 参考与交付闭环文案')
  await form.getByRole('button', { name: '提交需求' }).click()
  await expect(bossPage.locator('tbody tr', { hasText: reqTitle })).toHaveCount(1)

  // 4. 孙铭泽在详情加视觉参考
  await designPage.goto('/design')
  const row = designPage.locator('tbody tr', { hasText: reqTitle })
  await expect(row).toHaveCount(1)
  await row.click()
  let detail = designPage.getByRole('dialog')
  await detail.getByRole('tab', { name: '视觉参考' }).click()
  await detail.locator('input[name=imageUrl]').fill('https://example.com/reference')
  await detail.locator('input[name=source]').fill(source)
  await detail.locator('textarea[name=notes]').fill('E2E 参考备注')
  await detail.getByRole('button', { name: '添加参考' }).click()
  await expect(designPage.getByText(source)).toBeVisible()
  await expect(designPage.getByText('E2E 参考备注')).toBeVisible()

  // 5. 孙铭泽选已通过素材加交付记录
  await detail.getByRole('tab', { name: '交付记录' }).click()
  await detail.getByRole('combobox').click()
  await designPage.getByRole('option', { name: assetName }).click()
  await detail.locator('input[name=size]').fill(size)
  await detail.locator('input[name=format]').fill('PNG')
  await detail.locator('input[name=checklist]').check()
  await detail.getByRole('button', { name: '添加交付' }).click()
  await expect(designPage.getByText(size)).toBeVisible()
  await expect(designPage.getByText('检查通过', { exact: true })).toBeVisible()

  // 6. 磊哥只读看到交付记录，无编辑表单
  await bossPage.reload()
  await bossPage.locator('tbody tr', { hasText: reqTitle }).click()
  detail = bossPage.getByRole('dialog')
  await detail.getByRole('tab', { name: '交付记录' }).click()
  await expect(bossPage.getByText(assetName)).toBeVisible()
  await expect(bossPage.getByText(size)).toBeVisible()
  await expect(bossPage.getByText('检查通过', { exact: true })).toBeVisible()
  await expect(bossPage.getByRole('button', { name: '添加交付' })).toHaveCount(0)
  await detail.getByRole('tab', { name: '视觉参考' }).click()
  await expect(bossPage.getByRole('button', { name: '添加参考' })).toHaveCount(0)

  // 7. 回收：交付/参考/素材/需求按依赖顺序软删除
  await expect
    .poll(() =>
      softDeleteRowsByFieldPrefix(
        designPage,
        'design_deliverables',
        'exported_size',
        size
      )
    )
    .toBe(true)
  await expect
    .poll(() =>
      softDeleteRowsByFieldPrefix(designPage, 'design_references', 'source', source)
    )
    .toBe(true)
  await expect.poll(() => softDeleteDesignAsset(designPage, assetName)).toBe(true)
  await expect
    .poll(() =>
      softDeleteRowsByFieldPrefix(
        bossPage,
        'design_requirements',
        'title',
        reqTitle
      )
    )
    .toBe(true)
  await bossContext.close()
  await designContext.close()
})
