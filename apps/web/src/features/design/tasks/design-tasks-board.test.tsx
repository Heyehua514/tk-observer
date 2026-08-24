import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { DesignTasksBoard } from './design-tasks-board'

vi.mock('@/features/design/tasks/use-design-tasks', () => ({
  useDesignTasks: () => ({
    data: [
      {
        id: 'task-1',
        title: '主视觉海报',
        status: 'todo',
        dueAt: '2026-08-25',
        region: 'US',
      },
      {
        id: 'task-2',
        title: '商品详情页',
        status: 'todo',
        dueAt: '2026-08-26',
        region: 'US',
      },
    ],
  }),
  useCreateDesignTask: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateDesignTask: () => ({ mutate: vi.fn() }),
}))

it('shows an AI analysis entry on design task cards', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <DesignTasksBoard />
    </QueryClientProvider>
  )
  await expect
    .element(screen.getByRole('button', { name: '分析任务：主视觉海报' }))
    .toBeInTheDocument()
})

it('replaces the AI prompt after selecting another design task', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <DesignTasksBoard />
    </QueryClientProvider>
  )

  await screen.getByRole('button', { name: '分析任务：主视觉海报' }).click()
  const input = screen.getByPlaceholder(
    '例如：调研 TikTok 美区美妆类目 7 月畅销品，给出 Top 5 与共性。'
  )
  await expect.element(input).toHaveValue(expect.stringContaining('主视觉海报'))

  await screen.getByRole('button', { name: '分析任务：商品详情页' }).click()
  await expect.element(input).toHaveValue(expect.stringContaining('商品详情页'))
})
