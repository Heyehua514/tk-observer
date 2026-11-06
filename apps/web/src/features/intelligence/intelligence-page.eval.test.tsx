import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { IntelligencePage } from './intelligence-page'

const {
  createIntelligenceItem,
  updateIntelligenceItem,
  convertIntelligenceItemToTask,
} = vi.hoisted(() => ({
  createIntelligenceItem: vi.fn(),
  updateIntelligenceItem: vi.fn(),
  convertIntelligenceItemToTask: vi.fn(),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (state: { user: { name: string; role: string } }) => unknown
  ) => selector({ user: { name: '测试老板', role: 'owner' } }),
}))
vi.mock('@/features/intelligence/hooks/use-intelligence-items', () => ({
  useIntelligenceItems: () => ({
    data: [
      {
        id: 'eval-item-1',
        title: '平台规则更新',
        summary: '需要运营评估影响。',
        sourceName: '官方来源',
        sourceType: 'official',
        sourceUrl: 'https://example.com/rule',
        capturedAt: '2026-08-24T01:00:00.000Z',
        region: '中国',
        language: 'zh-CN',
        topic: '平台规则',
        heatScore: 90,
        confidence: 0.95,
        dedupeKey: 'official:rule-1',
        workspaces: ['operations'],
        status: 'unread',
        createdBy: 'owner-1',
        createdAt: '2026-08-24T01:00:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdateIntelligenceItem: () => ({
    mutateAsync: updateIntelligenceItem,
    isPending: false,
  }),
}))

vi.mock('@/features/intelligence/hooks/use-create-intelligence-item', () => ({
  useCreateIntelligenceItem: () => ({
    mutateAsync: createIntelligenceItem,
    isPending: false,
  }),
}))
vi.mock(
  '@/features/intelligence/hooks/use-convert-intelligence-item-to-task',
  () => ({
    useConvertIntelligenceItemToTask: () => ({
      mutateAsync: convertIntelligenceItemToTask,
      isPending: false,
    }),
  })
)

beforeEach(() => {
  createIntelligenceItem.mockResolvedValue(undefined)
  updateIntelligenceItem.mockResolvedValue(undefined)
  convertIntelligenceItemToTask.mockResolvedValue({
    id: 'eval-task-1',
    title: '平台规则更新',
    assigneeName: '测试老板',
    dueAt: '',
    region: 'US',
  })
  vi.clearAllMocks()
})

it('creates a real task and leaves intelligence status writes to the RPC', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <IntelligencePage />
    </QueryClientProvider>
  )

  await screen.getByRole('button', { name: '转为任务' }).click()
  await expect
    .element(
      screen.getByText(
        '将创建真实团队任务，并原子标记该情报为已转任务。重复提交不会创建第二项任务。'
      )
    )
    .toBeInTheDocument()
  await screen.getByRole('button', { name: '创建任务' }).click()

  expect(convertIntelligenceItemToTask).toHaveBeenCalledWith({
    id: 'eval-item-1',
    assigneeName: '测试老板',
    dueAt: '',
    region: 'US',
  })
  expect(updateIntelligenceItem).not.toHaveBeenCalled()
  expect(createIntelligenceItem).not.toHaveBeenCalled()
})
