/**
 * 设计素材审核闭环端到端
 * 用途：孙铭泽上传素材 → 提审 → 磊哥驳回（理由必填）→ 修改后再提审 → 磊哥通过。
 * 所属工作台：设计（孙铭泽 / 磊哥）
 * 权限：需要 boss + design 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  login,
  softDeleteDesignAsset,
  TEST_PASSWORD,
  TINY_PNG,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('素材上传-提审-驳回-再提审-通过闭环', async ({ browser }) => {
  const assetName = `E2E素材-${Date.now()}`
  const designContext = await browser.newContext()
  const designPage = await designContext.newPage()
  await login(designPage, accounts.design)
  await designPage.goto('/design')
  await designPage.getByRole('tab', { name: '素材库' }).click()

  // 1. 孙铭泽上传素材（草稿）
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

  // 2. 提审：草稿 → 待审核
  await designCard.getByRole('button', { name: '提交审核' }).click()
  await expect(designCard.getByText('待审核')).toBeVisible()

  // 3. 磊哥审核：空理由驳回被前端拦截
  const bossContext = await browser.newContext()
  const bossPage = await bossContext.newPage()
  await login(bossPage, accounts.boss)
  await bossPage.goto('/design')
  await bossPage.getByRole('tab', { name: '素材库' }).click()
  const bossCard = bossPage.locator('article', { hasText: assetName })
  await expect(bossCard).toHaveCount(1)
  await bossCard.getByRole('button', { name: '审核' }).click()
  const review = bossPage.getByRole('dialog')
  await review.getByRole('button', { name: '驳回' }).click()
  await expect(review.getByText('驳回时必须填写理由')).toBeVisible()
  await expect(review).toBeVisible()

  // 4. 磊哥填理由驳回：待审核 → 已驳回
  await review.locator('textarea[name=reason]').fill('E2E 驳回：风格不符合品牌规范')
  await review.getByRole('button', { name: '驳回' }).click()
  await expect(bossCard.getByText('已驳回')).toBeVisible()
  await expect(bossCard.getByText(/驳回理由：E2E 驳回/)).toBeVisible()

  // 5. 孙铭泽看到驳回理由，修改后再提审：已驳回 → 待审核
  await designPage.reload()
  await designPage.getByRole('tab', { name: '素材库' }).click()
  await expect(designCard.getByText('已驳回')).toBeVisible()
  await expect(designCard.getByText(/驳回理由：E2E 驳回/)).toBeVisible()
  await designCard.getByRole('button', { name: '提交审核' }).click()
  await expect(designCard.getByText('待审核')).toBeVisible()

  // 6. 磊哥通过：待审核 → 已通过
  await bossPage.reload()
  await bossPage.getByRole('tab', { name: '素材库' }).click()
  await bossCard.getByRole('button', { name: '审核' }).click()
  await bossPage.getByRole('dialog').getByRole('button', { name: '通过' }).click()
  await expect(bossCard.getByText('已通过')).toBeVisible()

  // 7. 回收：孙铭泽软删除素材，避免残留污染计数
  await expect.poll(() => softDeleteDesignAsset(designPage, assetName)).toBe(true)
  await bossContext.close()
  await designContext.close()
})
