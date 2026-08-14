/**
 * 市场工作台活动任务看板拖拽端到端
 * 用途：韩素云建活动 → REST 注入 P0 阶段与任务 → 任务看板拖拽（待处理→进行中）→ 状态列变化断言 → 软删回收。
 * 所属工作台：市场（韩素云）
 * 权限：需要 market 测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { expect, test } from 'playwright/test'
import {
  accounts,
  insertEventPhase,
  insertEventTask,
  login,
  softDeleteEvent,
  softDeleteEventPhases,
  softDeleteEventTasks,
  TEST_PASSWORD,
} from './helpers'

test.skip(!TEST_PASSWORD, '未配置 TK_OBSERVER_TEST_PASSWORD，跳过 E2E 登录用例')

test('活动任务看板拖拽流转-状态列更新-清理回收', async ({ page }) => {
  await login(page, accounts.market)
  const ts = Date.now()
  const eventName = `E2E任务看板-${ts}`
  const taskTodo = `E2E看板任务A-${ts}`
  const taskDoing = `E2E看板任务B-${ts}`

  // 1. 新建活动并进入详情
  await page.goto('/market')
  await page.getByRole('tab', { name: '活动排期' }).click()
  await page.getByPlaceholder('活动名称').fill(eventName)
  await page.getByPlaceholder('城市').fill('厦门')
  await page
    .locator('input[type=date]')
    .filter({ visible: true })
    .fill('2026-09-10')
  await page.getByRole('button', { name: '新建活动' }).click()
  const row = page.locator('tbody tr', { hasText: eventName })
  await expect(row).toHaveCount(1)
  await row.getByRole('link').click()
  await page.waitForURL(/\/market\/events\/.+/)
  const eventId = page.url().split('/').pop() ?? ''
  expect(eventId).toBeTruthy()

  // 2. REST 注入 P0 阶段 + 两条任务（todo / in_progress）
  const phaseId = await insertEventPhase(page, {
    eventId,
    name: 'P0 立项定档',
    phaseOrder: 0,
  })
  expect(phaseId).toBeTruthy()
  expect(
    await insertEventTask(page, {
      eventId,
      phaseId,
      title: taskTodo,
      assigneeRole: 'market',
      status: 'todo',
    })
  ).toBe(true)
  expect(
    await insertEventTask(page, {
      eventId,
      phaseId,
      title: taskDoing,
      assigneeRole: 'market',
      status: 'in_progress',
    })
  ).toBe(true)

  // 3. 重载详情进入任务看板，两列各就各位
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await page.getByRole('tab', { name: '任务看板' }).click()
  const columnByLabel = (label: string) =>
    page.locator('h3', { hasText: label }).locator('..')
  const todoColumn = columnByLabel('待处理')
  const doingColumn = columnByLabel('进行中')
  await expect(todoColumn).toHaveCount(1)
  await expect(doingColumn).toHaveCount(1)
  await expect(todoColumn.getByText(taskTodo, { exact: true })).toHaveCount(1)
  await expect(
    doingColumn.getByText(taskDoing, { exact: true })
  ).toHaveCount(1)

  // 4. 拖拽任务 A：待处理 → 进行中，列变化实时生效
  const cardTodo = page.locator('div.cursor-grab', { hasText: taskTodo })
  await expect(cardTodo).toHaveCount(1)
  await cardTodo.dragTo(doingColumn)
  await expect(
    doingColumn.getByText(taskTodo, { exact: true })
  ).toHaveCount(1)
  await expect(todoColumn.getByText(taskTodo, { exact: true })).toHaveCount(0)

  // 5. 清理回收：软删任务 → 阶段 → 活动
  expect(await softDeleteEventTasks(page, eventId)).toBe(true)
  expect(await softDeleteEventPhases(page, eventId)).toBe(true)
  expect(await softDeleteEvent(page, eventId)).toBe(true)
})
