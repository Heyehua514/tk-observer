import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AiMemoryView } from './ai-memory-view'

const remove = vi.fn()

vi.mock('@/features/shared-ai/hooks/use-ai-memory', () => ({
  useAiMemory: () => ({
    data: [
      {
        id: 'memory-1',
        memoryType: 'accepted_ai',
        memoryKey: '商务工作台:分析',
        memoryValue: '优先给出下一步动作',
        confidence: 0.7,
        source: 'accepted_ai',
      },
    ],
    isLoading: false,
    remove,
  }),
}))

it('shows personal memories and supports deletion', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <AiMemoryView />
    </QueryClientProvider>
  )
  await expect.element(screen.getByText('个人 AI 记忆')).toBeInTheDocument()
  await expect
    .element(screen.getByText('优先给出下一步动作'))
    .toBeInTheDocument()
  await screen.getByRole('button', { name: '删除记忆' }).click()
  expect(remove).toHaveBeenCalledWith('memory-1')
})
