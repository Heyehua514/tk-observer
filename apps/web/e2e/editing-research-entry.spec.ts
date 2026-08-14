/**
 * 剪辑工作台对标录入与热点话题端到端
 * 用途：谢洁录入对标账号爆款视频/分析笔记、粘贴风格分析结果、批量解析热点话题并转为选题。
 * 所属工作台：剪辑（谢洁）
 * 权限：需要 editing 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  findRowId,
  insertCompetitorAccount,
  login,
  softDeleteRowsByFieldValue,
  softDeleteRowsByFieldPrefix,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('对标视频录入与分析笔记更新', async ({ page }) => {
  await login(page, accounts.editing)
  const stamp = Date.now()
  const accountName = `E2E对标-${stamp}`
  const title = `E2E对标视频-${stamp}`
  await page.goto('/editing?section=competitors')
  await expect
    .poll(() => insertCompetitorAccount(page, { name: accountName }))
    .toBe(true)
  await page.reload()

  try {
    // 选择刚创建的对标账号
    await page.getByRole('button', { name: accountName }).click()

    // 新增爆款视频
    await page.getByRole('button', { name: '新增视频' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('视频标题').fill(title)
    await dialog.getByLabel('视频链接').fill('https://example.com/video')
    await dialog.getByLabel('发布日期').fill('2026-08-01')
    await dialog.getByLabel('播放量').fill('120000')
    await dialog.getByLabel('点赞数').fill('3000')
    await dialog.getByLabel('内容标签').fill('选品,供应链')
    await dialog.getByLabel('为什么爆').fill('开头 3 秒给反常识数据')
    await dialog.getByLabel('可借鉴点').fill('可做成每周固定盘点栏目')
    await dialog.getByRole('button', { name: '保存' }).click()
    await expect(
      page.locator('article', { hasText: title }).getByText('120,000')
    ).toBeVisible()

    // 更新分析笔记并回显
    const videoCard = page.locator('article', { hasText: title })
    await videoCard.getByRole('button', { name: '分析笔记' }).click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog.getByLabel('视频标题')).toHaveValue(title)
    await editDialog.getByLabel('为什么爆').fill('更新后的爆款原因：强对比开头')
    await editDialog.getByRole('button', { name: '保存' }).click()
    await expect(
      page.locator('article', { hasText: title }).getByText('更新后的爆款原因')
    ).toBeVisible()
  } finally {
    await softDeleteRowsByFieldPrefix(
      page,
      'competitor_videos',
      'title',
      `E2E对标视频-${stamp}`
    )
    await expect
      .poll(() =>
        softDeleteRowsByFieldPrefix(
          page,
          'competitor_accounts',
          'name',
          accountName
        )
      )
      .toBe(true)
  }
})

test('对标账号风格分析粘贴解析保存', async ({ page }) => {
  await login(page, accounts.editing)
  const stamp = Date.now()
  const accountName = `E2E对标-${stamp}`
  await page.goto('/editing?section=competitors')
  await expect
    .poll(() => insertCompetitorAccount(page, { name: accountName }))
    .toBe(true)
  await page.reload()

  try {
    const card = page.locator('article', { hasText: accountName })
    await card.getByRole('button', { name: accountName }).click()
    await card.getByRole('button', { name: '分析风格' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('粘贴 AI 分析结果').fill(
      [
        '内容风格：数据驱动型口播，开头直给结论',
        '标题套路：数字+反差句式',
        '钩子手法：前 3 秒抛反常识数据',
        '剪辑手法：快切+BGM 卡点',
        '爆款因素：选题切中跨境卖家焦虑',
        '对 TK观察的可借鉴建议：每周固定做一条数据盘点类选题',
      ].join('\n')
    )
    await dialog.getByRole('button', { name: '解析并保存' }).click()
    await expect(
      page.getByRole('heading', { name: '风格分析历史' })
    ).toBeVisible()
    await expect(page.getByText('数据驱动型口播，开头直给结论')).toBeVisible()
    await expect(
      page.getByText('每周固定做一条数据盘点类选题')
    ).toBeVisible()
  } finally {
    const accountId = await findRowId(
      page,
      'competitor_accounts',
      'name',
      accountName
    )
    if (accountId) {
      await softDeleteRowsByFieldValue(
        page,
        'competitor_style_analysis',
        'competitor_id',
        accountId
      )
    }
    await expect
      .poll(() =>
        softDeleteRowsByFieldPrefix(
          page,
          'competitor_accounts',
          'name',
          accountName
        )
      )
      .toBe(true)
  }
})

test('热点话题批量解析入库与转为选题', async ({ page }) => {
  await login(page, accounts.editing)
  const stamp = Date.now()
  const topicA = `E2E热点A-${stamp}`
  const topicB = `E2E热点B-${stamp}`
  await page.goto('/editing?section=trends')

  try {
    await page.getByRole('button', { name: '调研趋势' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('AI 调研结果').fill(
      [
        `话题：${topicA}`,
        '来源：行业报告',
        '关键词：跨境,选品',
        '热度：高',
        '选题启发：适合拍成口播',
        '参考链接：https://example.com/a',
        '---',
        `话题：${topicB}`,
        '来源：社群讨论',
        '关键词：达人,建联',
        '热度：中',
        '选题启发：适合饭局访谈',
      ].join('\n')
    )
    await dialog.getByRole('button', { name: '解析并保存' }).click()
    await expect(page.getByText(`已保存 2 条热点话题`)).toBeVisible()
    const cardA = page.locator('article', { hasText: topicA })
    const cardB = page.locator('article', { hasText: topicB })
    await expect(cardA).toHaveCount(1)
    await expect(cardB).toHaveCount(1)
    await expect(cardA.getByText('高热度')).toBeVisible()
    await expect(cardB.getByText('中热度')).toBeVisible()

    // 转为选题：跳到选题库并预填标题
    await cardA.getByRole('button', { name: '转为选题' }).click()
    const form = page.getByRole('dialog')
    await expect(form.getByRole('heading', { name: '新增视频选题' })).toBeVisible()
    await expect(
      form.locator('input[placeholder="例如：东南亚选品最容易踩的 3 个坑"]')
    ).toHaveValue(topicA)
    await form.getByRole('button', { name: '取消' }).click()
  } finally {
    await softDeleteRowsByFieldPrefix(
      page,
      'trending_topics',
      'topic',
      `E2E热点`
    )
  }
})
