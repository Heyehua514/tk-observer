import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { TeamMemoryContent } from './team-memory'

it('shows the daily brief, top lessons and measurable automation loop', async () => {
  const screen = await render(
    <TeamMemoryContent
      data={{
        dailyHighlight:
          '今日新增客户 2 个、选题 5 条；商机阶段变化 3 次，完成活动任务 4 项。',
        dailyDate: '2026-08-06T00:00:00Z',
        topLessons: [
          { reason: '报价过高', count: 3 },
          { reason: '跟进超期', count: 2 },
          { reason: '需求不匹配', count: 1 },
        ],
        loop: { cronRuns: 6, templateUses: 12, failedCases: 7 },
      }}
    />
  )

  await expect.element(screen.getByText('团队记忆')).toBeInTheDocument()
  await expect.element(screen.getByText('今日简报')).toBeInTheDocument()
  await expect.element(screen.getByText(/新增客户 2 个/)).toBeInTheDocument()
  await expect.element(screen.getByText('报价过高')).toBeInTheDocument()
  await expect.element(screen.getByText('本周 cron')).toBeInTheDocument()
  await expect.element(screen.getByText('模板使用')).toBeInTheDocument()
  await expect.element(screen.getByText('失败沉淀')).toBeInTheDocument()
  await expect.element(screen.getByText('12')).toBeInTheDocument()
})

it('guides the boss when team memory has not accumulated data yet', async () => {
  const screen = await render(
    <TeamMemoryContent
      data={{
        dailyHighlight: '',
        dailyDate: '',
        topLessons: [],
        loop: { cronRuns: 0, templateUses: 0, failedCases: 0 },
      }}
    />
  )

  await expect.element(screen.getByText(/今日日报尚未生成/)).toBeInTheDocument()
  await expect
    .element(screen.getByText(/本月还没有失败案例/))
    .toBeInTheDocument()
})
