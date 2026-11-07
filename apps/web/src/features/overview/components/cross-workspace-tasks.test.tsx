/** 跨工作台待办 UI 自检：团队任务必须进入风险区并保留负责人与情报中心链接。 */
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { CrossWorkspaceTasks } from './cross-workspace-tasks'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))
vi.mock('../hooks/use-cross-workspace-tasks', () => ({
  useCrossWorkspaceTasks: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}))

it('shows overdue team work with its owner and intelligence link', async () => {
  const screen = await render(
    <CrossWorkspaceTasks
      tasks={[
        {
          id: 'team-t1',
          title: '跟进公开情报任务',
          workspace: 'team',
          status: 'in_progress',
          dueAt: '2026-10-01T08:00:00Z',
          assigneeName: '董雨辰',
          sourceIntelligenceId: 'intel-1',
        },
      ]}
    />
  )

  await expect.element(screen.getByText('团队')).toBeInTheDocument()
  await expect.element(screen.getByText('负责人: 董雨辰')).toBeInTheDocument()
  await expect.element(screen.getByText(/已逾期/)).toBeInTheDocument()
  await expect
    .element(screen.getByRole('link', { name: /去处理/ }))
    .toHaveAttribute('href', '/intelligence')
})
