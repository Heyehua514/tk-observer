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
